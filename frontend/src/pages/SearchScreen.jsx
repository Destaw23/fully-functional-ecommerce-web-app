import React, { useEffect, useReducer } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { getError, slugify } from '../utils/helpers';
import useCategories from '../hooks/useCategories';
import { Helmet } from 'react-helmet-async';
import Rating from '../components/common/Rating';
import LoadingBox from '../components/common/LoadingBox';
import MessageBox from '../components/common/MessageBox';
import Product from '../components/products/Product';
import { SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        products: action.payload.products,
        page: action.payload.page,
        pages: action.payload.pages,
        countProducts: action.payload.countProducts,
        loading: false,
      };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

const prices = [
  {
    name: 'Br1 - 1000',
    value: '1-1000',
  },
  {
    name: 'Br2000 - 5000',
    value: '2000-5000',
  },
  {
    name: 'Br5000 - 10000',
    value: '5000-10000',
  },
  {
    name: 'Br10000 - 30000',
    value: '10000-30000',
  },
  {
    name: 'Br30000 - 50000',
    value: '30000-50000',
  },
  {
    name: 'Br50000 - 100000',
    value: '50000-100000',
  },
  {
    name: 'Br100000 and above',
    value: '100000-99999999',
  },
];

export const ratings = [
  {
    name: '4 stars & up',
    rating: 4,
  },
  {
    name: '3 stars & up',
    rating: 3,
  },
  {
    name: '2 stars & up',
    rating: 2,
  },
  {
    name: '1 stars & up',
    rating: 1,
  },
];

export default function SearchScreen() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const rawCategory = sp.get('category') || 'all';
  const category = rawCategory === 'all' ? 'all' : slugify(rawCategory);
  const query = sp.get('query') || 'all';
  const price = sp.get('price') || 'all';
  const rating = sp.get('rating') || 'all';
  const order = sp.get('order') || 'newest';
  const page = sp.get('page') || 1;

  const [{ loading, error, products, pages, countProducts }, dispatch] =
    useReducer(reducer, {
      loading: true,
      error: '',
    });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams({
          page: String(page),
          query,
          category,
          price,
          rating,
          order,
        });
        const { data } = await axios.get(`/api/products/search?${params.toString()}`);
        dispatch({ type: 'FETCH_SUCCESS', payload: data });
      } catch (err) {
        dispatch({
          type: 'FETCH_FAIL',
          payload: getError(err),
        });
      }
    };
    fetchData();
  }, [category, order, page, price, query, rating]);

  const { categories, loading: categoriesLoading } = useCategories();

  const categoryLabel =
    category === 'all'
      ? null
      : categories.find((c) => c.slug === category)?.name ?? category;

  const filterLinkClass = (active) =>
    `filter-pill ${active ? 'filter-pill-active' : 'filter-pill-inactive'}`;

  const getFilterUrl = (filter, skipPathname) => {
    const filterPage = filter.page || page;
    const filterCategory = filter.category || category;
    const filterQuery = filter.query || query;
    const filterRating = filter.rating || rating;
    const filterPrice = filter.price || price;
    const sortOrder = filter.order || order;
    return `${skipPathname ? '' : '/search?'
      }category=${filterCategory}&query=${filterQuery}&price=${filterPrice}&rating=${filterRating}&order=${sortOrder}&page=${filterPage}`;
  };

  return (
    <div className="animate-slide-up space-y-6">
      <Helmet>
        <title>Search Products — ElectroMerce</title>
      </Helmet>

      <div>
        <h1 className="section-heading">Search products</h1>
        <p className="section-subheading ">Filter by category, price, and rating</p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="card-elevated h-fit w-full border-green-800 bg-green-40/60 space-y-6 p-6 lg:w-72">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="flex items-center gap-2 font-bold text-white">
              <SlidersHorizontal size={20} className="text-black" />
              <span className="text-black">Filters</span>
            </h3>
            {(query !== 'all' || category !== 'all' || rating !== 'all' || price !== 'all') && (
              <button
                type="button"
                onClick={() => navigate('/search')}
                className="text-sm font-semibold text-green-800 transition-colors hover:text-blue-700"
              >
                Reset all
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-red-950">Department</h4>
            <div className="flex flex-col gap-1">
              <Link className={filterLinkClass('all' === category)} to={getFilterUrl({ category: 'all' })}>
                Any
              </Link>
              {categoriesLoading ? (
                <p className="px-3 py-2 text-xs text-slate-400">Loading categories...</p>
              ) : (
                categories.map((c) => (
                  <Link
                    key={c.slug}
                    className={filterLinkClass(c.slug === category)}
                    to={getFilterUrl({ category: c.slug })}
                  >
                    {c.name}
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Price Filter */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-red-950">Price</h4>
            <div className="flex flex-col gap-1">
              <Link className={filterLinkClass('all' === price)} to={getFilterUrl({ price: 'all' })}>
                Any
              </Link>
              {prices.map((p) => (
                <Link
                  key={p.value}
                  className={filterLinkClass(p.value === price)}
                  to={getFilterUrl({ price: p.value })}
                >
                  {p.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-red-950">Customer review</h4>
            <div className="flex flex-col gap-1">
              {ratings.map((r) => (
                <Link
                  key={r.name}
                  to={getFilterUrl({ rating: r.rating })}
                  className={`${filterLinkClass(`${r.rating}` === `${rating}`)} flex items-center`}
                >
                  <Rating caption={' & up'} rating={r.rating} />
                </Link>
              ))}
              <Link
                to={getFilterUrl({ rating: 'all' })}
                className={`${filterLinkClass(rating === 'all')} flex items-center`}
              >
                <Rating caption={' & up'} rating={0} />
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Side: Results & Sorter Grid */}
        <main className="flex-1 space-y-6">
          {loading ? (
            <LoadingBox />
          ) : error ? (
            <MessageBox variant="danger">{error}</MessageBox>
          ) : (
            <>
              {/* Sorter Header Toolbar */}
              <div className="card flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
                  <span>{countProducts === 0 ? 'No' : countProducts} Results</span>
                  {query !== 'all' && <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">Query: {query}</span>}
                  {categoryLabel && (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                      Category: {categoryLabel}
                    </span>
                  )}
                  {price !== 'all' && <span className="bg-slate-200 px-2 py-0.5 rounded text-xs">Price: {price}</span>}
                  {rating !== 'all' && <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">Rating: {rating} & up</span>}

                  {(query !== 'all' || category !== 'all' || rating !== 'all' || price !== 'all') && (
                    <button
                      onClick={() => navigate('/search')}
                      className="text-red-500 hover:text-red-600 transition-colors p-1"
                      title="Clear filters"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <ArrowUpDown size={16} className="text-slate-400" />
                  <select
                    value={order}
                    onChange={(e) => {
                      navigate(getFilterUrl({ order: e.target.value }));
                    }}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50/80 py-2 px-3 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                  >
                    <option value="newest">Newest Arrivals</option>
                    <option value="lowest">Price: Low to High</option>
                    <option value="highest">Price: High to Low</option>
                    <option value="toprated">Avg. Customer Reviews</option>
                  </select>
                </div>
              </div>

              {/* Grid of items */}
              {products.length === 0 ? (
                <div className="card py-16 text-center">
                  <MessageBox>No Product Found</MessageBox>
                </div>
              ) : (
                <div className="product-grid-responsive">
                  {products.map((product) => (
                    <Product key={product._id} product={product} />
                  ))}
                </div>
              )}

              {/* Pagination control footer */}
              {pages > 1 && (
                <div className="flex justify-center items-center gap-1.5 pt-6">
                  {[...Array(pages).keys()].map((x) => (
                    <Link
                      key={x + 1}
                      to={getFilterUrl({ page: x + 1 })}
                      className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${Number(page) === x + 1
                          ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50'
                        }`}
                    >
                      {x + 1}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
