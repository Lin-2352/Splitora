"use client";
import React, { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (document.documentElement.classList.contains('light')) {
      setIsLight(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isLight) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
      setIsLight(false);
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
      setIsLight(true);
    }
  };

  // Prevent hydration mismatch fallback
  if (!mounted) return <div className="w-8 h-8 rounded-full"></div>;

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-900/80 light:bg-slate-100 border border-slate-800 light:border-slate-200 hover:bg-slate-800 light:hover:bg-slate-200 transition-all shadow-sm text-slate-300 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:shadow-lg cursor-pointer"
      aria-label="Toggle Theme"
    >
      <span className="material-symbols-outlined text-[18px]">
        {isLight ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  );
}
