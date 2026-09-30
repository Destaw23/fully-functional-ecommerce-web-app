/**
 * Formats a numeric value into a local currency string.
 */
export const formatCurrency = (value) => {
  if (value === undefined || value === null) return 'Br0.00';
  const amount = typeof value === 'string' ? parseFloat(value) : value;
  const numericAmount = isNaN(amount) ? 0 : amount;
  return `Br${numericAmount.toFixed(2)}`;
};

/**
 * Formats an ISO date string into a readable format (e.g. May 23, 2026).
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Validates an email address.
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Truncates text to a specified length and appends an ellipsis.
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

/** Convert category name to URL slug (matches backend Django slugs). */
export const slugify = (str) =>
  String(str)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Extracts error message from error object.
 */
export const getError = (error) => {
  if (error.response && error.response.data) {
    const data = error.response.data;
    if (data.message) return data.message;
    if (data.detail) return data.detail;
    if (data.error) return data.error;
    if (data.non_field_errors) {
      return Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
    }
    if (data && typeof data === 'object') {
      const keys = Object.keys(data);
      if (keys.length > 0) {
        const firstKey = keys[0];
        const val = data[firstKey];
        if (val) {
          const fieldErr = Array.isArray(val) ? val[0] : val;
          if (typeof fieldErr === 'string') {
            if (firstKey !== 'detail' && firstKey !== 'error' && firstKey !== 'non_field_errors') {
              return `${firstKey}: ${fieldErr}`;
            }
            return fieldErr;
          }
        }
      }
    }
  }
  return error.message;
};

/**
 * Prepends /media/ to relative image paths and leaves remote asset URLs untouched.
 * Also repairs legacy bad values such as /media/https:/images.unsplash.com/... and encoded URLs.
 */
export const getMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';

  let normalized = url.trim();
  if (!normalized) return '';

  const repairExternalUrl = (value) => {
    if (!value) return value;
    const decoded = decodeURIComponent(value);
    const fixed = decoded.replace(/^https?:\/([^/])/, 'https://$1');
    return /^https?:\/\//i.test(fixed) ? fixed : decoded;
  };

  // Recover legacy bad values that were rewritten into local media paths.
  if (normalized.includes('/media/https:') || normalized.includes('/media/http:') || normalized.includes('https%3A') || normalized.includes('http%3A')) {
    const recovered = normalized.replace(/^\/media\//, '').replace(/^media\//, '');
    try {
      const repaired = repairExternalUrl(recovered);
      if (/^https?:\/\//i.test(repaired)) return repaired;
      normalized = repaired;
    } catch (error) {
      const direct = recovered.replace(/^https?:/, 'https:');
      const repaired = direct.replace(/^https?:\/([^/])/, 'https://$1');
      if (/^https?:\/\//i.test(repaired)) return repaired;
    }
  }

  // Keep external asset URLs (Unsplash, CDN, etc.) as-is.
  if (/^https?:\/\//i.test(normalized) || normalized.startsWith('//') || /^data:/i.test(normalized)) {
    return normalized;
  }

  if (normalized.startsWith('/media/')) return normalized;
  if (normalized.startsWith('media/')) return `/${normalized}`;

  return `/media/${normalized.startsWith('/') ? normalized.slice(1) : normalized}`;
};

