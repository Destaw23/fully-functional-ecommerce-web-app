import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getError } from '../utils/helpers';

/**
 * Fetches product categories from the API (via axios interceptor).
 * Returns { name, slug } objects for filtering and display.
 */
export default function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      try {
        const { data } = await axios.get('/api/products/categories');
        if (!cancelled) {
          const normalized = Array.isArray(data)
            ? data.map((c) =>
                typeof c === 'string'
                  ? { name: c, slug: c.toLowerCase().replace(/\s+/g, '-') }
                  : { name: c.name, slug: c.slug }
              )
            : [];
          setCategories(normalized);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(getError(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading };
}
