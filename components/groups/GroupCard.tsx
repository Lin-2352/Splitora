"use client";
import React, { useState } from 'react';
import Link from 'next/link';

interface GroupCardProps {
  id: string;
  name: string;
  role: 'groupLeader' | 'member';
  memberCount: number;
  inviteCode: string;
  onRefresh?: () => void;
}

export default function GroupCard({ id, name, role, memberCount, inviteCode, onRefresh }: GroupCardProps) {
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const isLeader = role === 'groupLeader';
  
  // Tailwind won't purge these since they are full class names
  const roleStyles = isLeader 
    ? { text: 'text-app-purple', bg: 'bg-app-purple/20', border: 'border-app-purple/30', hoverBorder: 'hover:border-app-purple', hoverShadow: 'hover:shadow-glow-purple', iconBg: 'bg-app-purple/10', icon: 'flight_takeoff', label: 'Leader' }
    : { text: 'text-app-cyan', bg: 'bg-app-cyan/20', border: 'border-app-cyan/30', hoverBorder: 'hover:border-app-cyan', hoverShadow: 'hover:shadow-glow-cyan', iconBg: 'bg-app-cyan/10', icon: 'home', label: 'Member' };

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmAction = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      
      const endpoint = isLeader ? `/api/deleteGroup/${id}` : `/api/leaveGroup/${id}`;
      
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || `Failed to ${isLeader ? 'delete' : 'leave'} group`);
      
      setShowModal(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      setActionLoading(false);
      setShowModal(false);
    }
  };

  const openModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(true);
  };

  const closeModal = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowModal(false);
  };

  return (
    <>
    <Link href={`/dashboard/groups/${id}`} className={`block h-[260px] group ${actionLoading ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className={`bg-slate-900/80 light:bg-white backdrop-blur-xl border border-slate-800 light:border-slate-200 shadow-xl light:shadow-sm rounded-3xl p-6 relative cursor-pointer transition-all hover:-translate-y-2 hover:shadow-2xl light:hover:shadow-lg ${roleStyles.hoverBorder} h-full flex flex-col`}>
        {/* Action Button (Permanent Right Corner) */}
        {isLeader ? (
          <button 
            onClick={openModal}
            className="absolute top-5 right-5 text-[#ff3366] transition-all z-20 bg-app-red/10 px-2 py-1.5 rounded-lg flex items-center justify-center border border-app-red/30 shadow-[0_0_15px_rgba(255,51,102,0.3)] hover:bg-app-red/20 hover:shadow-[0_0_25px_rgba(255,51,102,0.5)] hover:scale-105"
            title="Delete Group"
          >
            <span className="material-symbols-outlined text-[16px] font-bold text-[#ff3366]">delete</span>
          </button>
        ) : (
          <button 
            onClick={openModal}
            className="absolute top-5 right-5 text-orange-500 hover:text-orange-400 transition-colors z-20 bg-orange-500/10 hover:bg-orange-500/20 px-2 py-1.5 rounded-lg flex items-center justify-center border border-orange-500/20"
            title="Leave Group"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
          </button>
        )}

        {/* Role Badge (Replaces the Avatar Top-Left) */}
        <div className={`self-start ${roleStyles.bg} ${roleStyles.text} text-xs font-bold uppercase px-3 py-1.5 rounded-lg border ${roleStyles.border} mb-6`}>
          {roleStyles.label}
        </div>

        <h3 className="text-xl font-bold mb-1 text-white light:text-slate-900 tracking-tight truncate pr-10">{name}</h3>

        {/* Members Preview */}
        <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-sm font-medium mb-6">
          <span className="material-symbols-outlined text-[16px]">group</span>
          <span>{memberCount} Members</span>
        </div>

        {/* Invite Code */}
        <div className="mt-auto pt-4 relative">
          <div className="flex items-center justify-between bg-slate-800/50 light:bg-slate-100/80 rounded-lg px-3 py-2 border border-slate-700/50 light:border-slate-300 transition-colors" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <code className="text-xs font-mono text-slate-300 light:text-slate-700 select-all">{inviteCode}</code>
            <button 
              className="text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 transition-colors flex items-center"
              onClick={handleCopy}
              title="Copy code"
            >
              <span className="material-symbols-outlined text-[18px]">
                {copied ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
          
          {/* Toast Notification */}
          {copied && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-app-purple text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-glow-purple pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200 z-50 border border-[#c43add]">
              Copied!
            </div>
          )}
        </div>
      </div>
    </Link>
    
    {/* Custom Premium Modal Overlay */}
    {showModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <div 
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          onClick={closeModal}
        />
        
        {/* Modal Content */}
        <div 
          className="relative bg-slate-900 light:bg-white border border-slate-700 light:border-slate-200 rounded-3xl shadow-2xl light:shadow-xl w-full max-w-sm p-6 transform transition-all scale-in-center animate-in zoom-in-95 duration-200 overflow-hidden"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          {/* Top Edge Glow */}
          <div className={`absolute top-0 left-0 right-0 h-1 blur-sm ${isLeader ? 'bg-app-red' : 'bg-orange-500'}`}></div>

          <div className="flex flex-col items-center text-center mt-2">
            <div className={`size-14 rounded-full flex items-center justify-center mb-4 ${isLeader ? 'bg-app-red/10 text-app-red' : 'bg-orange-500/10 text-orange-500'}`}>
               <span className="material-symbols-outlined text-[28px]">{isLeader ? 'delete_forever' : 'logout'}</span>
            </div>
            <h3 className="text-xl font-bold text-white light:text-slate-900 tracking-tight mb-2">
              {isLeader ? 'Delete Group?' : 'Leave Group?'}
            </h3>
            <p className="text-slate-400 light:text-slate-500 text-sm mb-8">
              {isLeader 
                ? `Are you absolutely sure you want to permanently delete "${name}"? All expenses, balances, and history will be wiped.` 
                : `Are you sure you want to leave "${name}"? You will need an invite code to rejoin.`}
            </p>

            <div className="flex gap-3 w-full">
              <button 
                onClick={closeModal}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-slate-800 light:bg-slate-100 hover:bg-slate-700 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all ${isLeader ? 'bg-app-red hover:bg-red-600 shadow-app-red/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'} ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {actionLoading ? 'Processing...' : (isLeader ? 'Delete' : 'Leave')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
