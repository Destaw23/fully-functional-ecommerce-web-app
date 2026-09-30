import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Star,
  ShieldCheck,
  Search,
  Building2,
  Plus,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Package,
} from 'lucide-react';
import { storeService } from '../services/storeService';
import { Store as ContextStore } from '../context/Store';
import { toast } from 'react-toastify';
import LoadingBox from '../components/common/LoadingBox';
import MessageBox from '../components/common/MessageBox';

const getMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return null;

  const normalized = url.trim();
  if (!normalized) return null;
  if (/^https?:\/\//i.test(normalized) || normalized.startsWith('//') || /^data:/i.test(normalized)) {
    return normalized;
  }

  const mediaHost = import.meta.env.VITE_MEDIA_HOST || '';
  return `${mediaHost}${normalized.startsWith('/') ? '' : '/'}${normalized}`;
};

export default function StoresScreen() {
  const navigate = useNavigate();
  const { state } = useContext(ContextStore);
  const { userInfo } = state;

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [onlyVerified, setOnlyVerified] = useState(false);

  // Store registration modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '',
    description: '',
    phone_number: '',
    email: '',
    address: '',
    city: 'Addis Ababa',
  });
  const [regLoading, setRegLoading] = useState(false);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (cityFilter !== 'all') params.city = cityFilter;
      if (onlyVerified) params.verified = 'true';

      const data = await storeService.getStores(params);
      const storeList = data.results || data;
      setStores(Array.isArray(storeList) ? storeList : []);
    } catch (err) {
      console.error('Error fetching stores:', err);
      setError('Failed to load electronic stores. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userInfo) {
      toast.info('Please sign in to view electronics stores.');
      navigate('/signin?redirect=/stores');
      return;
    }
    fetchStores();
  }, [userInfo, searchQuery, cityFilter, onlyVerified]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!userInfo) {
      toast.info('Please sign in to register a store.');
      navigate('/signin?redirect=/stores');
      return;
    }
    try {
      setRegLoading(true);
      const data = new FormData();
      Object.keys(regForm).forEach((key) => {
        data.append(key, regForm[key]);
      });
      await storeService.registerStore(data);
      toast.success('Congratulations! Your store has been created successfully.');
      setShowRegisterModal(false);
      setRegForm({
        name: '',
        description: '',
        phone_number: '',
        email: '',
        address: '',
        city: 'Addis Ababa',
      });
      fetchStores();
      navigate('/vendor/dashboard');
    } catch (err) {
      console.error('Store registration error:', err);
      const msg = err.response?.data?.name?.[0] || err.response?.data?.detail || 'Failed to register store.';
      toast.error(msg);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 text-white shadow-2xl p-8 sm:p-12">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-300">
            <Sparkles size={14} className="text-brand-400 animate-pulse" />
            <span>Verified Vendors & Retailers</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Discover Top <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-indigo-300 bg-clip-text text-transparent">Electronics Stores</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Browse genuine tech sellers, explore physical store hubs across Addis Ababa, and order directly from certified brand distributors.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => setShowRegisterModal(true)}
              className="btn-primary !bg-gradient-to-r !from-brand-500 !to-indigo-600 hover:!from-brand-600 hover:!to-indigo-700 !py-3.5 !px-6 text-sm font-semibold shadow-lg shadow-brand-500/25 flex items-center gap-2"
            >
              <Plus size={18} />
              <span>Register Your Store</span>
            </button>
            {userInfo && (userInfo.role === 'store_owner' || userInfo.isAdmin) && (
              <Link
                to="/vendor/dashboard"
                className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/20"
              >
                Go to Vendor Dashboard →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-soft">
        {/* Search input */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search store name, description, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* City filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 font-medium focus:border-brand-500 focus:outline-none"
          >
            <option value="all">All Locations</option>
            <option value="Addis Ababa">Addis Ababa</option>
            <option value="Bole">Bole</option>
            <option value="Merkato">Merkato</option>
          </select>

          {/* Verified toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 font-medium hover:bg-slate-50">
            <input
              type="checkbox"
              checked={onlyVerified}
              onChange={(e) => setOnlyVerified(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <ShieldCheck size={16} className="text-brand-600" />
            <span>Verified Only</span>
          </label>
        </div>
      </div>

      {/* Stores Grid */}
      {loading ? (
        <LoadingBox message="Loading electronic stores..." />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : stores.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Building2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No stores found</h3>
          <p className="text-slate-500 max-w-md mx-auto text-sm">
            We couldn't find any electronics stores matching your criteria. Try adjusting your search query or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div
              key={store.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
            >
              {/* Top Banner area */}
              <div className="relative h-32 w-full bg-gradient-to-r from-slate-900 via-brand-900 to-indigo-950 overflow-hidden">
                {store.banner ? (
                  <img
                    src={getMediaUrl(store.banner)}
                    alt={store.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-600/30 to-indigo-900/40 backdrop-blur-sm" />
                )}

                {/* Rating badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-slate-900/80 backdrop-blur-md px-3 py-1 text-xs font-semibold text-amber-400 border border-white/10">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span>{store.rating || '4.8'}</span>
                  <span className="text-slate-400">({store.total_reviews || 0})</span>
                </div>
              </div>

              {/* Logo avatar & store content */}
              <div className="relative flex-1 p-6 pt-0 space-y-4">
                {/* Logo overlap */}
                <div className="-mt-10 mb-2 flex items-end justify-between">
                  <div className="relative h-20 w-20 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center">
                    {store.logo ? (
                      <img
                        src={getMediaUrl(store.logo)}
                        alt={store.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-700 font-extrabold text-2xl">
                        {store.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {store.is_verified && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      <span>Verified Retailer</span>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-brand-600 flex items-center gap-2">
                    <span>{store.name}</span>
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {store.description || 'Certified retailer offering genuine electronic devices, electronics hardware, and accessories.'}
                  </p>
                </div>

                {/* Info badges */}
                <div className="space-y-2 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-brand-500 shrink-0" />
                    <span className="truncate">{store.address ? `${store.address}, ${store.city}` : store.city}</span>
                  </div>
                  {store.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <span>{store.phone_number}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-500">
                    <Package size={14} className="text-indigo-500 shrink-0" />
                    <span>{store.product_count || 0} active products</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                <Link
                  to={`/store/${store.slug || store.id}`}
                  className="btn-outline !w-full !py-2.5 text-sm font-semibold flex items-center justify-center gap-2 group-hover:bg-brand-600 group-hover:text-white group-hover:border-brand-600 transition-all"
                >
                  <span>Visit Store</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Store Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600">
                  <Store size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Register Electronic Store</h3>
                  <p className="text-xs text-slate-500">Start selling your tech items on ElectroMerce</p>
                </div>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Store Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Addis Tech Hub"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe your store and hardware specialities..."
                  value={regForm.description}
                  onChange={(e) => setRegForm({ ...regForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+2519XXXXXXXX"
                    value={regForm.phone_number}
                    onChange={(e) => setRegForm({ ...regForm, phone_number: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Store Email</label>
                  <input
                    type="email"
                    placeholder="contact@store.com"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Address</label>
                  <input
                    type="text"
                    placeholder="Bole Rd, Edna Mall plaza"
                    value={regForm.address}
                    onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Addis Ababa"
                    value={regForm.city}
                    onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="btn-outline !py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regLoading}
                  className="btn-primary !py-2.5 text-sm font-semibold"
                >
                  {regLoading ? 'Creating...' : 'Create Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
