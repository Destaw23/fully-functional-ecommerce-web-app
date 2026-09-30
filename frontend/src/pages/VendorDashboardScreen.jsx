import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Store as StoreIcon,
  Package,
  TrendingUp,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Building2,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Save,
  DollarSign,
  BarChart3,
  CheckCircle,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { storeService } from '../services/storeService';
import { productService } from '../services/productService';
import { Store as ContextStore } from '../context/Store';
import { toast } from 'react-toastify';
import { getError, getMediaUrl } from '../utils/helpers';
import LoadingBox from '../components/common/LoadingBox';
import MessageBox from '../components/common/MessageBox';

const isValidImageFile = (file) => {
  const validMime = file?.type?.startsWith('image/');
  const validExtension = /\.(jpe?g|png|gif|webp|svg)$/i.test(file?.name || '');
  return Boolean(file) && (validMime || validExtension);
};

export default function VendorDashboardScreen() {
  const navigate = useNavigate();
  const { state } = useContext(ContextStore);
  const { userInfo } = state;

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [storeData, setStoreData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Store profile edit form
  const [profileForm, setProfileForm] = useState({
    name: '',
    description: '',
    phone_number: '',
    email: '',
    address: '',
    city: 'Addis Ababa',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // New product form modal state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    compare_price: '',
    stock_quantity: 10,
    sku: '',
    brand: '',
    condition: 'new',
    description: '',
  });
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [newProductImageFile, setNewProductImageFile] = useState(null);
  const [newProductImagePreview, setNewProductImagePreview] = useState('');

  // Edit product modal state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProdForm, setEditProdForm] = useState({
    name: '',
    price: '',
    stock_quantity: 0,
    brand: '',
    description: '',
  });
  const [updatingProduct, setUpdatingProduct] = useState(false);
  const [editProductImageFile, setEditProductImageFile] = useState(null);
  const [editProductImagePreview, setEditProductImagePreview] = useState('');

  const resetNewProductForm = () => {
    setNewProduct({
      name: '',
      category: '',
      price: '',
      compare_price: '',
      stock_quantity: 10,
      sku: '',
      brand: '',
      condition: 'new',
      description: '',
    });
    setNewProductImageFile(null);
    setNewProductImagePreview('');
  };

  const handleNewProductImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isValidImageFile(file)) {
      e.target.value = '';
      toast.error('Please choose a valid image file (PNG, JPG, WEBP, etc.).');
      return;
    }
    setNewProductImageFile(file);
    setNewProductImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleEditProductImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isValidImageFile(file)) {
      e.target.value = '';
      toast.error('Please choose a valid image file (PNG, JPG, WEBP, etc.).');
      return;
    }
    setEditProductImageFile(file);
    setEditProductImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleOpenEditProduct = (p) => {
    setEditingProduct(p);
    setEditProdForm({
      name: p.name || '',
      price: p.price || '',
      stock_quantity: p.stock_quantity ?? p.countInStock ?? 0,
      brand: p.brand || '',
      description: p.description || '',
    });
    setEditProductImageFile(null);
    setEditProductImagePreview('');
  };

  const handleUpdateVendorProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      setUpdatingProduct(true);
      const data = new FormData();
      Object.keys(editProdForm).forEach((key) => {
        data.append(key, editProdForm[key]);
      });
      if (editProductImageFile) {
        data.append('main_image', editProductImageFile);
      }
      await storeService.updateVendorProduct(editingProduct.id, data);
      toast.success(`Product "${editProdForm.name}" updated!`);
      setEditingProduct(null);
      loadVendorData();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setUpdatingProduct(false);
    }
  };

  const handleDeleteVendorProduct = async (p) => {
    if (window.confirm(`Are you sure you want to delete product "${p.name}" from your store?`)) {
      try {
        await storeService.deleteVendorProduct(p.id);
        toast.success(`Product "${p.name}" deleted.`);
        loadVendorData();
      } catch (err) {
        toast.error(getError(err));
      }
    }
  };

  const handleDeleteStore = async () => {
    if (window.confirm(`CRITICAL WARNING: Are you sure you want to permanently delete your store "${storeData?.name}"? All products associated with your store will be removed.`)) {
      try {
        await storeService.deleteMyStore();
        toast.success('Your store has been deleted.');
        navigate('/stores');
      } catch (err) {
        toast.error(getError(err));
      }
    }
  };

  const loadVendorData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch store profile
      const myStore = await storeService.getMyStore();
      setStoreData(myStore);
      setProfileForm({
        name: myStore.name || '',
        description: myStore.description || '',
        phone_number: myStore.phone_number || '',
        email: myStore.email || '',
        address: myStore.address || '',
        city: myStore.city || 'Addis Ababa',
      });

      // Fetch analytics
      try {
        const stats = await storeService.getMyStoreAnalytics();
        setAnalytics(stats.analytics || stats);
      } catch (err) {
        console.error('Error loading vendor analytics:', err);
      }

      // Fetch vendor products
      try {
        const vendorProds = await storeService.getMyStoreProducts();
        const list = vendorProds.results || vendorProds;
        setProducts(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Error loading vendor products:', err);
      }

      // Fetch categories for product creation
      try {
        const cats = await productService.getCategories();
        setCategories(Array.isArray(cats) ? cats : cats.results || []);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    } catch (err) {
      console.error('Vendor dashboard error:', err);
      if (err.response?.status === 404) {
        setError('You do not have a registered store yet. Please register your store first.');
      } else {
        setError('Failed to load vendor dashboard information.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userInfo) {
      navigate('/signin?redirect=/vendor/dashboard');
      return;
    }
    loadVendorData();
  }, [userInfo]);

  const handleUpdateStoreProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const data = new FormData();
      Object.keys(profileForm).forEach((key) => {
        data.append(key, profileForm[key]);
      });
      const updated = await storeService.updateMyStore(data);
      setStoreData(updated);
      toast.success('Store profile updated successfully!');
    } catch (err) {
      console.error('Error updating store:', err);
      toast.error('Failed to update store settings.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.category) {
      toast.warning('Please select a category for the product.');
      return;
    }
    if (!newProductImageFile) {
      toast.warning('Please upload a product image before publishing.');
      return;
    }
    try {
      setCreatingProduct(true);
      const data = new FormData();
      Object.keys(newProduct).forEach((key) => {
        if (newProduct[key] !== '') {
          data.append(key, newProduct[key]);
        }
      });
      if (!newProduct.sku) {
        data.append('sku', `SKU-${Date.now()}`);
      }
      data.append('main_image', newProductImageFile);
      await storeService.createVendorProduct(data);
      toast.success('New product added to your store!');
      setShowAddProductModal(false);
      resetNewProductForm();
      loadVendorData();
    } catch (err) {
      console.error('Error creating product:', err);
      toast.error(getError(err) || 'Failed to add product to store.');
    } finally {
      setCreatingProduct(false);
    }
  };

  if (loading) return <LoadingBox message="Loading vendor portal..." />;
  if (error) {
    return (
      <div className="space-y-6 max-w-xl mx-auto text-center py-12">
        <MessageBox variant="warning">{error}</MessageBox>
        <Link to="/stores" className="btn-primary inline-flex items-center gap-2">
          <StoreIcon size={18} />
          <span>Register a Store</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300 font-extrabold text-2xl shadow-inner">
            {storeData?.logo ? (
              <img src={getMediaUrl(storeData.logo)} alt={storeData.name} className="h-full w-full object-cover rounded-2xl" />
            ) : (
              storeData?.name?.charAt(0) || 'S'
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold">{storeData?.name}</h1>
              {storeData?.is_verified && (
                <ShieldCheck size={18} className="text-emerald-400" title="Verified Merchant" />
              )}
            </div>
            <p className="text-xs text-slate-300">
              Vendor Portal & Store Management • {storeData?.city}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/store/${storeData?.slug || storeData?.id}`}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
          >
            View Public Store Page →
          </Link>
          <button
            onClick={() => setShowAddProductModal(true)}
            className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 !py-2 !px-4 text-xs font-semibold flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Add Store Product</span>
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-soft flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Total Products</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics?.total_products ?? products.length}</h3>
          </div>
          <div className="p-3 rounded-2xl bg-brand-50 text-brand-600">
            <Package size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-soft flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Units Sold</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics?.total_units_sold ?? 0}</h3>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-soft flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Store Sales</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">Br{Number(analytics?.total_revenue ?? 0).toLocaleString()}</h3>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-soft flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Low Stock Alert</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics?.low_stock ?? 0}</h3>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'text-brand-600 border-b-2 border-brand-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 size={18} />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'products'
              ? 'text-brand-600 border-b-2 border-brand-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package size={18} />
          <span>Store Products ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'text-brand-600 border-b-2 border-brand-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 size={18} />
          <span>Store Settings</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-soft">
            <h3 className="text-lg font-bold text-slate-900">Recent Store Products</h3>
            {products.length === 0 ? (
              <p className="text-slate-400 text-sm py-4">No products in your store inventory yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {products.slice(0, 5).map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 p-1 border shrink-0">
                        {p.main_image ? (
                          <img src={getMediaUrl(p.main_image)} alt={p.name} className="h-full w-full object-contain" />
                        ) : (
                          <Package size={20} className="m-auto text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">{p.name}</h4>
                        <span className="text-xs text-slate-500">{p.brand || 'Tech Device'} • Br{Number(p.price).toLocaleString()}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${p.stock_quantity > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {p.stock_quantity > 0 ? `${p.stock_quantity} in stock` : 'Out of stock'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-soft">
            <h3 className="text-lg font-bold text-slate-900">Store Verification</h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800">
                <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                <span>Your store is active and visible on ElectroMerce store directory.</span>
              </div>
              <p className="text-slate-500">
                Keep your store contact information and stock up to date to maintain high merchant rating.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Store Products Management */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-6 shadow-soft">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">All Products in Store</h3>
            <button
              onClick={() => setShowAddProductModal(true)}
              className="btn-primary !py-2 !px-4 text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus size={16} />
              <span>Add New Item</span>
            </button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Package size={36} className="mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No products added to store yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="p-3 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 p-1 shrink-0">
                          {p.main_image ? (
                            <img src={getMediaUrl(p.main_image)} alt={p.name} className="h-full w-full object-contain" />
                          ) : (
                            <Package size={16} className="m-auto text-slate-400" />
                          )}
                        </div>
                        <span className="font-semibold text-slate-900">{p.name}</span>
                      </td>
                      <td className="p-3 font-mono text-xs text-slate-500">{p.sku || 'N/A'}</td>
                      <td className="p-3 font-bold text-slate-900">Br{Number(p.price).toLocaleString()}</td>
                      <td className="p-3 font-medium">{p.stock_quantity ?? p.countInStock ?? 0}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {p.is_active !== false ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 bg-white"
                            title="Edit product"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteVendorProduct(p)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-100 bg-red-50/20"
                            title="Delete product"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Store Settings Profile Form */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 max-w-2xl space-y-6 shadow-soft">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Edit Store Profile</h3>

          <form onSubmit={handleUpdateStoreProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Store Name</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Store Description</label>
              <textarea
                rows={3}
                value={profileForm.description}
                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={profileForm.phone_number}
                  onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-slate-100">
              <button
                type="button"
                onClick={handleDeleteStore}
                className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
              >
                Delete Store Outlet
              </button>

              <button
                type="submit"
                disabled={savingProfile}
                className="btn-primary !py-2.5 !px-6 text-sm font-semibold flex items-center gap-2"
              >
                <Save size={16} />
                <span>{savingProfile ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Edit Vendor Product */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit size={20} className="text-brand-600" />
                <span>Edit Product Details</span>
              </h3>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setEditProductImageFile(null);
                  setEditProductImagePreview('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateVendorProduct} className="space-y-4">
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="h-20 w-20 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                    {editProductImagePreview || editingProduct?.main_image ? (
                      <img
                        src={editProductImagePreview || getMediaUrl(editingProduct.main_image)}
                        alt={editProdForm.name || 'Product'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={28} className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs font-bold text-slate-800">Product photo</p>
                    <p className="text-[10px] text-slate-500">PNG, JPG, or WEBP — shown on your store and catalog.</p>
                    <input
                      type="file"
                      id="editVendorProductImage"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      onChange={handleEditProductImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="editVendorProductImage"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <Upload size={14} />
                      {editProductImagePreview || editingProduct?.main_image ? 'Replace image' : 'Upload image'}
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editProdForm.name}
                  onChange={(e) => setEditProdForm({ ...editProdForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price (Br)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editProdForm.price}
                    onChange={(e) => setEditProdForm({ ...editProdForm, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={editProdForm.stock_quantity}
                    onChange={(e) => setEditProdForm({ ...editProdForm, stock_quantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
                <input
                  type="text"
                  value={editProdForm.brand}
                  onChange={(e) => setEditProdForm({ ...editProdForm, brand: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editProdForm.description}
                  onChange={(e) => setEditProdForm({ ...editProdForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setEditingProduct(null)} className="btn-outline !py-2 text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={updatingProduct} className="btn-primary !py-2 text-sm font-semibold">
                  {updatingProduct ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Product to Vendor Store */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus size={20} className="text-brand-600" />
                <span>Add Product to Store</span>
              </h3>
              <button
                onClick={() => {
                  setShowAddProductModal(false);
                  resetNewProductForm();
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="h-20 w-20 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                    {newProductImagePreview ? (
                      <img src={newProductImagePreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon size={28} className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs font-bold text-slate-800">Product photo *</p>
                    <p className="text-[10px] text-slate-500">Upload a clear photo of the item you are selling.</p>
                    <input
                      type="file"
                      id="newVendorProductImage"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      onChange={handleNewProductImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="newVendorProductImage"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <Upload size={14} />
                      {newProductImageFile ? 'Change image' : 'Choose image'}
                    </label>
                    {newProductImageFile && (
                      <p className="text-[10px] font-mono text-slate-500 truncate">{newProductImageFile.name}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wireless Noise Cancelling Headphones"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    required
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="Apple, Sony, Samsung..."
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price (Br) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="15000"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Compare Price</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="18000"
                    value={newProduct.compare_price}
                    onChange={(e) => setNewProduct({ ...newProduct, compare_price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.stock_quantity}
                    onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Detailed product features and specifications..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProductModal(false);
                    resetNewProductForm();
                  }}
                  className="btn-outline !py-2 text-sm"
                >
                  Cancel
                </button>
                <button type="submit" disabled={creatingProduct} className="btn-primary !py-2 text-sm font-semibold">
                  {creatingProduct ? 'Publishing...' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
