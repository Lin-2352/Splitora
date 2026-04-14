"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from './Logo';

const navItems = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    exact: true
  },
  {
    href: '/dashboard/groups',
    label: 'Groups',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    exact: false
  },
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    exact: false
  }
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (item: typeof navItems[0]) => {
    if (item.href === '#') return false;
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-5 left-4 z-50 md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 text-white light:text-slate-900 hover:bg-slate-800 light:hover:bg-slate-100 transition-colors shadow-lg light:shadow-sm"
          aria-label="Open sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Desktop Hamburger Button (when sidebar is hidden) */}
      {!isDesktopOpen && (
        <button
          onClick={() => setIsDesktopOpen(true)}
          className="fixed top-5 left-4 z-50 hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 text-white light:text-slate-900 hover:bg-slate-800 light:hover:bg-slate-100 transition-colors shadow-lg light:shadow-sm"
          aria-label="Open sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        bg-slate-950/80 light:bg-white/80 border-slate-800 light:border-slate-200 backdrop-blur-xl shadow-2xl light:shadow-sm flex-shrink-0 flex flex-col transition-all duration-300 z-40
        fixed inset-y-0 left-0 md:relative
        ${isOpen ? 'translate-x-0 w-64 border-r' : '-translate-x-full w-64 border-r'}
        ${isDesktopOpen ? 'md:translate-x-0 md:w-64 md:border-r' : 'md:-translate-x-full md:w-0 md:border-none md:overflow-hidden'}
      `}>
        {/* Logo + Close button on mobile + Collapse on desktop */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800 light:border-slate-200 shrink-0">
          <Logo />
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-slate-400 hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={() => setIsDesktopOpen(false)}
            className="hidden md:flex text-slate-400 hover:text-white transition-colors"
            aria-label="Collapse sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  active
                    ? 'bg-slate-800 light:bg-slate-100 text-white light:text-slate-900 shadow-md'
                    : 'text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 hover:bg-slate-800/50 light:hover:bg-slate-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout at bottom */}
        <div className="px-4 pb-6 pt-2 border-t border-slate-800 light:border-slate-200 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-app-red hover:bg-red-500/10 transition-all font-medium w-full cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
