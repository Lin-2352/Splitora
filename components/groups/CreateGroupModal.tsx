"use client"
import React, { useState } from 'react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/createGroup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ groupName })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create group');
      }

      setGroupName('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="relative bg-slate-900 light:bg-white border border-slate-700 light:border-slate-200 shadow-2xl light:shadow-xl w-full max-w-md rounded-3xl overflow-hidden transform transition-all scale-in-center animate-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-0 right-0 h-1 blur-sm bg-[#00f2fe] light:bg-[#7e22ce]"></div>
        
        <div className="p-6 border-b border-slate-800 light:border-slate-200 bg-slate-900/50 light:bg-slate-50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white light:text-slate-900 tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00f2fe] light:text-[#7e22ce]">add_circle</span>
            Create New Group
          </h3>
          <button onClick={onClose} className="text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-400 light:text-slate-500 mb-2">Group Name</label>
            <input 
              type="text" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-slate-900/50 light:bg-slate-50 border border-slate-700 light:border-slate-300 rounded-xl px-4 py-3 text-white light:text-slate-900 placeholder:text-slate-500 light:placeholder:text-slate-400 focus:outline-none focus:border-[#7e22ce] focus:ring-1 focus:ring-[#7e22ce] transition-colors"
              placeholder="e.g. Weekend Trip, Roommates"
              disabled={loading}
              autoFocus
            />
          </div>
          
          {error && <p className="text-app-red text-sm mb-4">{error}</p>}

          <div className="flex gap-3 justify-end mt-8">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-700 light:border-slate-300 text-slate-300 light:text-slate-600 hover:bg-slate-800 light:hover:bg-slate-100 transition-colors font-bold text-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 text-white light:text-slate-900 border border-slate-700 light:border-slate-300 shadow-xl light:shadow-sm transition-all hover:-translate-y-1 font-bold text-sm min-w-[120px]"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
