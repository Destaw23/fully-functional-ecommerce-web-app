import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function SearchBox() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submitHandler = (e) => {
    e.preventDefault();
    navigate(query ? `/search/?query=${encodeURIComponent(query)}` : '/search');
  };

  return (
    <form className="flex w-full" onSubmit={submitHandler}>
      <div className="relative flex w-full items-center rounded-2xl border border-slate-200/80 bg-slate-50/80 shadow-soft transition-all focus-within:border-brand-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/10">
        <Search size={18} className="ml-4 shrink-0 text-slate-400" strokeWidth={2} />
        <input
          type="search"
          name="q"
          id="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search phones, laptops, audio..."
          aria-label="Search products"
          className="w-full bg-transparent py-2.5 pl-3 pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          className="absolute right-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Search
        </button>
      </div>
    </form>
  );
}
