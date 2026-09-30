import { useContext, useEffect, useReducer, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Sparkles, Truck, Shield } from 'lucide-react';
import Product from '../components/products/Product';
import LoadingBox from '../components/common/LoadingBox';
import MessageBox from '../components/common/MessageBox';
import { Store } from '../context/Store';
import { getError, getMediaUrl } from '../utils/helpers';
import { recommendationService } from '../services/recommendationService';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, products: action.payload, loading: false };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

function TopRatedBillboard({ slides }) {
  const [activeIndex, setActiveIndex] = useState(0);

  // autoplay every 3.5 seconds
  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const id = setInterval(() => {
      setActiveIndex((i) => (i === slides.length - 1 ? 0 : i + 1));
    }, 3500);
    return () => clearInterval(id);
  }, [slides.length]);

  if (!slides.length) return null;

  const currentSlide = slides[activeIndex] || slides[0];
  const activeProduct = currentSlide.product;
  const imageUrl = getMediaUrl(activeProduct.image || activeProduct.main_image || activeProduct.thumbnail || '');
  const price = Number(activeProduct.price || 0);

  const prev = () => setActiveIndex((i) => (i === 0 ? slides.length - 1 : i - 1));
  const next = () => setActiveIndex((i) => (i === slides.length - 1 ? 0 : i + 1));

  return (
    <div className="relative flex flex-col justify-between h-full w-full space-y-4">
      {/* Product Image & Info Showcase */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 relative min-h-[220px]">
        <div className="relative group w-full max-w-xs flex flex-col items-center">
          {/* Subtle radial glow */}
          <div className="absolute inset-0 bg-brand-500/20 rounded-full blur-2xl transform scale-110 pointer-events-none" />

          {/* Product Image */}
          <Link to={`/product/${activeProduct.slug || activeProduct.id}`} className="relative z-10 transition-transform duration-500 hover:scale-105 block">
            <img
              src={imageUrl}
              alt={activeProduct.name}
              className="h-44 sm:h-56 max-w-full object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]"
            />
          </Link>

          {/* Floating Product Tag */}
          <div className="relative z-10 mt-3 bg-slate-900/90 backdrop-blur-md border border-white/15 px-3.5 py-2 rounded-2xl shadow-xl flex items-center justify-between gap-3 w-full max-w-xs">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-brand-400 tracking-wider block truncate">
                {currentSlide.category}
              </span>
              <p className="text-xs font-bold text-white truncate" title={activeProduct.name}>
                {activeProduct.name}
              </p>
            </div>
            {price > 0 && (
              <span className="bg-brand-600 text-white text-xs font-black px-2.5 py-1 rounded-xl shrink-0 shadow-sm">
                Br {price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Carousel Navigation Controls */}
      <div className="flex items-center justify-between gap-4 pt-2 relative z-20">
        <button
          type="button"
          onClick={prev}
          className="h-9 w-9 rounded-xl border border-white/20 bg-white/10 text-white flex items-center justify-center backdrop-blur-md transition-all hover:bg-white/25 hover:scale-105 active:scale-95 shadow-md"
          aria-label="Previous product"
        >
          ‹
        </button>

        {/* Slide Indicator Dots */}
        <div className="flex items-center gap-1.5">
          {slides.map((s, idx) => (
            <button
              key={s.category}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === activeIndex ? 'w-6 bg-brand-400' : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={next}
          className="h-9 w-9 rounded-xl border border-white/20 bg-white/10 text-white flex items-center justify-center backdrop-blur-md transition-all hover:bg-white/25 hover:scale-105 active:scale-95 shadow-md"
          aria-label="Next product"
        >
          ›
        </button>
      </div>
    </div>
  );
}

export default function HomeScreen() {
  const { state } = useContext(Store);
  const { userInfo, accessToken } = state;
  const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
  const isAuthenticated = Boolean(userInfo && token);

  const [{ loading, error, products }, dispatch] = useReducer(reducer, {
    products: [],
    loading: true,
    error: '',
  });

  const [trendingProducts, setTrendingProducts] = useState([]);
  const [personalizedProducts, setPersonalizedProducts] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [personalizedLoading, setPersonalizedLoading] = useState(false);
  const [trendingError, setTrendingError] = useState('');
  const [personalizedError, setPersonalizedError] = useState('');

  const featuredProducts = [...products].sort((a, b) => {
    const ratingDiff = (b.rating || 0) - (a.rating || 0);
    if (ratingDiff !== 0) return ratingDiff;
    return (b.numReviews || 0) - (a.numReviews || 0);
  });

  const topRatedSlides = Object.entries(
    products.reduce((topProducts, product) => {
      const categoryName = product.category?.name || product.category || 'Uncategorized';
      const current = topProducts[categoryName];
      if (
        !current ||
        product.rating > current.rating ||
        (product.rating === current.rating && (product.numReviews || 0) > (current.numReviews || 0))
      ) {
        topProducts[categoryName] = product;
      }
      return topProducts;
    }, {})
  )
    .map(([category, product]) => ({ category, product }))
    .sort((a, b) => a.category.localeCompare(b.category));
  const topFiveSlides = topRatedSlides.slice(0, 5);

  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'FETCH_REQUEST' });
      try {
        const result = await axios.get('/api/products');
        dispatch({ type: 'FETCH_SUCCESS', payload: result.data });
      } catch (err) {
        dispatch({ type: 'FETCH_FAIL', payload: err.message });
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchTrending = async () => {
      setTrendingLoading(true);
      setTrendingError('');
      try {
        const trending = await recommendationService.getTrending(8);
        if (isMounted) {
          setTrendingProducts(trending);
        }
      } catch (err) {
        if (isMounted) {
          setTrendingProducts([]);
          setTrendingError(getError(err));
        }
      } finally {
        if (isMounted) {
          setTrendingLoading(false);
        }
      }
    };

    fetchTrending();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchPersonalized = async () => {
      if (!userInfo) {
        if (isMounted) {
          setPersonalizedProducts([]);
          setPersonalizedError('');
          setPersonalizedLoading(false);
        }
        return;
      }

      const authToken = accessToken || localStorage.getItem('accessToken');
      if (!authToken) {
        if (isMounted) {
          setPersonalizedProducts([]);
          setPersonalizedError('');
          setPersonalizedLoading(false);
        }
        return;
      }

      setPersonalizedLoading(true);
      setPersonalizedError('');
      try {
        const personalized = await recommendationService.getPersonalized(authToken, 8);
        if (isMounted) {
          setPersonalizedProducts(personalized);
        }
      } catch (err) {
        if (isMounted) {
          setPersonalizedProducts([]);
          setPersonalizedError(getError(err));
        }
      } finally {
        if (isMounted) {
          setPersonalizedLoading(false);
        }
      }
    };

    fetchPersonalized();

    return () => {
      isMounted = false;
    };
  }, [accessToken, userInfo]);

  return (
    <div className="animate-slide-up space-y-10">
      <Helmet>
        <title>ElectroMerce</title>
      </Helmet>

      {/* Hero Advertisement Banner Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-10 text-white shadow-2xl border border-slate-800/80">
        {/* Decorative Ambient Radial Lights */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Headline & Action CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-950/50 px-4 py-1.5 text-xs font-extrabold text-emerald-300 backdrop-blur-md shadow-sm">
              <Sparkles size={14} className="text-amber-400 animate-pulse" />
              New arrivals every week
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white">
              Tech you trust.{' '}
              <span className="bg-gradient-to-r from-brand-400 via-blue-300 to-indigo-300 bg-clip-text text-transparent block sm:inline mt-1 sm:mt-0">
                Delivered fast.
              </span>
            </h1>

            <p className="max-w-xl text-sm sm:text-base leading-relaxed text-slate-300 font-medium">
              Shop smartphones, laptops, audio gear, and smart wearables from top brands — curated for
              premium quality and backed by reliable support.
            </p>

            <div className="flex flex-wrap gap-3.5 pt-2">
              <Link
                to="/search"
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-brand-500 hover:shadow-brand-500/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Browse catalog</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/search?category=all&query=all&price=all&rating=all&order=toprated"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Top rated</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Featured Category Product Showcase Carousel */}
          <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md shadow-2xl min-h-[340px] flex flex-col justify-between">
            <TopRatedBillboard slides={topFiveSlides} />
          </div>
        </div>

        {/* Bottom Bar: Trust Badges List */}
        <div className="relative z-10 mt-10 pt-6 border-t border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-white">
            {[
              { icon: Truck, label: 'Fast delivery', desc: 'Nationwide shipping', color: 'bg-brand-500/20 text-brand-400 border-brand-500/30' },
              { icon: Shield, label: 'Secure checkout', desc: 'Protected payments', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
              { icon: Sparkles, label: 'Genuine products', desc: 'Authorized sellers', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20">
                <div className={`rounded-xl p-3 border ${color} shrink-0 shadow-sm`}>
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{label}</p>
                  <p className="text-xs text-slate-300 font-medium mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="section-heading">Featured products</h2>
            {/* <p className="section-subheading">Hand-picked electronics at competitive prices</p> */}
          </div>
          <Link to="/search" className="link-brand inline-flex items-center gap-1 text-sm">
            View all
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <LoadingBox />
        ) : error ? (
          <MessageBox variant="danger">{error}</MessageBox>
        ) : products.length === 0 ? (
          <MessageBox>No products available right now.</MessageBox>
        ) : (
          <div className="product-grid-responsive">
            {featuredProducts.map((product) => (
              <Product key={product.slug} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="section-heading">Trending now</h2>
              <p className="section-subheading">Popular products that shoppers are buying right now.</p>
            </div>
          </div>

          {trendingLoading ? (
            <LoadingBox />
          ) : trendingError ? (
            <MessageBox variant="danger">{trendingError}</MessageBox>
          ) : trendingProducts.length > 0 ? (
            <div className="product-grid-responsive">
              {trendingProducts.map((product) => (
                <Product key={product.id || product.slug} product={product} />
              ))}
            </div>
          ) : (
            <MessageBox>No trending products are available right now.</MessageBox>
          )}
        </div>

        {isAuthenticated && (
          <div className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="section-heading">Recommended for you</h2>
                <p className="section-subheading">Personal picks based on recent browsing and purchase patterns.</p>
              </div>
            </div>

            {personalizedLoading ? (
              <LoadingBox />
            ) : personalizedError ? (
              <MessageBox variant="danger">{personalizedError}</MessageBox>
            ) : personalizedProducts.length > 0 ? (
              <div className="product-grid-responsive">
                {personalizedProducts.map((product) => (
                  <Product key={product.id || product.slug} product={product} />
                ))}
              </div>
            ) : (
              <MessageBox>Personalized recommendations will appear here once you browse or add items.</MessageBox>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
