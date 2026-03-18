"use client";
import React, { useState, useEffect } from "react";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  members: any[];
  onSuccess: () => void;
}

export default function AddExpenseModal({ isOpen, onClose, groupId, members, onSuccess }: AddExpenseModalProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [splitType, setSplitType] = useState<"equal" | "exact" | "percentage" | "shares">("equal");
  
  // Array to hold individual split values per member
  const [splits, setSplits] = useState<{ userId: string; value: string }[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize splits array when members change or modal opens
  useEffect(() => {
    if (isOpen && members?.length) {
      setSplits(members.map(m => ({ 
        userId: m.user?._id || m.user, 
        value: "" 
      })));
      setDescription("");
      setAmount("");
      setSplitType("equal");
      setError("");
    }
  }, [isOpen, members]);

  const handleSplitChange = (userId: string, val: string) => {
    setSplits(prev => prev.map(s => s.userId === userId ? { ...s, value: val } : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) {
      setError("Description and amount are required.");
      return;
    }
    
    setError("");
    setLoading(true);

    // Prepare payload based on the selected split type
    let payloadSplits: any[] = [];
    
    if (splitType === "equal") {
       payloadSplits = members.map(m => ({ user: m.user?._id || m.user }));
    } else {
       // Validate exact, percentage, shares
       let total = 0;
       for (const split of splits) {
         const valNum = parseFloat(split.value) || 0;
         total += valNum;
         
         const payloadItem: any = { user: split.userId };
         if (splitType === "exact") payloadItem.amount = valNum;
         if (splitType === "percentage") payloadItem.percentage = valNum;
         if (splitType === "shares") payloadItem.shares = valNum;
         
         payloadSplits.push(payloadItem);
       }
       
       if (splitType === "exact" && Math.abs(total - parseFloat(amount)) > 0.01) {
          setError(`Exact split amounts must equal the total (₹${parseFloat(amount).toFixed(2)}). Currently: ₹${total.toFixed(2)}`);
          setLoading(false);
          return;
       }
       if (splitType === "percentage" && Math.abs(total - 100) > 0.01) {
          setError(`Percentage splits must equal 100%. Currently: ${total}%`);
          setLoading(false);
          return;
       }
       if (splitType === "shares" && total === 0) {
          setError("Total shares must be greater than 0.");
          setLoading(false);
          return;
       }
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/${groupId}/createTransactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description,
          splitType,
          splits: payloadSplits
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create expense");
      
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
      <div className="bg-app-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-app-border flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-app-border flex justify-between items-center bg-gradient-to-r from-app-card to-slate-900 shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
               <span className="material-symbols-outlined text-app-cyan">receipt_long</span>
               Add an Expense
            </h3>
            <p className="text-sm text-slate-400 mt-1">Split a bill with the group.</p>
          </div>
          <button onClick={onClose} disabled={loading} className="size-8 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors text-slate-400 hover:text-white shrink-0">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {error && (
            <div className="mb-6 bg-app-red/10 border border-app-red/20 text-app-red p-3 rounded-xl text-sm flex items-start gap-2">
               <span className="material-symbols-outlined text-[18px]">error</span>
               <span>{error}</span>
            </div>
          )}
          
          <form id="add-expense-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Dinner at Luigi's" 
                className="w-full bg-slate-900/50 border border-app-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-app-cyan focus:ring-1 focus:ring-app-cyan transition-colors"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" 
                  className="w-full bg-slate-900/50 border border-app-border rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-app-cyan focus:ring-1 focus:ring-app-cyan transition-colors text-lg font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Split Algorithm</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'equal', icon: 'drag_handle', label: '=' },
                  { id: 'exact', icon: 'currency_rupee', label: '₹' },
                  { id: 'percentage', icon: 'percent', label: '%' },
                  { id: 'shares', icon: 'pie_chart', label: 'Share' }
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSplitType(type.id as any)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border ${splitType === type.id ? 'bg-app-cyan/10 border-app-cyan text-app-cyan shadow-glow-cyan' : 'bg-slate-900/50 border-app-border text-slate-400 hover:border-slate-600'} transition-all`}
                  >
                     <span className="material-symbols-outlined text-[20px] mb-1">{type.icon}</span>
                     <span className="text-[10px] font-bold uppercase">{type.id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Split Distribution Setup (only visible if not equal) */}
            {splitType !== "equal" && (
              <div className="bg-slate-900/30 border border-app-border rounded-xl p-4 space-y-3">
                 <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Configure Splits</h4>
                 {members.map(member => {
                   const userName = member.user?.userName || member.user?.name || member.user?.email || 'Unknown';
                   const userId = member.user?._id || member.user;
                   const splitObj = splits.find(s => s.userId === userId);
                   
                   return (
                     <div key={userId} className="flex items-center justify-between gap-4">
                       <div className="flex items-center gap-2 truncate">
                         <img src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${userName}`} className="w-6 h-6 rounded-full bg-slate-800" />
                         <span className="text-sm font-medium text-slate-300 truncate">{userName}</span>
                       </div>
                       <div className="w-24 relative shrink-0">
                         {splitType === 'exact' && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₹</span>}
                         <input 
                           type="number"
                           step="0.01"
                           min="0"
                           value={splitObj?.value || ""}
                           onChange={(e) => handleSplitChange(userId, e.target.value)}
                           className={`w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 focus:outline-none focus:border-app-cyan text-sm text-right ${splitType === 'exact' ? 'pl-5 pr-2' : splitType === 'percentage' ? 'pr-5 pl-2' : 'px-2'}`}
                         />
                         {splitType === 'percentage' && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>}
                       </div>
                     </div>
                   );
                 })}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-app-border bg-[#161925]/50 flex justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="add-expense-form"
            disabled={loading}
            className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-app-cyan to-[#00d2dd] hover:opacity-90 text-slate-900 font-bold transition-all shadow-glow-cyan disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-slate-900"></span> : 'Save Expense'}
          </button>
        </div>
      </div>
    </div>
  );
}
