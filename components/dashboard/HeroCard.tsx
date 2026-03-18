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
    <div className="relative rounded-2xl px-8 py-6 overflow-hidden bg-[#12131e] border border-app-border shadow-lg">
      {/* Abstract background art */}
      {/* Large blurred orbs */}
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#a82ee2] rounded-full mix-blend-screen filter blur-[120px] opacity-20"></div>
      <div className="absolute -bottom-20 -left-10 w-56 h-56 bg-[#00f2fe] rounded-full mix-blend-screen filter blur-[100px] opacity-15"></div>
      <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-[#c43add] rounded-full mix-blend-screen filter blur-[80px] opacity-10"></div>
      
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
        <path d="M0,60 Q50,10 100,40 T200,20" fill="none" stroke="#00f2fe" strokeWidth="1.5" />
        <path d="M0,70 Q60,30 120,50 T200,40" fill="none" stroke="#a82ee2" strokeWidth="1.5" />
        <path d="M20,80 Q70,20 140,55 T200,30" fill="none" stroke="#00f2fe" strokeWidth="1" opacity="0.5" />
      </svg>

      {/* Content */}
      <div className="relative z-10">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 font-medium">Dashboard</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Welcome back, <span className="bg-gradient-to-r from-[#00f2fe] to-[#a82ee2] bg-clip-text text-transparent">{userName}</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1.5 max-w-md">Here's what's happening across your groups today.</p>
      </div>
    </div>
  );
}
