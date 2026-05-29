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
    if (typeof data === 'object') {
      const firstKey = Object.keys(data)[0];
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
  return error.message;
};
