import axios from 'axios';
import { useContext, useEffect, useReducer, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Rating from '../components/common/Rating';
import { Helmet } from 'react-helmet-async';
import LoadingBox from '../components/common/LoadingBox';
import MessageBox from '../components/common/MessageBox';
import { getError, getMediaUrl } from '../utils/helpers';
import { Store } from '../context/Store';
import { toast } from 'react-toastify';
import { ShoppingCart, Star, ShieldCheck, Truck, RefreshCw, Send, Heart } from 'lucide-react';
import Product from '../components/products/Product';
import { recommendationService } from '../services/recommendationService';

const reducer = (state, action) => {
  switch (action.type) {
    case 'REFRESH_PRODUCT':
      return { ...state, product: action.payload };
    case 'CREATE_REQUEST':
      return { ...state, loadingCreateReview: true };
    case 'CREATE_SUCCESS':
      return { ...state, loadingCreateReview: false };
    case 'CREATE_FAIL':
      return { ...state, loadingCreateReview: false };
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, product: action.payload, loading: false };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export default function ProductScreen() {
  const reviewsRef = useRef();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [relatedError, setRelatedError] = useState('');
  const [similarError, setSimilarError] = useState('');

  const navigate = useNavigate();
  const params = useParams();
  const { slug } = params;

  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { cart, userInfo, accessToken } = state;

  const [{ loading, error, product, loadingCreateReview }, dispatch] =
    useReducer(reducer, {
      product: [],
      loading: true,
      error: '',
    });

  const getProductId = (item) => item?._id || item?.id;

  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'FETCH_REQUEST' });
      try {
        const result = await axios.get(`/api/products/slug/${slug}`);
        dispatch({ type: 'FETCH_SUCCESS', payload: result.data });
        const productId = getProductId(result.data);
        const authToken = accessToken || localStorage.getItem('accessToken');
        void recommendationService.trackInteraction(productId, 'view', authToken);
      } catch (err) {
        dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
      }
    };
    fetchData();
  }, [accessToken, slug]);

  const productId = getProductId(product);

  useEffect(() => {
    if (!productId) {
      setRelatedProducts([]);
      setRelatedError('');
      setRelatedLoading(false);
      setSimilarProducts([]);
      setSimilarError('');
      setSimilarLoading(false);
      return;
    }

    let isMounted = true;

    const fetchRelated = async () => {
      setRelatedLoading(true);
      setRelatedError('');
      try {
        const related = await recommendationService.getRelated(productId, 6);
        if (isMounted) {
          setRelatedProducts(related);
        }
      } catch (err) {
        if (isMounted) {
          setRelatedProducts([]);
          setRelatedError(getError(err));
        }
      } finally {
        if (isMounted) {
          setRelatedLoading(false);
        }
      }
    };

    const fetchSimilar = async () => {
      setSimilarLoading(true);
      setSimilarError('');
      try {
        const similar = await recommendationService.getSimilar(productId, 6);
        if (isMounted) {
          setSimilarProducts(similar);
        }
      } catch (err) {
        if (isMounted) {
          setSimilarProducts([]);
          setSimilarError(getError(err));
        }
      } finally {
        if (isMounted) {
          setSimilarLoading(false);
        }
      }
    };

    fetchRelated();
    fetchSimilar();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const getStockCount = (data) =>
    data.countInStock ?? data.stock_quantity ?? (data.is_in_stock ? 10 : 0);

  const addToCartHandler = async () => {
    const existItem = cart.cartItems.find((x) => getProductId(x) === getProductId(product));
    const quantity = existItem ? existItem.quantity + 1 : 1;

    let availableStock = getStockCount(product);
    try {
      const { data } = await axios.get(`/api/products/slug/${product.slug}`);
      availableStock = getStockCount(data);
    } catch (err) {
      console.error('Unable to refresh stock count:', err);
    }

    if (availableStock < quantity) {
      window.alert('Sorry. Product is out of stock');
      return;
    }
    ctxDispatch({
      type: 'CART_ADD_ITEM',
      payload: { ...product, quantity, countInStock: availableStock, _id: getProductId(product) },
    });
    const authToken = accessToken || localStorage.getItem('accessToken');
    void recommendationService.trackInteraction(getProductId(product), 'add_to_cart', authToken);
    navigate('/cart');
  };

  const addToWishlistHandler = async () => {
    if (!userInfo) {
      return navigate(`/signin?redirect=/product/${slug}`);
    }

    try {
      await axios.post(
        '/api/products/wishlist/',
        { product: getProductId(product) },
        {
          headers: {
            Authorization: `Bearer ${accessToken || localStorage.getItem('accessToken')}`,
          },
        }
      );
      const authToken = accessToken || localStorage.getItem('accessToken');
      void recommendationService.trackInteraction(getProductId(product), 'wishlist', authToken);
      toast.success('Added to wishlist');
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!comment || !rating) {
      toast.error('Please enter comment and rating');
      return;
    }
    const productId = getProductId(product);
    if (!productId) {
      toast.error('Unable to submit review: product identifier is missing.');
      return;
    }
    try {
      const { data } = await axios.post(
        `/api/products/${productId}/reviews`,
        { rating, comment, name: userInfo.name },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      dispatch({
        type: 'CREATE_SUCCESS',
      });
      toast.success('Review submitted successfully');
      product.reviews.unshift(data.review);
      product.numReviews = data.numReviews;
      product.rating = data.rating;
      dispatch({ type: 'REFRESH_PRODUCT', payload: product });
      setComment('');
      setRating(0);
      window.scrollTo({
        behavior: 'smooth',
        top: reviewsRef.current.offsetTop,
      });
    } catch (error) {
      toast.error(getError(error));
      dispatch({ type: 'CREATE_FAIL' });
    }
  };

  if (loading) return <LoadingBox />;
  if (error) return <MessageBox variant="danger">{error}</MessageBox>;

  const mainImg = getMediaUrl(product.image || product.main_image);
  const productImages = product.images && product.images.length > 0
    ? [mainImg, ...product.images.map((img) => getMediaUrl(img))]
    : [mainImg];

  return (
    <div className="space-y-12 pb-16">
      <Helmet>
        <title>{product.name}</title>
      </Helmet>

      {/* Main product box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row gap-4">

        {/* Images display */}
        <div className="w-full lg:w-1/2 flex flex-col space-y-4">
          <div className="aspect-square bg-slate-50 border border-slate-100 rounded-xl overflow-hidden max-h-[500px] p-4">
            <img
              src={getMediaUrl(selectedImage) || mainImg || undefined}
              alt={product.name}
              className="w-full h-full object-contain object-center block"
            />
          </div>

          {/* Gallery thumbnails */}
          {productImages.filter(Boolean).length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {productImages.filter(Boolean).map((x, index) => (
                <button
                  key={x || index}
                  onClick={() => setSelectedImage(x)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 bg-slate-50 ${(selectedImage ? getMediaUrl(selectedImage) : mainImg) === x ? 'border-blue-500 shadow-sm' : 'border-transparent hover:border-slate-300'
                    }`}
                >
                  <img src={getMediaUrl(x) || undefined} alt="thumbnail" className="w-full h-full object-contain object-center block" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="w-full lg:w-1/2 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="bg-blue-50 text-blue-600 font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full border border-blue-100">
              {product.category?.name || 'Electronics'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {product.name}
            </h1>

            <Rating rating={product.rating} numReviews={product.numReviews} />

            <div className="text-2xl font-black text-slate-900">
              Price: Br{product.price}
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Description</span>
              <p className="text-sm text-slate-600 leading-relaxed">
                {product.description || 'No description provided for this product.'}
              </p>
            </div>
          </div>

          {/* Action box */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            {/* Store Seller Info Card */}
            {product.store && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-brand-50/30 border border-brand-100/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white border border-brand-200 p-1 flex items-center justify-center font-bold text-brand-600 shrink-0 shadow-sm">
                    {product.store.logo ? (
                      <img src={getMediaUrl(product.store.logo)} alt={product.store.name} className="h-full w-full object-cover rounded-lg" />
                    ) : (
                      product.store.name?.charAt(0) || 'S'
                    )}
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Sold by</span>
                    <Link to={`/store/${product.store.slug || product.store.id}`} className="font-bold text-slate-900 hover:text-brand-600 text-sm flex items-center gap-1">
                      <span>{product.store.name}</span>
                      {product.store.is_verified && (
                        <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                      )}
                    </Link>
                  </div>
                </div>

                <Link
                  to={`/store/${product.store.slug || product.store.id}`}
                  className="px-3 py-1.5 rounded-xl border border-brand-200 bg-white text-brand-700 hover:bg-brand-50 font-bold text-xs transition-colors shrink-0"
                >
                  Visit Store →
                </Link>
              </div>
            )}

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Availability Status:</span>
              <span>
                {product.countInStock > 0 ? (
                  <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-2.5 py-0.5 rounded-full">In Stock</span>
                ) : (
                  <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-2.5 py-0.5 rounded-full">Unavailable</span>
                )}
              </span>
            </div>

            {product.countInStock > 0 && (
              <div className="grid gap-3">
                <button
                  onClick={addToCartHandler}
                  className="w-full bg-green-800 hover:bg-green-900 text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center space-x-2 shadow transition-colors"
                >
                  <ShoppingCart size={16} />
                  <span>Add to Cart</span>
                </button>
                <button
                  type="button"
                  onClick={addToWishlistHandler}
                  className="w-full border border-slate-200 bg-white text-slate-800 font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 transition hover:border-brand-600 hover:text-brand-600"
                >
                  <Heart size={16} />
                  <span>Add to Wishlist</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 pt-4 text-slate-400 text-[10px] uppercase tracking-wider text-center border-t border-slate-100">
              <div className="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
                <ShieldCheck className="text-blue-500 mb-1" size={16} />
                <span>Genuine Quality</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
                <Truck className="text-blue-500 mb-1" size={16} />
                <span>Secure Delivery</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
                <RefreshCw className="text-blue-500 mb-1" size={16} />
                <span>Easy Return</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <section className="space-y-8">
        <div className="space-y-4">
          <div>
            <h2 className="section-heading">You may also like</h2>
            <p className="section-subheading">Related picks based on this product's popularity and purchase patterns.</p>
          </div>

          {relatedLoading ? (
            <LoadingBox />
          ) : relatedError ? (
            <MessageBox variant="danger">{relatedError}</MessageBox>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {relatedProducts.map((item) => (
                <Product key={item.id || item.slug} product={item} />
              ))}
            </div>
          ) : (
            <MessageBox>No related products are available right now.</MessageBox>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="section-heading">Similar products</h2>
            <p className="section-subheading">Items with matching features and product attributes.</p>
          </div>

          {similarLoading ? (
            <LoadingBox />
          ) : similarError ? (
            <MessageBox variant="danger">{similarError}</MessageBox>
          ) : similarProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {similarProducts.map((item) => (
                <Product key={item.id || item.slug} product={item} />
              ))}
            </div>
          ) : (
            <MessageBox>No similar products are available right now.</MessageBox>
          )}
        </div>
      </section>

      {/* Review block */}
      <div className="space-y-6">
        <h2 ref={reviewsRef} className="text-xl font-black text-slate-800 tracking-tight">Customer Reviews</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Write review form */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Write a Customer Review</h3>
            {userInfo ? (
              <form onSubmit={submitHandler} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Rating</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="1">1- Poor</option>
                    <option value="2">2- Fair</option>
                    <option value="3">3- Good</option>
                    <option value="4">4- Very good</option>
                    <option value="5">5- Excellent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Comments</label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Leave a comment here"
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loadingCreateReview}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg text-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{loadingCreateReview ? 'Submitting...' : 'Submit Review'}</span>
                </button>
              </form>
            ) : (
              <MessageBox>
                Please{' '}
                <Link to={`/signin?redirect=/product/${product.slug}`} className="text-blue-600 hover:underline font-bold">
                  Sign In
                </Link>{' '}
                to write a review.
              </MessageBox>
            )}
          </div>

          {/* List of reviews */}
          <div className="lg:col-span-2 space-y-4">
            {Array.isArray(product.reviews) && product.reviews.length > 0 ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {product.reviews
                  .filter(Boolean)
                  .map((review) => {
                    const name = review?.name || review?.user_name || 'Anonymous';
                    const createdAt = review?.createdAt || review?.created_at || '';
                    return (
                      <div
                        key={review?._id || review?.id || name + createdAt}
                        className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 shadow-xxs"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-bold text-slate-800 text-sm">{name}</span>
                          <span>{createdAt ? createdAt.substring(0, 10) : ''}</span>
                        </div>
                        <Rating rating={review?.rating || 0} caption=" " />
                        <p className="text-sm text-slate-600 leading-relaxed pt-1">{review?.comment || ''}</p>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white">
                There are no reviews for this product yet.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
