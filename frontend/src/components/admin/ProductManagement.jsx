import React, { useContext, useEffect, useReducer, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2, Loader, Search, RefreshCw, ShoppingBag } from 'lucide-react';
import { Store } from '../../context/Store';
import LoadingBox from '../common/LoadingBox';
import MessageBox from '../common/MessageBox';
import { getError, getMediaUrl } from '../../utils/helpers';
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
      const token = userInfo?.token || localStorage.getItem('accessToken');
      const { data } = await axios.get('/api/admin/products/', {
        params: {
          page: Number(page),
          search: searchTerm.trim(),
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      const prodList = data.results || data.products || data;
      dispatch({
        type: 'FETCH_SUCCESS',
        payload: {
          products: Array.isArray(prodList) ? prodList : [],
          page: data.page || 1,
          pages: data.pages || 1,
        },
      });
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
    const productId = product.id || product._id;
    if (window.confirm(`Are you sure you want to delete product "${product.name}"?`)) {
      try {
        dispatch({ type: 'MUTATE_REQUEST' });
        const token = userInfo?.token || localStorage.getItem('accessToken');
        await axios.delete(`/api/admin/products/${productId}/`, {
          headers: { Authorization: `Bearer ${token}` },
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
    const pId = (p.id || p._id || '').toString();
    const pName = p.name || '';
    const pBrand = p.brand || '';
    const catName = p.category_name || (typeof p.category === 'object' ? p.category?.name : p.category) || '';

    const matchesSearch = pName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pBrand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pId.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || catName.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const toggleActiveStatus = async (product) => {
    const productId = product.id || product._id;
    const newStatus = !product.is_active;

    try {
      dispatch({ type: 'MUTATE_REQUEST' });
      const token = userInfo?.token || localStorage.getItem('accessToken');
      await axios.patch(
        `/api/admin/products/${productId}/`,
        { is_active: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Product "${product.name}" ${newStatus ? 'activated' : 'deactivated'}.`);
      dispatch({ type: 'MUTATE_SUCCESS' });
      fetchProducts();
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: 'MUTATE_FAIL' });
    }
  };

  const updateStockQuantity = async (product, newQty) => {
    if (newQty < 0) return;
    const productId = product.id || product._id;

    try {
      dispatch({ type: 'MUTATE_REQUEST' });
      const token = userInfo?.token || localStorage.getItem('accessToken');
      await axios.patch(
        `/api/admin/products/${productId}/`,
        { stock_quantity: Number(newQty) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Stock for "${product.name}" set to ${newQty}.`);
      dispatch({ type: 'MUTATE_SUCCESS' });
      fetchProducts();
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: 'MUTATE_FAIL' });
    }
  };

  const getStockBadge = (stock) => {
    if (stock === 0) {
      return (
        <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase">
          Out of Stock
        </span>
      );
    }
    if (stock < 10) {
      return (
        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase">
          Low Stock ({stock})
        </span>
      );
    }
    return (
      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase">
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
          <p className="text-slate-500 text-xs font-semibold">Create, edit, activate/deactivate listings, and update stock levels.</p>
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
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 md:flex-none border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold bg-white text-slate-700 outline-none focus:ring-1 focus:ring-brand-500"
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
            className="border border-slate-200 p-2.5 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {loadingMutate && <LoadingBox message="Updating inventory..." />}

      {loading ? (
        <LoadingBox message="Loading catalog..." />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : filteredProducts.length === 0 ? (
        <MessageBox variant="info">No products matching search filters.</MessageBox>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="max-h-[600px] overflow-auto">
              <table className="w-full text-left border-collapse text-sm relative">
                <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                    <th className="p-4">SKU / Info</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Brand</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Quick Stock Control</th>
                    <th className="p-4">Listing Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredProducts.map((product) => {
                    const pKey = product.id || product._id;
                    const stockVal = product.stock_quantity ?? product.countInStock ?? 0;
                    const isActive = product.is_active !== false;
                    const catName =
                      product.category_name ||
                      (typeof product.category === 'object' ? product.category?.name : product.category) ||
                      'Uncategorized';
                    const numPrice = Number(product.price || 0);

                    return (
                      <tr key={pKey} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {product.image || product.main_image ? (
                              <img
                                src={getMediaUrl(product.image || product.main_image)}
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
                              <span className="font-mono text-[10px] text-slate-400">SKU: #{pKey}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {catName}
                          </span>
                        </td>

                        <td className="p-4 text-xs font-medium text-slate-600">{product.brand || 'N/A'}</td>

                        <td className="p-4 font-bold text-slate-900">Br{numPrice.toFixed(2)}</td>

                        {/* Quick Stock Controls */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateStockQuantity(product, Math.max(0, stockVal - 1))}
                              className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-xs"
                              title="Decrease stock by 1"
                            >
                              -
                            </button>
                            <span className="font-extrabold text-slate-800 w-8 text-center text-xs">{stockVal}</span>
                            <button
                              onClick={() => updateStockQuantity(product, stockVal + 1)}
                              className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-xs"
                              title="Increase stock by 1"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Active Toggle */}
                        <td className="p-4">
                          <button
                            onClick={() => toggleActiveStatus(product)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                            }`}
                            title="Click to toggle product listing status"
                          >
                            {isActive ? 'Active' : 'Deactivated'}
                          </button>
                        </td>

                        <td className="p-4 text-right flex justify-end items-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/product/${pKey}`)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-100 bg-slate-50/50"
                            title="Edit Details"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteHandler(product)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-50/50 bg-red-50/10"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
