import React, { useContext, useEffect, useReducer, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2, Loader, Search, RefreshCw, ShoppingBag } from 'lucide-react';
import { Store } from '../../context/Store';
import LoadingBox from '../common/LoadingBox';
import MessageBox from '../common/MessageBox';
import { getError } from '../../utils/helpers';
import useCategories from '../../hooks/useCategories';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true, error: '' };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        products: action.payload.products,
        page: action.payload.page,
        pages: action.payload.pages,
        loading: false,
      };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    case 'MUTATE_REQUEST':
      return { ...state, loadingMutate: true };
    case 'MUTATE_SUCCESS':
      return { ...state, loadingMutate: false };
    case 'MUTATE_FAIL':
      return { ...state, loadingMutate: false };
    default:
      return state;
  }
};

export default function ProductManagement() {
  const { state } = useContext(Store);
  const { userInfo } = state;

  const [{ loading, error, products, pages, loadingMutate }, dispatch] = useReducer(reducer, {
    loading: true,
    error: '',
    products: [],
  });

  const navigate = useNavigate();
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const page = sp.get('page') || 1;

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { categories } = useCategories();

  const fetchProducts = async () => {
    try {
      dispatch({ type: 'FETCH_REQUEST' });
      const { data } = await axios.get('/api/products/admin', {
        params: {
          page: Number(page),
          search: searchTerm.trim(),
        },
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      dispatch({ type: 'FETCH_SUCCESS', payload: data });
    } catch (err) {
      dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [page, searchTerm, userInfo]);

  const deleteHandler = async (product) => {
    if (window.confirm(`Are you sure you want to delete product "${product.name}"?`)) {
      try {
        dispatch({ type: 'MUTATE_REQUEST' });
        await axios.delete(`/api/products/${product._id}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        toast.success('Product deleted successfully');
        dispatch({ type: 'MUTATE_SUCCESS' });
        fetchProducts();
      } catch (err) {
        toast.error(getError(err));
        dispatch({ type: 'MUTATE_FAIL' });
      }
    }
  };

  const createHandler = () => {
    navigate('/admin/product/new');
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p._id.toString().includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const getStockBadge = (stock) => {
    if (stock === 0) {
      return (
        <span className="bg-red-50 text-red-700 border border-red-205 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase">
          Out of Stock
        </span>
      );
    }
    if (stock < 10) {
      return (
        <span className="bg-amber-50 text-amber-700 border border-amber-205 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase">
          Low Stock ({stock})
        </span>
      );
    }
    return (
      <span className="bg-emerald-50 text-emerald-700 border border-emerald-205 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase">
        {stock} Available
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Active Stock Catalog</h2>
          <p className="text-red-950 text-xs">Create, edit, or remove catalog product listings and tracking.</p>
        </div>

        <button
          onClick={createHandler}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by SKU / Name / Brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-850 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 md:flex-none border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold bg-white text-slate-755 outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={fetchProducts}
            title="Refresh Table"
            className="border border-slate-200 p-2.5 rounded-xl hover:bg-slate-5 border-slate-200 text-slate-500 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {loadingMutate && <LoadingBox />}

      {loading ? (
        <LoadingBox />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : filteredProducts.length === 0 ? (
        <MessageBox>No products matching search filters.</MessageBox>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                    <th className="p-4">SKU / Info</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Brand</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-750">
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-10 w-10 rounded-lg object-cover bg-slate-100 border border-slate-150 shrink-0"
                            />
                          ) : (
                            <span className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                              <ShoppingBag size={18} />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate max-w-[200px]" title={product.name}>
                              {product.name}
                            </p>
                            <span className="font-mono text-[10px] text-slate-400">SKU: #{product._id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="text-xs font-bold text-slate-655 bg-slate-100 px-2 py-0.5 rounded">
                          {product.category || 'Uncategorized'}
                        </span>
                      </td>

                      <td className="p-4 text-xs font-medium text-slate-600">{product.brand}</td>

                      <td className="p-4 font-bold text-slate-900">Br{product.price.toFixed(2)}</td>

                      <td className="p-4">{getStockBadge(product.countInStock)}</td>

                      <td className="p-4 text-right flex justify-end items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/product/${product._id}`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-100 bg-slate-50/50"
                          title="Edit Details"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteHandler(product)}
                          className="p-1.5 text-red-550 hover:bg-red-50 rounded-lg transition-colors border border-red-50/50 bg-red-50/10"
                          title="Delete Product"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination links */}
          {pages > 1 && (
            <div className="flex justify-center items-center gap-1.5 pt-4">
              {[...Array(pages).keys()].map((x) => (
                <Link
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${x + 1 === Number(page)
                      ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  key={x + 1}
                  to={`/admin/products?page=${x + 1}`}
                >
                  {x + 1}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
