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

  // autoplay every 2 seconds
  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const id = setInterval(() => {
      setActiveIndex((i) => (i === slides.length - 1 ? 0 : i + 1));
    }, 2000);
    return () => clearInterval(id);
  }, [slides.length]);

  if (!slides.length) return null;

  const prev = () => setActiveIndex((i) => (i === 0 ? slides.length - 1 : i - 1));
  const next = () => setActiveIndex((i) => (i === slides.length - 1 ? 0 : i + 1));

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="flex h-full will-change-transform transition-transform duration-500"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((s) => {
            const imageUrl = getMediaUrl(s.product.image || s.product.main_image || s.product.thumbnail || '');
            return (
              <div key={s.category} className="min-w-full h-full flex-shrink-0 relative overflow-hidden p-[30px]">
                <img
                  src={imageUrl}
                  alt="Top category product"
                  className="h-full w-full object-contain object-center overflow-hidden"
                  style={{ filter: 'brightness(1.15) contrast(1.05)' }}
                />
              </div>
            );
          })}
        </div>
        <div className="absolute inset-0 bg-transparent" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={prev}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-white/15 text-white transition hover:bg-white/25"
            aria-label="Previous top rated category"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={next}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-white/15 text-white transition hover:bg-white/25"
            aria-label="Next top rated category"
          >
            ›
          </button>
        </div>
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
    <div className="animate-slide-up space-y-7">
      <Helmet>
        <title>ElectroMerce </title>
      </Helmet>

      <section className="relative overflow-hidden rounded-2xl  p-16 sm:p-8 text-white shadow-card min-h-[400px] sm:min-h-[450px] flex flex-col justify-between">
        <TopRatedBillboard slides={topFiveSlides} />

        <div className="relative z-10 max-w-2xl space-y-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-950/60 px-3.5 py-1 text-xs font-bold text-emerald-300 backdrop-blur-md shadow-sm">
            <Sparkles size={14} />
            New arrivals every week
          </span>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl text-white">
            Tech you trust. <span className="text-brand-400">Delivered fast.</span>
          </h1>
        </div>

        {/* Trust Badges List at Bottom of Advertisement Section */}
        <div className="relative z-10 mt-8 pt-4 border-t border-white/30">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-white">
            {[
              { icon: Truck, label: 'Fast delivery', desc: 'Nationwide shipping', color: 'bg-brand-500/20 text-brand-400 border-brand-500/30' },
              { icon: Shield, label: 'Secure checkout', desc: 'Protected payments', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
              { icon: Sparkles, label: 'Genuine products', desc: 'Authorized sellers', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="flex items-center gap-3.5 rounded-xl bg-gray-800 p-3.5 border border-gray-700 shadow-md transition-all hover:bg-gray-700">
                <div className={`rounded-xl p-2.5 border ${color} shrink-0`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{label}</p>
                  <p className="text-xs text-slate-200 font-medium mt-0.5">{desc}</p>
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
          </div>
          <div className="flex items-center gap-5">
            <Link
              to="/search?category=all&query=all&price=all&rating=all&order=toprated"
              className="link-brand inline-flex items-center gap-1 text-sm"
            >
              <span>Top rated</span>
              <ArrowRight size={14} />
            </Link>
            <Link to="/search" className="link-brand inline-flex items-center gap-1 text-sm">
              View all
              <ArrowRight size={14} />
            </Link>
          </div>
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
