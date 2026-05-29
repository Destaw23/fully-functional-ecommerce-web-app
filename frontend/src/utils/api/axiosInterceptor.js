import axios from 'axios';

// Helper to slugify category names
const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g);

// Prepend host to relative media URLs
const formatImageUrl = (url) => {
  if (!url) return null;

  // If the backend returned an absolute URL with localhost or 127.0.0.1, convert to relative so it routes through Vite proxy
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.includes('/media/')) {
      return '/media/' + url.split('/media/')[1];
    }
    return url;
  }

  // Prepend /media/ if it is a relative path and doesn't have it
  if (url.startsWith('/media/') || url.startsWith('media/')) {
    return url.startsWith('/') ? url : '/' + url;
  }

  return `/media/${url.startsWith('/') ? url.slice(1) : url}`;
};



// Global Axios Request Interceptor
axios.interceptors.request.use(
  async (config) => {
    // If it's an internal call to bypass interceptor hooks, skip rewriting
    if (config._bypassSync) {
      return config;
    }

    // Ensure headers object is available before manipulating it
    config.headers = config.headers || {};

    // Add JWT token to requests if available (overriding legacy empty/undefined values)
    const accessToken = localStorage.getItem('accessToken');
    
    // Clean up any invalid authorization header formats to avoid conflicts and duplication
    if (config.headers.authorization) {
      const authVal = String(config.headers.authorization).trim();
      if (authVal === 'Bearer undefined' || authVal === 'Bearer null' || authVal === 'Bearer' || !authVal) {
        delete config.headers.authorization;
      }
    }
    if (config.headers.Authorization) {
      const authVal = String(config.headers.Authorization).trim();
      if (authVal === 'Bearer undefined' || authVal === 'Bearer null' || authVal === 'Bearer' || !authVal) {
        delete config.headers.Authorization;
      }
    }

    // Set a single canonical Authorization header
    if (accessToken && !config.headers.Authorization && !config.headers.authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    const token = config.headers.Authorization || config.headers.authorization;
    const originalUrl = config.url;

    // Check if the current user has admin privileges
    let isAdmin = false;
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        isAdmin = !!(userInfo.isAdmin || userInfo.role === 'admin');
      }
    } catch (e) { }

    // 1. GET /api/products -> GET /api/products/products/
    if (config.url === '/api/products' || config.url === '/api/products/') {
      if (config.method === 'get') {
        config.url = '/api/products/products/';
      } else if (config.method === 'post') {
        config.url = '/api/admin/products/';
      }
    }

    // 2. GET /api/products/categories -> GET /api/products/categories/
    if (config.url.startsWith('/api/products/categories')) {
      config.url = '/api/products/categories/';
      if (config.method === 'get') {
        config.params = { ...config.params, page_size: 100 };
      }
    }

    // 2b. GET /api/products/search -> GET /api/products/products/ (product list + filters)
    if (config.url.startsWith('/api/products/search')) {
      const queryString = config.url.includes('?') ? config.url.split('?')[1] : '';
      config.url = '/api/products/products/';
      config._isSearch = true;
      if (queryString) {
        config.params = Object.fromEntries(new URLSearchParams(queryString));
      }
    }

    // 3. GET /api/products/slug/:slug -> GET /api/products/products/:slug/
    if (config.url.startsWith('/api/products/slug/')) {
      const slug = config.url.replace('/api/products/slug/', '').replace(/\/$/, '');
      config.url = `/api/products/products/${slug}/`;
    }

    // 4. GET /api/products/admin -> GET /api/admin/products/
    if (config.url.startsWith('/api/products/admin')) {
      config.url = '/api/admin/products/';
    }

    // 5. GET/PUT/DELETE /api/products/:id (numeric id) -> GET/PUT/DELETE /api/admin/products/:id/
    const productIdMatch = config.url.match(/^\/api\/products\/(\d+)\/?$/);
    if (productIdMatch) {
      const id = productIdMatch[1];
      config.url = `/api/admin/products/${id}/`;

      // Handled by unified product write interceptor below
    }

    // 6. DELETE /api/products/:id -> DELETE /api/admin/products/:id/
    if (config.url.match(/^\/api\/products\/(\d+)\/?$/) && config.method === 'delete') {
      const id = config.url.match(/^\/api\/products\/(\d+)\/?$/)[1];
      config.url = `/api/admin/products/${id}/`;
    }

    // 7. POST /api/products/:id/reviews -> POST /api/products/reviews/
    const reviewMatch = config.url.match(/^\/api\/products\/(\d+)\/reviews\/?$/);
    if (reviewMatch) {
      const id = reviewMatch[1];
      config.url = '/api/products/reviews/';
      config.method = 'post';
      config.data = {
        product: Number(id),
        rating: config.data.rating,
        comment: config.data.comment,
        title: 'Review',
      };
    }

    // 8. POST /api/auth/login -> POST /api/auth/login/
    if (config.url === '/api/auth/login/') {
      config.url = '/api/auth/login/';
      config.data = {
        email: config.data.email,
        password: config.data.password,
      };
    }

    // 9. POST /api/auth/register -> POST /api/auth/register/
    if (config.url === '/api/auth/register/') {
      config.url = '/api/auth/register/';
      config.data = {
        username: config.data.username,
        email: config.data.email,
        password: config.data.password,
        password2: config.data.password2,
      };
    }

    // 10. GET/PUT /api/auth/profile -> GET/PUT /api/auth/profile/
    if (config.url === '/api/auth/profile/') {
      config.url = '/api/auth/profile/';
    }

    // 11. GET /api/users -> GET /api/admin/users/
    if (config.url === '/api/users' || config.url === '/api/users/') {
      if (config.method === 'get') {
        config.url = '/api/admin/users/';
      }
    }

    // 12. GET/PUT/DELETE /api/users/:id -> GET/PUT/DELETE /api/admin/users/:id/
    const userIdMatch = config.url.match(/^\/api\/users\/(\d+)\/?$/);
    if (userIdMatch) {
      const id = userIdMatch[1];
      config.url = `/api/admin/users/${id}/`;
      if (config.method === 'put' && config.data) {
        config.data = {
          username: config.data.name,
          email: config.data.email,
          role: config.data.isAdmin ? 'admin' : 'customer',
        };
      }
    }

    // 13. POST /api/orders -> POST /api/orders/create/ (Sync local cart to backend first!)
    if (config.url === '/api/orders' && config.method === 'post') {
      try {
        const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
        await axios.delete('/api/cart/clear/', { headers: { Authorization: token }, _bypassSync: true });
        for (const item of cartItems) {
          await axios.post(
            '/api/cart/add/',
            { product_id: item._id || item.id, quantity: item.quantity },
            { headers: { Authorization: token }, _bypassSync: true }
          );
        }
      } catch (e) {
        console.error('Failed to sync frontend cart with backend:', e);
      }

      config.url = '/api/orders/create/';
      config.data = {
        shipping_name: config.data.shippingAddress.fullName,
        shipping_address: config.data.shippingAddress.address,
        shipping_city: config.data.shippingAddress.city,
        shipping_phone: config.data.shippingAddress.phone,
        payment_method: config.data.paymentMethod || 'PayPal',
        notes: config.data.notes || '',
        orderItems: config.data.orderItems || [],
      };
    }

    // 14. GET /api/orders/mine -> GET /api/orders/
    if (config.url === '/api/orders/mine') {
      config.url = '/api/orders/';
    }

    // 15. GET /api/orders (admin) -> GET /api/admin/orders/
    if (config.url === '/api/orders' && config.method === 'get') {
      config.url = '/api/admin/orders/';
    }

    // 16. GET /api/orders/:id -> GET /api/orders/:id/ (or DELETE/GET admin endpoint if admin)
    const orderIdMatch = config.url.match(/^\/api\/orders\/(\d+)\/?$/);
    if (orderIdMatch) {
      const id = orderIdMatch[1];
      if (config.method === 'delete' || isAdmin) {
        config.url = `/api/admin/orders/${id}/`;
      } else {
        config.url = `/api/orders/${id}/`;
      }
    }

    // 17. PUT /api/orders/:id/deliver -> PATCH /api/admin/orders/:id/
    const orderDeliverMatch = config.url.match(/^\/api\/orders\/(\d+)\/deliver\/?$/);
    if (orderDeliverMatch) {
      const id = orderDeliverMatch[1];
      config.url = `/api/admin/orders/${id}/`;
      config.method = 'patch';
      config.data = { status: 'delivered' };
    }

    // 18. PUT /api/orders/:id/pay -> PATCH /api/admin/orders/:id/
    const orderPayMatch = config.url.match(/^\/api\/orders\/(\d+)\/pay\/?$/);
    if (orderPayMatch) {
      const id = orderPayMatch[1];
      config.url = `/api/admin/orders/${id}/`;
      config.method = 'patch';
      config.data = { status: 'paid', payment_status: 'paid' };
    }

    // 19. GET /api/orders/summary -> GET /api/admin/stats/ and sales-chart/ in parallel
    if (config.url === '/api/orders/summary') {
      config.adapter = async () => {
        try {
          const [statsRes, chartRes, catRes] = await Promise.all([
            axios.get('/api/admin/stats/', { headers: { Authorization: token }, _bypassSync: true }),
            axios.get('/api/admin/sales-chart/', { headers: { Authorization: token }, _bypassSync: true }),
            axios.get('/api/products/categories/', { headers: { Authorization: token }, _bypassSync: true }),
          ]);

          const statsData = statsRes.data;
          const chartData = chartRes.data;
          const categoriesData = catRes.data.results || [];

          const summary = {
            users: [{ numUsers: statsData.users?.total || 0 }],
            orders: [
              {
                numOrders: statsData.overview?.total_orders || 0,
                totalSales: statsData.overview?.total_revenue || 0,
              },
            ],
            dailyOrders: chartData.map((c) => ({ _id: c.date, sales: c.sales })),
            productCategories: categoriesData.map((c) => ({ _id: c.name, count: c.product_count })),
          };

          return {
            data: summary,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          };
        } catch (err) {
          return Promise.reject(err);
        }
      };
    }

    // 20. GET /api/keys/paypal -> Mock sandbox PayPal Client ID
    if (config.url === '/api/keys/paypal') {
      config.adapter = () =>
        Promise.resolve({
          data: 'sb',
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        });
    }

    // 21. GET /api/keys/google -> Mock Google Maps Key
    if (config.url === '/api/keys/google') {
      config.adapter = () =>
        Promise.resolve({
          data: { key: '' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        });
    }

    // 22. Rewrite Search / Filter Query Params inside list requests
    const isProductList = config.url.includes('/products/products/');
    if (isProductList && config.method === 'get' && config.params) {
      const params = { ...config.params };

      if (params.query && params.query !== 'all') {
        params.search = params.query;
      }
      delete params.query;

      if (params.category && params.category !== 'all') {
        params.category = slugify(params.category);
      } else {
        delete params.category;
      }

      if (params.price && params.price !== 'all') {
        const parts = params.price.split('-');
        if (parts.length >= 1 && parts[0] !== '') {
          params.min_price = parts[0];
        }
        if (parts.length >= 2 && parts[1] !== '') {
          params.max_price = parts[1];
        }
      }
      delete params.price;

      if (!params.rating || params.rating === 'all') {
        delete params.rating;
      }

      if (params.order) {
        if (params.order === 'newest') params.ordering = '-created_at';
        else if (params.order === 'lowest') params.ordering = 'price';
        else if (params.order === 'highest') params.ordering = '-price';
        else if (params.order === 'toprated') params.ordering = '-rating';
      }
      delete params.order;

      config.params = params;
    }

    // Unified Product Write payload transformation for POST and PUT
    const isProductWrite =
      config.url.includes('/admin/products') &&
      (config.method === 'post' || config.method === 'put') &&
      config.data;

    if (isProductWrite) {
      const isFormData = typeof window !== 'undefined' && config.data instanceof FormData;
      const getVal = (key) => isFormData ? config.data.get(key) : config.data[key];
      const setVal = (key, val) => {
        if (isFormData) {
          config.data.set(key, val);
        } else {
          config.data[key] = val;
        }
      };
      const deleteVal = (key) => {
        if (isFormData) {
          config.data.delete(key);
        } else {
          delete config.data[key];
        }
      };

      // 1. Translate category string name to category ID integer
      try {
        const categoryVal = getVal('category');
        if (categoryVal) {
          const isNumeric = !isNaN(categoryVal) && String(categoryVal).trim() !== '';
          if (isNumeric) {
            setVal('category', Number(categoryVal));
          } else if (typeof categoryVal === 'string') {
            const catRes = await axios.get('/api/products/categories/', {
              headers: { Authorization: token },
              _bypassSync: true,
            });
            const categories = Array.isArray(catRes.data) ? catRes.data : (catRes.data.results || []);
            const matched = categories.find(
              (c) =>
                c.name.toLowerCase() === categoryVal.toLowerCase() ||
                c.slug.toLowerCase() === categoryVal.toLowerCase()
            );
            const categoryId = matched ? matched.id : (categories[0] ? categories[0].id : 1);
            setVal('category', categoryId);
          }
        }
      } catch (e) {
        console.error('Failed to map category name to ID in interceptor:', e);
        setVal('category', 1);
      }

      // 2. Map countInStock to stock_quantity
      const countInStock = getVal('countInStock');
      if (countInStock !== undefined && countInStock !== null) {
        setVal('stock_quantity', Number(countInStock));
        deleteVal('countInStock');
      }

      // 3. Map image URL string to main_image (if not already a file upload)
      // Since Django's ImageField does not accept a string URL, we omit it
      // if it's a string to prevent DRF validation errors, retaining the existing image.
      const image = getVal('image');
      const mainImage = getVal('main_image');
      if (image && typeof image === 'string') {
        deleteVal('image');
        if (typeof mainImage === 'string' || !mainImage) {
          deleteVal('main_image');
        }
      }
    }

    // Append trailing slash to other DRF paths (excluding files/images/etc.)
    if (config.url.startsWith('/api/') && !config.url.includes('.')) {
      const [path, query] = config.url.split('?');
      if (!path.endsWith('/')) {
        config.url = `${path}/${query ? '?' + query : ''}`;
      }
    }

    console.log(`[Axios Interceptor Request] ${config.method.toUpperCase()} ${originalUrl} -> ${config.url}`, config.params || config.data || '');
    return config;
  },
  (error) => Promise.reject(error)
);

// Global Axios Response Interceptor
axios.interceptors.response.use(
  (response) => {
    const { config, data } = response;

    if (!data) return response;

    const cleanPath = config.url.split('?')[0];

    // A. Parse /api/products/products/ list and detail responses
    if (/^\/api\/products\/products(\/[^/]+)?\/$/.test(cleanPath)) {
      if (data.results && Array.isArray(data.results)) {
        const mappedProducts = data.results.map((product) => ({
          _id: product.id,
          name: product.name,
          slug: product.slug,
          image: formatImageUrl(product.main_image),
          price: Number(product.price),
          rating: Number(product.rating || 0),
          numReviews: Number(product.total_reviews || 0),
          countInStock:
            product.stock_quantity !== undefined
              ? product.stock_quantity
              : product.is_in_stock
                ? 10
                : 0,
          category: product.category_name || '',
          brand: product.brand || '',
          description: product.description || '',
        }));

        if (cleanPath.includes('/admin/')) {
          const sp = new URLSearchParams(config.url.split('?')[1] || '');
          const page = Number(sp.get('page') || 1);
          response.data = {
            products: mappedProducts,
            page,
            pages: Math.ceil(data.count / 20) || 1,
          };
        } else if (config._isSearch) {
          const sp = new URLSearchParams(config.url.split('?')[1] || '');
          const page = Number(config.params?.page || sp.get('page') || 1);
          response.data = {
            products: mappedProducts,
            page,
            pages: Math.ceil(data.count / 20) || 1,
            countProducts: data.count,
          };
        } else {
          response.data = mappedProducts;
        }
      } else if (data.id) {
        response.data = {
          _id: data.id,
          name: data.name,
          slug: data.slug,
          image: formatImageUrl(data.main_image),
          images: data.additional_images
            ? data.additional_images.map((img) => formatImageUrl(img.image))
            : [],
          price: Number(data.price),
          rating: Number(data.rating || 0),
          numReviews: Number(data.total_reviews || 0),
          countInStock: data.stock_quantity !== undefined ? data.stock_quantity : 0,
          category: data.category ? data.category.name : '',
          brand: data.brand || '',
          description: data.description || '',
          reviews: Array.isArray(data.reviews)
            ? data.reviews
              .filter(Boolean)
              .map((r) => ({
                _id: r?.id,
                name: r?.user_name || 'Anonymous',
                rating: Number(r?.rating || 0),
                comment: r?.comment || '',
                createdAt: r?.created_at || '',
              }))
            : [],
        };
      }
    }

    // B. Parse /api/admin/products/ list/detail responses
    if (cleanPath.endsWith('/admin/products/') || cleanPath.match(/\/admin\/products\/\d+\/?$/)) {
      if (data.results && Array.isArray(data.results)) {
        const mappedProducts = data.results.map((product) => ({
          _id: product.id,
          name: product.name,
          slug: product.slug,
          image: formatImageUrl(product.main_image),
          price: Number(product.price),
          category: product.category_name || '',
          brand: product.brand || '',
          countInStock: product.stock_quantity !== undefined ? product.stock_quantity : 0,
        }));

        const sp = new URLSearchParams(config.url.split('?')[1] || '');
        const page = Number(sp.get('page') || 1);
        response.data = {
          products: mappedProducts,
          page,
          pages: Math.ceil(data.count / 20) || 1,
        };
      } else if (data.id) {
        response.data = {
          _id: data.id,
          name: data.name,
          slug: data.slug,
          image: formatImageUrl(data.main_image),
          images: data.additional_images
            ? data.additional_images.map((img) => formatImageUrl(img.image))
            : [],
          price: Number(data.price),
          rating: Number(data.rating || 0),
          numReviews: Number(data.total_reviews || 0),
          countInStock: data.stock_quantity !== undefined ? data.stock_quantity : 0,
          category: data.category_name || '',
          brand: data.brand || '',
          description: data.description || '',
        };
      }
    }

    // C. Parse categories endpoint response
    if (cleanPath.endsWith('/products/categories/')) {
      if (data.results && Array.isArray(data.results)) {
        response.data = data.results.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        }));
      } else if (Array.isArray(data)) {
        response.data = data.map((c) =>
          typeof c === 'string' ? { name: c, slug: slugify(c) } : { id: c.id, name: c.name, slug: c.slug }
        );
      }
    }

    // D. Parse user login/register response
    if (cleanPath.endsWith('/auth/login/') || cleanPath.endsWith('/auth/register/')) {
      if (data.user) {
        response.data = {
          user: {
            ...data.user,
            isAdmin: data.user.role === 'admin',
          },
          access: data.access,
          refresh: data.refresh,
        };
      } else if (data.access && data.refresh) {
        // Fallback if user data is wrapped differently
        response.data = {
          user: {
            id: data.id || 0,
            username: data.username || data.name || '',
            email: data.email || '',
            role: data.role || 'customer',
            isAdmin: data.role === 'admin',
          },
          access: data.access,
          refresh: data.refresh,
        };
      }
    }

    // E. Parse user profile response
    if (cleanPath.endsWith('/auth/profile/')) {
      const storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      response.data = {
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role,
        isAdmin: data.role === 'admin',
      };
    }

    // F. Parse customer orders list response
    if (cleanPath.endsWith('/orders/')) {
      if (data.results && Array.isArray(data.results)) {
        response.data = data.results.map((order) => ({
          _id: order.id,
          createdAt: order.created_at,
          totalPrice: Number(order.total_amount),
          isPaid: order.payment_status === 'paid',
          paidAt: order.updated_at,
          isDelivered: order.status === 'delivered',
          deliveredAt: order.updated_at,
        }));
      }
    }

    // G. Parse admin orders list response
    if (cleanPath.endsWith('/admin/orders/')) {
      if (data.results && Array.isArray(data.results)) {
        response.data = data.results.map((order) => ({
          _id: order.id,
          user: order.user_email ? { name: order.user_email } : null,
          createdAt: order.created_at,
          totalPrice: Number(order.total_amount),
          isPaid: order.payment_status === 'paid',
          paidAt: order.updated_at,
          isDelivered: order.status === 'delivered',
          deliveredAt: order.updated_at,
        }));
      }
    }

    // H. Parse single order details response
    const isOrderDetail = cleanPath.match(/\/orders\/\d+\/?$/);
    if (isOrderDetail || cleanPath.endsWith('/orders/create/')) {
      const order = data.order || data;
      if (order.id) {
        const mappedOrder = {
          _id: order.id,
          orderNumber: order.order_number,
          createdAt: order.created_at,
          totalPrice: Number(order.total_amount),
          itemsPrice: Number(order.subtotal),
          shippingPrice: Number(order.shipping_cost),
          taxPrice: Number(order.tax),
          isPaid: order.payment_status === 'paid',
          paidAt: order.updated_at,
          isDelivered: order.status === 'delivered',
          deliveredAt: order.updated_at,
          paymentMethod: order.payment_method,
          shippingAddress: {
            fullName: order.shipping_name,
            address: order.shipping_address,
            city: order.shipping_city,
            phone: order.shipping_phone,
            postalCode: '',
            country: 'Ethiopia',
          },
          orderItems: order.items
            ? order.items.map((item) => ({
              _id: item.id,
              name: item.product_name,
              slug: item.product_detail ? item.product_detail.slug : '',
              image: item.product_detail ? formatImageUrl(item.product_detail.main_image) : '',
              price: Number(item.product_price),
              quantity: item.quantity,
            }))
            : [],
        };

        if (cleanPath.endsWith('/orders/create/')) {
          response.data = { order: mappedOrder };
        } else {
          response.data = mappedOrder;
        }
      }
    }

    // I. Parse admin users list response
    if (cleanPath.endsWith('/admin/users/')) {
      if (data.results && Array.isArray(data.results)) {
        response.data = data.results.map((user) => ({
          _id: user.id,
          name: user.username,
          email: user.email,
          isAdmin: user.role === 'admin',
        }));
      }
    }

    // J. Parse admin user detail response
    const isUserDetail = cleanPath.match(/\/admin\/users\/\d+\/?$/);
    if (isUserDetail) {
      response.data = {
        _id: data.id,
        name: data.username,
        email: data.email,
        isAdmin: data.role === 'admin',
      };
    }


    console.log(`[Axios Interceptor Response] ${config.method.toUpperCase()} ${cleanPath}`, response.data);
    return response;
  },
  async (error) => {
    const config = error.config || {};
    const status = error.response?.status;

    if (status === 401) {
      // Clear stale auth state from localStorage so public pages can still load.
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userInfo');

      const retryablePublicGet =
        config.method === 'get' &&
        config.url?.startsWith('/api/products');

      if (retryablePublicGet && !config._retryWithoutAuth) {
        config._retryWithoutAuth = true;
        if (config.headers) {
          delete config.headers.Authorization;
          delete config.headers.authorization;
        }
        return axios(config);
      }
    }

    return Promise.reject(error);
  }
);
