"use client";
import React, { useEffect, useState } from 'react';

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
    <header className="h-20 bg-app-card/80 backdrop-blur-md border-b border-app-border flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-10">
      {/* Left spacer for hamburger on mobile */}
      <div className="w-10 md:hidden" />
      
      {/* Logo text on mobile */}
      <div className="flex items-center gap-2 md:hidden">
        <img src="/logo.png" alt="Splitora" className="w-8 h-8 object-contain" />
        <span className="text-lg font-bold text-white">Splitora<span className="text-app-cyan">!</span></span>
      </div>

      {/* Spacer on desktop */}
      <div className="hidden md:block" />
      
      {/* Right — User Profile */}
      <div className="flex items-center gap-3">
        <img 
          alt={`${userName} Avatar`} 
          src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${userName}`}
          className="w-10 h-10 rounded-full border border-app-border object-cover bg-app-card" 
        />
        <div className="hidden md:flex flex-col items-start">
          <span className="text-sm font-semibold text-white">{userName}</span>
          <span className="text-xs text-slate-500">Member</span>
        </div>
      </div>
    </header>
  );
}
