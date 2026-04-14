"use client";
import React, { useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

export default function Topbar() {
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.userName) {
          setUserName(payload.userName);
        }
      }
    } catch (e) {
      console.error("Failed to parse token", e);
    }
  }, []);

  return (
    <header className="h-20 bg-slate-950/80 light:bg-white/80 backdrop-blur-xl border-b border-slate-800 light:border-slate-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-10 shadow-sm">
      {/* Left spacer for hamburger on mobile */}
      <div className="w-10 md:hidden" />
      
      {/* Logo on mobile */}
      <Logo className="md:hidden" />

      {/* Spacer on desktop */}
      <div className="hidden md:block" />
      
      {/* Right — User Profile & Theme */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="flex flex-row items-center gap-3">
          <img 
            alt={`${userName} Avatar`} 
            src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${userName}`}
            className="w-10 h-10 rounded-full border border-slate-800 light:border-slate-200 object-cover bg-slate-900 light:bg-slate-100 shadow-md" 
          />
          <div className="hidden md:flex items-center">
            <span className="text-sm font-semibold text-white light:text-slate-900">{userName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
