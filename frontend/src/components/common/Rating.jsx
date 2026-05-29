import React from 'react';

export default function Rating(props) {
  const { rating, numReviews, caption } = props;

  const renderStar = (index) => {
    const value = index + 0.5;
    if (rating >= index + 1) {
      // Full Star
      return (
        <svg key={index} className="w-4 h-4 text-amber-500 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    } else if (rating >= value) {
      // Half Star
      return (
        <span key={index} className="relative inline-block w-4 h-4 text-slate-300 fill-current">
          <svg className="absolute top-0 left-0 w-full h-full text-amber-500 fill-current" viewBox="0 0 20 20" style={{ clipPath: 'inset(0 50% 0 0)' }}>
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <svg className="w-full h-full fill-current" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.8 2.8a1 1 0 101.414-1.414L11 10.586V6z" clipRule="evenodd" />
          </svg>
        </span>
      );
    } else {
      // Empty Star
      return (
        <svg key={index} className="w-4 h-4 text-slate-300 fill-current" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.8 2.8a1 1 0 101.414-1.414L11 10.586V6z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  return (
    <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
      <div className="flex items-center space-x-0.5">
        {[0, 1, 2, 3, 4].map((index) => renderStar(index))}
      </div>
      {caption ? (
        <span>{caption}</span>
      ) : (
        <span>{numReviews} reviews</span>
      )}
    </div>
  );
}
