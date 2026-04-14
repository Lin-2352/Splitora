"use client";
import React, { useEffect, useState } from 'react';

export default function HeroCard() {
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
    <div className="relative rounded-3xl px-8 py-6 overflow-hidden bg-slate-900/80 light:bg-white backdrop-blur-xl border border-slate-800 light:border-slate-200 shadow-xl light:shadow-sm hover:-translate-y-1 hover:shadow-2xl light:hover:shadow-lg transition-all duration-300">
      {/* Abstract background art */}
      {/* Large blurred orbs */}
      <div 
        className="absolute -top-20 -right-20 w-72 h-72 bg-app-purple rounded-full filter blur-[120px]"
        style={{ mixBlendMode: 'var(--glow-blend)' as any, opacity: 'var(--glow-opacity-strong)' }}
      ></div>
      <div 
        className="absolute -bottom-20 -left-10 w-56 h-56 bg-app-cyan rounded-full filter blur-[100px]"
        style={{ mixBlendMode: 'var(--glow-blend)' as any, opacity: 'var(--glow-opacity-strong)' }}
      ></div>
      <div 
        className="absolute top-1/2 right-1/4 w-32 h-32 bg-app-purple rounded-full filter blur-[80px]"
        style={{ mixBlendMode: 'var(--glow-blend)' as any, opacity: 'var(--glow-opacity)' }}
      ></div>
      
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      ></div>

      {/* Floating accent lines */}
      <svg className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10 hidden sm:block" width="200" height="80" viewBox="0 0 200 80">
        <path d="M0,60 Q50,10 100,40 T200,20" fill="none" stroke="var(--color-app-cyan)" strokeWidth="1.5" />
        <path d="M0,70 Q60,30 120,50 T200,40" fill="none" stroke="var(--color-app-purple)" strokeWidth="1.5" />
        <path d="M20,80 Q70,20 140,55 T200,30" fill="none" stroke="var(--color-app-cyan)" strokeWidth="1" opacity="0.5" />
      </svg>

      {/* Content */}
      <div className="relative z-10">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 font-medium">Dashboard</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white light:text-slate-900 tracking-tight">
          Welcome back, <span className="text-[#00f2fe] light:text-[#7e22ce]">{userName}</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1.5 max-w-md">Here's what's happening across your groups today.</p>
      </div>
    </div>
  );
}
