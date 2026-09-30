import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const socialLinks = [
  {
    href: 'https://facebook.com/dannnmeles',
    label: 'Facebook',
    icon: (
      <svg className="h-[18px] w-[18px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 8H7v3h2v9h3v-9h2.72l.42-3H12V6.63c0-.88.24-1.48 1.5-1.48H15V2.35A22.39 22.39 0 0 0 12.82 2c-2.15 0-3.62 1.3-3.62 3.71V8Z" />
      </svg>
    ),
  },
  {
    href: 'https://twitter.com/Dest2123',
    label: 'X (Twitter)',
    icon: (
      <svg className="h-[18px] w-[18px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    href: 'https://instagram.com/dales2929',
    label: 'Instagram',
    icon: (
      <svg
        className="h-[18px] w-[18px] fill-none stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
  },
  {
    href: 'https://youtube.com/@DestawDestaw-c3q',
    label: 'YouTube',
    icon: (
      <svg
        className="h-[18px] w-[18px] fill-none stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: 'https://t.me/REGAIND',
    label: 'Telegram',
    icon: (
      <svg className="h-[18px] w-[18px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2 12 L20 6 L12 12 L20 18 L2 12 Z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800/50 bg-slate-950 text-slate-400 w-full max-w-full overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-1">
            <span className="text-2xl font-extrabold tracking-tight text-white">
              Electro<span className="text-brand-400">Merce</span>
            </span>
            <p className="text-sm leading-relaxed text-slate-400">
              Premium electronics and gadgets with reliable delivery across Ethiopia.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80 text-slate-400 transition-all hover:bg-brand-600 hover:text-white"
                  aria-label={social.label}
                  title={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
              Quick links
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/search" className="transition-colors hover:text-white">
                  All products
                </Link>
              </li>
              <li>
                <Link to="/cart" className="transition-colors hover:text-white">
                  Shopping cart
                </Link>
              </li>
              <li>
                <Link to="/profile" className="transition-colors hover:text-white">
                  My profile
                </Link>
              </li>
              <li>
                <Link to="/orderhistory" className="transition-colors hover:text-white">
                  Order history
                </Link>
              </li>
              <li>
                <Link to="/map" className="transition-colors hover:text-white">
                  Live location map
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
              Support
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="mailto:destawdestaw769@gmail.com?subject=Help%20Center"
                  className="transition-colors hover:text-white"
                >
                  Help center
                </a>
              </li>
              <li>
                <Link to="/search" className="transition-colors hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/search" className="transition-colors hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/orderhistory" className="transition-colors hover:text-white">
                  Returns & exchanges
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
              Contact
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="mt-0.5 shrink-0 text-brand-400" />
                <span>Maraki, Gondar, Ethiopia</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone size={16} className="mt-0.5 shrink-0 text-brand-400" />
                <span>
                  +251 963 589 213
                  <br />
                  +251 968 975 800
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail size={16} className="mt-0.5 shrink-0 text-brand-400" />
                <a
                  href="mailto:destawdestaw769@gmail.com"
                  className="transition-colors hover:text-white"
                >
                  destawdestaw769@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} ElectroMerce. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
