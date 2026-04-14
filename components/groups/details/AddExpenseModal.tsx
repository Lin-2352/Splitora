"use client";
import React, { useState, useEffect, useRef } from "react";

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
  const [isScanning, setIsScanning] = useState(false);
  const [billId, setBillId] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ confidence?: number, timeMs?: number } | null>(null);
  const [scannedItems, setScannedItems] = useState<{ name: string; price: number; category?: string }[]>([]);
  const [showItems, setShowItems] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Initialize splits array when members change or modal opens
  useEffect(() => {
    if (isOpen) {
      setDescription("");
      setAmount("");
      setSplitType("equal");
      setError("");
      setScanResult(null);
      setBillId(null);
      setScannedItems([]);
      setShowItems(true);
      if (members?.length) {
        setSplits(members.map(m => ({ 
          userId: m.user?._id || m.user, 
          value: "" 
        })));
      }
    }
  }, [isOpen, members]);

  const handleSplitChange = (userId: string, val: string) => {
    setSplits(prev => prev.map(s => s.userId === userId ? { ...s, value: val } : s));
  };

  const handleOCRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError("");
    setScanResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/${groupId}/bill/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload and scan receipt");

      // Save bill ID for transaction linking
      if (data.bill && data.bill.id) {
         setBillId(data.bill.id);
      }

      const ocrResult = data.ocr;
      if (ocrResult) {
        setScanResult({
          confidence: ocrResult.confidence_score,
          timeMs: ocrResult.processing_time_ms
        });
        
        // Auto-fill form fields using the detailed data from Python OCR
        const extractedDesc = ocrResult.vendor || ocrResult.location || "";
        if (extractedDesc) setDescription(extractedDesc);
        
        const extractedAmt = ocrResult.total || ocrResult.subtotal || 0;
        if (extractedAmt > 0) setAmount(extractedAmt.toFixed(2));

        // Populate scanned items
        if (ocrResult.items && ocrResult.items.length > 0) {
          setScannedItems(ocrResult.items.map((it: any) => ({
            name: it.name || "Unknown Item",
            price: it.price || 0,
            category: it.category || undefined
          })));
          setShowItems(true);
        }
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsScanning(false);
      // Clear the input value so the same file can be selected again
      if (e.target) {
        e.target.value = '';
      }
    }
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

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      setLoading(false);
      return;
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
          billId,
          amount: numAmount,
          description,
          splitType,
          splits: payloadSplits
        })
      });

      const data = await res.json();
      if (!res.ok) {
        // Handle Zod validation errors or other objects properly
        let errorMsg = "Failed to create expense";
        if (typeof data.error === 'string') {
          errorMsg = data.error;
        } else if (data.error && typeof data.error === 'object') {
          // If it's a Zod error, it might have an issues array or just be a complex object
          errorMsg = data.error.message || JSON.stringify(data.error);
        }
        throw new Error(errorMsg);
      }
      
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
      <div className="relative bg-slate-900 light:bg-white border border-slate-700 light:border-slate-200 rounded-3xl shadow-2xl light:shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transform transition-all scale-in-center animate-in zoom-in-95 duration-200">
        
        {/* Top Edge Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00f2fe] via-[#4facfe] to-[#00f2fe] z-20"></div>

        {/* Header */}
        <div className="p-6 border-b border-slate-800/50 light:border-slate-200 bg-slate-900/50 light:bg-slate-50/50 flex justify-between items-center relative z-10 shrink-0">
          <div>
            <h3 className="text-xl font-black text-white light:text-slate-900 flex items-center gap-2 tracking-tight">
               <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f2fe] to-[#4facfe] shadow-[0_0_15px_rgba(0,242,254,0.4)]">
                 <span className="material-symbols-outlined text-white text-[18px]">receipt_long</span>
               </div>
               Add an Expense
            </h3>
            <p className="text-sm font-medium text-slate-400 light:text-slate-500 mt-1">Split a bill with the group.</p>
          </div>
          <button onClick={onClose} disabled={loading} className="size-8 rounded-full flex items-center justify-center bg-slate-800/50 light:bg-slate-100/50 hover:bg-slate-800 light:hover:bg-slate-200 transition-colors text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 shrink-0">
            <span className="material-symbols-outlined font-bold text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar relative z-10 flex-1 bg-slate-900/20 light:bg-transparent">
          {error && (
            <div className="mb-6 bg-app-red/10 border border-app-red/20 text-app-red p-3 rounded-xl text-sm flex items-start gap-2">
               <span className="material-symbols-outlined text-[18px]">error</span>
               <span>{error}</span>
            </div>
          )}
          
          {/* OCR Smart Autofill Section */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-sm font-bold text-slate-400 light:text-slate-500 flex items-center gap-2 tracking-wide uppercase">
                <span className="material-symbols-outlined text-[18px] text-app-purple">document_scanner</span>
                Smart Autofill
              </h4>
              {scanResult && !isScanning && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-fade-in">
                  <span className="material-symbols-outlined text-emerald-400 text-[14px]">check_circle</span>
                  <span className="text-[10px] font-bold text-emerald-400">
                    {Math.round((scanResult.confidence || 0) * 100)}% Match • {(scanResult.timeMs || 0) / 1000}s
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isScanning ? (
                <div className="col-span-full bg-slate-800/40 light:bg-slate-50 border border-slate-700/50 light:border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-inner">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-app-purple/20 border-t-app-purple animate-spin"></div>
                    <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-app-purple animate-pulse">quick_reference_all</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-app-purple animate-pulse">Scanning Receipt...</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-widest">AI is reading the details</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Upload Card */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative cursor-pointer overflow-hidden p-4 rounded-2xl bg-slate-800/40 light:bg-slate-50 border border-slate-700/50 light:border-slate-200 hover:border-app-cyan/50 hover:bg-slate-800 transition-all duration-300 shadow-sm active:scale-[0.98]"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-app-cyan/5 rounded-full blur-2xl group-hover:bg-app-cyan/10 transition-colors"></div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f2fe] to-[#4facfe] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(0,242,254,0.3)] group-hover:scale-110 group-hover:rotate-3 transition-transform">
                        <span className="material-symbols-outlined text-[22px]">upload_file</span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-200 light:text-slate-800 tracking-tight">Gallery</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Choose File</p>
                      </div>
                    </div>
                  </div>

                  {/* Scan Card (Mobile only) */}
                  <div 
                    onClick={() => cameraInputRef.current?.click()}
                    className="sm:hidden group relative cursor-pointer overflow-hidden p-4 rounded-2xl bg-slate-800/40 light:bg-slate-50 border border-slate-700/50 light:border-slate-200 hover:border-app-purple/50 hover:bg-slate-800 transition-all duration-300 shadow-sm active:scale-[0.98]"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-app-purple/5 rounded-full blur-2xl group-hover:bg-app-purple/10 transition-colors"></div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#b224ef] to-[#7579ff] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(178,36,239,0.3)] group-hover:scale-110 group-hover:rotate-3 transition-transform">
                        <span className="material-symbols-outlined text-[22px]">photo_camera</span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-200 light:text-slate-800 tracking-tight">Camera</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Scan Receipt</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Invisible Desktop Fallback / Spacer for grid alignment if needed */}
                  <div className="hidden sm:flex items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-800/50 light:border-slate-200 text-slate-600 opacity-40">
                    <span className="material-symbols-outlined text-[20px] mr-2">info</span>
                    <span className="text-[11px] font-bold uppercase tracking-widest">Mobile for Scan</span>
                  </div>
                </>
              )}
            </div>
            
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" ref={fileInputRef} onChange={handleOCRUpload} />
            <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleOCRUpload} />
          </div>

          {/* Scanned Items Breakdown */}
          {scannedItems.length > 0 && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between px-1 mb-2">
                <h4 className="text-sm font-bold text-slate-400 light:text-slate-500 flex items-center gap-2 tracking-wide uppercase">
                  <span className="material-symbols-outlined text-[18px] text-emerald-400">receipt_long</span>
                  Detected Items ({scannedItems.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setShowItems(!showItems)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 light:hover:text-slate-700 hover:bg-slate-800/50 light:hover:bg-slate-100 transition-all"
                >
                  <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${showItems ? 'rotate-180' : ''}`}>expand_more</span>
                  {showItems ? 'Hide' : 'Show'}
                </button>
              </div>

              {showItems && (
                <div className="bg-slate-800/30 light:bg-slate-50 border border-slate-700/40 light:border-slate-200 rounded-2xl overflow-hidden">
                  <div className="divide-y divide-slate-700/30 light:divide-slate-200/80">
                    {scannedItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 light:hover:bg-slate-100/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-700/50 light:bg-slate-200/80 text-[11px] font-black text-slate-400 light:text-slate-500 shrink-0">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-200 light:text-slate-800 truncate">{item.name}</p>
                            {item.category && item.category !== "Other" && (
                              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-app-purple/10 text-app-purple border border-app-purple/20">
                                {item.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-black text-emerald-400 light:text-emerald-600 tabular-nums shrink-0 ml-3">
                          ₹{item.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Items total footer */}
                  <div className="px-4 py-2.5 bg-slate-800/50 light:bg-slate-100/80 border-t border-slate-700/40 light:border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Items Total</span>
                    <span className="text-sm font-black text-white light:text-slate-900 tabular-nums">
                      ₹{scannedItems.reduce((sum, it) => sum + it.price, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <form id="expense-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-400 light:text-slate-500 mb-1">Description</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Dinner at Ramesh's" 
                className="w-full bg-slate-900/50 light:bg-slate-50 border border-slate-700/50 light:border-slate-200 rounded-xl px-4 py-3 text-white light:text-slate-900 focus:outline-none focus:border-app-cyan focus:ring-1 focus:ring-app-cyan transition-colors"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-400 light:text-slate-500 mb-1">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" 
                  className="w-full bg-slate-900/50 light:bg-slate-50 border border-slate-700/50 light:border-slate-200 rounded-xl pl-8 pr-4 py-3 text-white light:text-slate-900 focus:outline-none focus:border-app-cyan focus:ring-1 focus:ring-app-cyan transition-colors text-lg font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Split Algorithm</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'equal', icon: 'drag_handle', label: '=', color: 'from-blue-400 to-cyan-400', lightColor: 'from-blue-500 to-cyan-500' },
                  { id: 'exact', icon: 'currency_rupee', label: '₹', color: 'from-emerald-400 to-teal-400', lightColor: 'from-emerald-500 to-teal-500' },
                  { id: 'percentage', icon: 'percent', label: '%', color: 'from-purple-400 to-pink-400', lightColor: 'from-purple-500 to-pink-500' },
                  { id: 'shares', icon: 'pie_chart', label: 'Share', color: 'from-amber-400 to-orange-400', lightColor: 'from-amber-500 to-orange-500' }
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSplitType(type.id as any)}
                    className={`group flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                      splitType === type.id 
                        ? 'bg-gradient-to-br from-[#00f2fe]/10 to-[#4facfe]/10 light:from-white light:to-white border-app-cyan text-app-cyan shadow-[0_0_15px_rgba(0,242,254,0.15)] light:shadow-[0_4px_20px_rgba(0,198,255,0.25)]' 
                        : 'bg-slate-900/50 light:bg-white/60 border-slate-700/50 light:border-slate-200/80 hover:border-slate-600 light:hover:border-slate-300 light:hover:shadow-md'
                    }`}
                  >
                     {/* Hover gradient background for unselected state */}
                     {splitType !== type.id && (
                       <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br ${type.color} light:${type.lightColor}`}></div>
                     )}

                     {/* Permanently colored icon block */}
                     <div className={`flex items-center justify-center w-10 h-10 rounded-xl mb-1.5 transition-all duration-300 bg-gradient-to-br ${type.color} light:${type.lightColor} text-white shadow-md ${splitType === type.id ? 'shadow-lg scale-110' : 'group-hover:scale-105 group-hover:-translate-y-0.5'}`}>
                       <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 font-bold ${splitType === type.id ? 'drop-shadow-md' : 'group-hover:rotate-[8deg]'}`}>{type.icon}</span>
                     </div>
                     <span className={`text-[11px] font-black uppercase tracking-wider transition-colors duration-300 ${splitType === type.id ? 'text-app-cyan' : 'text-slate-500 light:text-slate-500 group-hover:text-slate-300 light:group-hover:text-slate-800'}`}>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Split Distribution Setup (only visible if not equal) */}
            {splitType !== "equal" && (
              <div className="bg-slate-900/30 light:bg-slate-100 border border-slate-700/50 light:border-slate-300/60 rounded-2xl p-5 space-y-4 shadow-inner light:shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] transition-all">
                 <h4 className="text-xs font-black text-slate-500 light:text-slate-400 mb-2 uppercase tracking-widest px-1">Configure Splits</h4>
                 {members.map(member => {
                   const userName = member.user?.userName || member.user?.name || member.user?.email || 'Unknown';
                   const userId = member.user?._id || member.user;
                   const splitObj = splits.find(s => s.userId === userId);
                   
                   return (
                     <div key={userId} className="flex items-center justify-between gap-4 px-1">
                       <div className="flex items-center gap-3 truncate">
                         <img src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${userName}`} className="w-7 h-7 rounded-full bg-slate-800 light:bg-slate-200 border border-slate-700 light:border-slate-300" />
                         <span className="text-sm font-bold text-slate-300 light:text-slate-700 truncate">{userName}</span>
                       </div>
                       <div className="w-32 relative shrink-0">
                         {splitType === 'exact' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 light:text-slate-400 text-sm font-bold">₹</span>}
                         <input 
                           type="number"
                           step="0.01"
                           min="0"
                           value={splitObj?.value || ""}
                           onChange={(e) => handleSplitChange(userId, e.target.value)}
                           className={`w-full bg-slate-900 light:bg-white border border-slate-700 light:border-slate-200 shadow-inner light:shadow-[0_2px_4px_rgba(0,0,0,0.02)] rounded-xl py-2.5 text-white light:text-slate-900 placeholder:text-slate-600 light:placeholder:text-slate-300 focus:outline-none focus:border-app-cyan focus:ring-2 focus:ring-app-cyan/20 text-sm text-right font-bold transition-all hover:border-slate-600 light:hover:border-slate-300 ${splitType === 'exact' ? 'pl-8 pr-3' : splitType === 'percentage' ? 'pr-8 pl-3' : 'px-3'}`}
                         />
                         {splitType === 'percentage' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 light:text-slate-400 text-sm font-bold">%</span>}
                       </div>
                     </div>
                   );
                 })}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700/50 light:border-slate-200 bg-slate-900/50 light:bg-slate-50/50 flex justify-end gap-3 shrink-0 relative z-10">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-700 light:border-slate-300 text-slate-300 light:text-slate-700 font-bold hover:bg-slate-800 light:hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="expense-form"
            disabled={loading}
            className="px-8 py-2.5 rounded-xl bg-gradient-to-b from-[#00f2fe] to-[#4facfe] hover:brightness-110 text-slate-900 font-bold transition-all shadow-[0_0_15px_rgba(0,242,254,0.4)] disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-slate-900"></span> : 'Save Expense'}
          </button>
        </div>
      </div>
    </div>
  );
}
