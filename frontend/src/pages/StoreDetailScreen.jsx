import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Store as ContextStore } from '../context/Store';
import { toast } from 'react-toastify';
import {
  Store as StoreIcon,
  MapPin,
  Phone,
  Mail,
  Star,
  ShieldCheck,
  Search,
  Package,
  ArrowLeft,
  Building2,
  Info,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { storeService } from '../services/storeService';
import Product from '../components/products/Product';
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

export default function StoreDetailScreen() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { state } = useContext(ContextStore);
  const { userInfo } = state;

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('products');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!userInfo) {
      toast.info('Please sign in to view store details.');
      navigate(`/signin?redirect=/store/${slug}`);
      return;
    }

    const fetchStoreDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await storeService.getStoreDetail(slug);
        setStore(data);
      } catch (err) {
        console.error('Error fetching store details:', err);
        setError('Failed to load store information.');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreDetails();
  }, [slug, userInfo]);

  useEffect(() => {
    if (!store) return;
    const fetchStoreProducts = async () => {
      try {
        setProductsLoading(true);
        const params = {};
        if (searchQuery) params.search = searchQuery;
        const data = await storeService.getStoreProducts(store.slug || store.id, params);
        const list = data.results || data;
        setProducts(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Error fetching store products:', err);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchStoreProducts();
  }, [store, searchQuery]);

  if (loading) return <LoadingBox message="Loading store details..." />;
  if (error) return <MessageBox variant="danger">{error}</MessageBox>;
  if (!store) return <MessageBox variant="warning">Store not found.</MessageBox>;

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Back button */}
      <div>
        <Link
          to="/stores"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to All Stores</span>
        </Link>
      </div>

      {/* Store Header Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card">
        {/* Banner Image / Gradient */}
        <div className="relative h-48 sm:h-64 w-full bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950 overflow-hidden">
          {store.banner ? (
            <img
              src={getMediaUrl(store.banner)}
              alt={store.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/40 to-indigo-900/60" />
          )}

          {/* Rating Badge */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-slate-900/80 backdrop-blur-md px-4 py-1.5 text-sm font-bold text-amber-400 border border-white/10 shadow-lg">
            <Star size={16} className="fill-amber-400 text-amber-400" />
            <span>{store.rating || '4.8'}</span>
            <span className="text-slate-400 text-xs font-normal">({store.total_reviews || 0} reviews)</span>
          </div>
        </div>

        {/* Store Info Container */}
        <div className="relative px-6 sm:px-8 pb-6 pt-0">
          <div className="-mt-16 sm:-mt-20 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-100">
            {/* Logo & Title */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0 rounded-3xl border-4 border-white bg-white shadow-xl overflow-hidden flex items-center justify-center">
                {store.logo ? (
                  <img
                    src={getMediaUrl(store.logo)}
                    alt={store.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-700 font-extrabold text-4xl">
                    {store.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{store.name}</h1>
                  {store.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      <span>Verified Retailer</span>
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
                  {store.description || 'Certified seller on ElectroMerce specializing in genuine consumer hardware & devices.'}
                </p>
              </div>
            </div>

            {/* Direct Contact Button */}
            {store.phone_number && (
              <a
                href={`tel:${store.phone_number}`}
                className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 !py-3 !px-5 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 shrink-0"
              >
                <Phone size={16} />
                <span>Contact Store ({store.phone_number})</span>
              </a>
            )}
          </div>

          {/* Quick Stats & Metadata Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <MapPin size={18} className="text-brand-600 shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-bold">Location</span>
                <span className="truncate text-slate-800 font-semibold">{store.address ? `${store.address}, ${store.city}` : store.city}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <Package size={18} className="text-indigo-600 shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-bold">Inventory</span>
                <span className="text-slate-800 font-semibold">{store.product_count || products.length} Active Items</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <Award size={18} className="text-amber-500 shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-bold">Store Rating</span>
                <span className="text-slate-800 font-semibold">{store.rating} / 5.0 Rating</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <Mail size={18} className="text-emerald-600 shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-bold">Email Support</span>
                <span className="truncate text-slate-800 font-semibold">{store.email || 'Verified Support'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 transition-colors relative flex items-center gap-2 ${
            activeTab === 'products'
              ? 'text-brand-600 font-bold border-b-2 border-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package size={18} />
          <span>Store Products ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`pb-3 transition-colors relative flex items-center gap-2 ${
            activeTab === 'about'
              ? 'text-brand-600 font-bold border-b-2 border-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Info size={18} />
          <span>About Store & Contact</span>
        </button>
      </div>

      {/* Tab Content: Store Products Catalog */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Internal Store Search Box */}
          <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Search products inside ${store.name}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {productsLoading ? (
            <LoadingBox message="Filtering store products..." />
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
              <Package size={36} className="mx-auto text-slate-300" />
              <h4 className="text-lg font-bold text-slate-800">No products available in this store</h4>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                This store has not published any active items matching your query yet.
              </p>
            </div>
          ) : (
            <div className="product-grid-responsive">
              {products.map((item) => (
                <Product key={item.id} product={item} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: About Store */}
      {activeTab === 'about' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-soft">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 size={22} className="text-brand-600" />
              <span>About {store.name}</span>
            </h3>

            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              {store.description || 'Welcome to our store! We provide authentic electronic gadgets, accessories, and certified customer support.'}
            </p>

            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h4 className="text-base font-bold text-slate-800">Vendor Assurances & Guarantees</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>100% Original Products</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Manufacturer Warranty Included</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Same-Day Addis Ababa Delivery</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Verified Retail Merchant</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-6 shadow-soft h-fit">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Contact Information</h3>

            <div className="space-y-4 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-semibold text-slate-900">Physical Address</span>
                  <span className="text-xs text-slate-500">{store.address || 'Address not specified'}</span>
                  <span className="block text-xs text-slate-500 font-medium">{store.city}</span>
                </div>
              </div>

              {store.phone_number && (
                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-slate-900">Phone Contact</span>
                    <a href={`tel:${store.phone_number}`} className="text-xs text-brand-600 hover:underline">
                      {store.phone_number}
                    </a>
                  </div>
                </div>
              )}

              {store.email && (
                <div className="flex items-start gap-3">
                  <Mail size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-slate-900">Email Address</span>
                    <a href={`mailto:${store.email}`} className="text-xs text-brand-600 hover:underline">
                      {store.email}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
