"use client"
import React, { useState } from 'react';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function JoinGroupModal({ isOpen, onClose, onSuccess }: JoinGroupModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!inviteCode.trim() || inviteCode.length !== 8) {
      setError('Please enter a valid 8-character invite code');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inviteCode: inviteCode.toUpperCase() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join group');
      }

      setInviteCode('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-app-card w-full max-w-md rounded-2xl shadow-2xl border border-app-border overflow-hidden">
        
        <div className="p-6 border-b border-app-border flex justify-between items-center bg-gradient-to-r from-app-card to-slate-900">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-app-cyan">group_add</span>
            Join Group
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-400 mb-2">Invite Code</label>
            <input 
              type="text" 
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-app-cyan focus:ring-1 focus:ring-app-cyan transition-colors tracking-widest font-mono text-center uppercase"
              placeholder="XXXXXXXX"
              maxLength={8}
              disabled={loading}
              autoFocus
            />
          </div>
          
          {error && <p className="text-app-red text-sm mb-4 text-center">{error}</p>}

          <div className="flex gap-3 justify-end mt-8">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-app-cyan text-slate-900 font-bold hover:bg-app-cyan/90 transition-colors min-w-[120px]"
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
