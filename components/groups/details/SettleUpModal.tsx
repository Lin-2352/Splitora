"use client";
import React, { useState, useEffect } from "react";

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  members: any[];
  onSuccess: () => void;
  currentUserId: string;
  defaultRecipientId?: string;
  defaultAmount?: string;
}

export default function SettleUpModal({ isOpen, onClose, groupId, members, onSuccess, currentUserId, defaultRecipientId = "", defaultAmount = "" }: SettleUpModalProps) {
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Only show members that are not the current user
  const eligibleRecipients = members.filter(m => (m.user?._id || m.user) !== currentUserId);

  useEffect(() => {
    if (isOpen) {
      setRecipientId(defaultRecipientId || "");
      setAmount(defaultAmount || "");
      setError("");
    }
  }, [isOpen, defaultRecipientId, defaultAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId || !amount) {
      setError("Recipient and amount are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem('token');
      const payloadAmount = parseFloat(amount);

      const res = await fetch(`/api/${groupId}/createSettlement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          toUser: recipientId,
          amount: payloadAmount
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record settlement");
      
      onSuccess();
      onClose();
    } catch (err: any) {
       setError(err.message);
    } finally {
       setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="relative bg-slate-900 light:bg-white border border-slate-700 light:border-slate-200 rounded-3xl shadow-2xl light:shadow-xl w-full max-w-sm flex flex-col transform transition-all scale-in-center animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Top Edge Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#b224ef] via-[#7579ff] to-[#b224ef] z-20"></div>

        {/* Header */}
        <div className="p-6 border-b border-slate-800/50 light:border-slate-200 bg-slate-900/50 light:bg-slate-50/50 flex justify-between items-center relative z-10">
          <div>
            <h3 className="text-xl font-black text-white light:text-slate-900 flex items-center gap-2 tracking-tight">
               <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#b224ef] to-[#7579ff] shadow-[0_0_15px_rgba(178,36,239,0.4)]">
                 <span className="material-symbols-outlined text-white text-[18px]">payments</span>
               </div>
               Settle Up
            </h3>
            <p className="text-sm font-medium text-slate-400 light:text-slate-500 mt-1">Record a cash payment.</p>
          </div>
          <button onClick={onClose} disabled={loading} className="size-8 rounded-full flex items-center justify-center bg-slate-800/50 light:bg-slate-100/50 hover:bg-slate-800 light:hover:bg-slate-200 transition-colors text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 shrink-0">
            <span className="material-symbols-outlined font-bold text-[20px]">close</span>
          </button>
        </div>

        <form id="settle-form" onSubmit={handleSubmit} className="p-6 space-y-6 relative z-10 bg-slate-900/20 light:bg-transparent">
           {error && (
            <div className="bg-app-red/10 border border-app-red/20 text-app-red p-3 rounded-xl text-sm flex items-start gap-2">
               <span className="material-symbols-outlined text-[18px]">error</span>
               <span>{error}</span>
            </div>
           )}

           <div className="relative z-10 w-full">
              <label className="block text-sm font-bold text-slate-400 light:text-slate-500 mb-2">Who are you paying?</label>
              <select 
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                required
                className="w-full bg-slate-900/50 light:bg-white border border-slate-700/50 light:border-slate-200 shadow-inner light:shadow-[0_2px_4px_rgba(0,0,0,0.02)] rounded-xl px-4 py-3 text-white light:text-slate-900 focus:outline-none focus:border-app-purple focus:ring-2 focus:ring-app-purple/20 appearance-none font-bold transition-all hover:border-slate-600 light:hover:border-slate-300"
              >
                <option value="" disabled className="text-slate-500">Select a member</option>
                {eligibleRecipients.map(member => {
                   const userName = member.user?.userName || member.user?.name || member.user?.email || 'Unknown';
                   const userId = member.user?._id || member.user;
                   return (
                     <option key={userId} value={userId} className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">{userName}</option>
                   );
                })}
              </select>
           </div>

           <div className="relative z-10 w-full">
             <label className="block text-sm font-bold text-slate-400 light:text-slate-500 mb-2">Amount (₹)</label>
             <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 light:text-slate-400 font-bold">₹</span>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" 
                  className="w-full bg-slate-900/50 light:bg-white border border-slate-700/50 light:border-slate-200 shadow-inner light:shadow-[0_2px_4px_rgba(0,0,0,0.02)] rounded-xl pl-8 pr-4 py-3 text-app-purple focus:outline-none focus:border-app-purple focus:ring-2 focus:ring-app-purple/20 transition-all hover:border-slate-600 light:hover:border-slate-300 text-2xl font-black"
                  required
                />
              </div>
           </div>

             <div className="pt-4 flex gap-3 relative z-10">
               <button 
                 type="button" 
                 onClick={onClose}
                 className="flex-1 py-3 rounded-xl border border-slate-700 light:border-slate-300 text-slate-300 light:text-slate-700 font-bold hover:bg-slate-800 light:hover:bg-slate-100 transition-colors"
               >
                 Cancel
               </button>
               <button 
                 type="submit" 
                 disabled={loading}
                 className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#b224ef] to-[#7579ff] hover:opacity-90 text-white font-bold transition-all shadow-[0_0_15px_rgba(178,36,239,0.4)] flex justify-center items-center gap-2 disabled:opacity-50"
               >
               {loading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></span> : 'Settle Now'}
             </button>
           </div>
        </form>

      </div>
    </div>
  );
}
