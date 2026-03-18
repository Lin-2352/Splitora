"use client";
import React, { useState, useEffect } from "react";

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  members: any[];
  onSuccess: () => void;
  currentUserId: string;
}

export default function SettleUpModal({ isOpen, onClose, groupId, members, onSuccess, currentUserId }: SettleUpModalProps) {
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Only show members that are not the current user
  const eligibleRecipients = members.filter(m => (m.user?._id || m.user) !== currentUserId);

  useEffect(() => {
    if (isOpen) {
      setRecipientId("");
      setAmount("");
      setError("");
    }
  }, [isOpen]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-app-card w-full max-w-sm rounded-2xl shadow-2xl border border-app-border flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-app-border flex justify-between items-center bg-slate-900">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
               <span className="material-symbols-outlined text-app-purple">payments</span>
               Settle Up
            </h3>
            <p className="text-sm text-slate-400 mt-1">Record a cash payment.</p>
          </div>
          <button onClick={onClose} disabled={loading} className="size-8 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors text-slate-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form id="settle-form" onSubmit={handleSubmit} className="p-6 space-y-5">
           {error && (
            <div className="bg-app-red/10 border border-app-red/20 text-app-red p-3 rounded-xl text-sm flex items-start gap-2">
               <span className="material-symbols-outlined text-[18px]">error</span>
               <span>{error}</span>
            </div>
           )}

           <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Who are you paying?</label>
              <select 
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-app-purple focus:ring-1 focus:ring-app-purple appearance-none"
              >
                <option value="" disabled>Select a member</option>
                {eligibleRecipients.map(member => {
                   const userName = member.user?.userName || member.user?.name || member.user?.email || 'Unknown';
                   const userId = member.user?._id || member.user;
                   return (
                     <option key={userId} value={userId}>{userName}</option>
                   );
                })}
              </select>
           </div>

           <div>
             <label className="block text-sm font-medium text-slate-400 mb-2">Amount (₹)</label>
             <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-app-purple focus:outline-none focus:border-app-purple focus:ring-1 focus:ring-app-purple transition-colors text-2xl font-bold"
                  required
                />
              </div>
           </div>

           <div className="pt-4 flex gap-3">
             <button 
               type="button" 
               onClick={onClose}
               className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors"
             >
               Cancel
             </button>
             <button 
               type="submit" 
               disabled={loading}
               className="flex-1 py-3 rounded-xl bg-app-purple hover:bg-[#c43add] text-white font-bold transition-all shadow-glow-purple flex justify-center items-center gap-2 disabled:opacity-50"
             >
               {loading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></span> : 'Settle Now'}
             </button>
           </div>
        </form>

      </div>
    </div>
  );
}
