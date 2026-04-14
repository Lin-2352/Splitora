"use client"
import React, { useState, useEffect } from 'react';

interface GroupManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  role: 'groupLeader' | 'member';
}

export default function GroupManagementModal({ isOpen, onClose, groupId, groupName, role }: GroupManagementModalProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const isLeader = role === 'groupLeader';

  useEffect(() => {
    if (isOpen && groupId) {
      fetchGroupDetails();
    }
  }, [isOpen, groupId]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/getSingleGroup/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch group details');
      
      setMembers(data.group?.members || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm(`Are you sure you want to delete the group "${groupName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/deleteGroup/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete group');

      // Refresh the page or close modal & trigger parent refresh
      window.location.reload(); 
    } catch (err: any) {
      setError(err.message);
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this group?`)) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/removeMembers`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          groupId,
          memberIds: [memberId]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove member');

      await fetchGroupDetails(); // refresh members list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-app-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-app-border">
        
        {/* Header */}
        <div className="p-6 border-b border-app-border flex justify-between items-center bg-gradient-to-r from-app-card to-slate-900">
          <div>
            <h3 className="text-xl font-bold text-white">Group Management</h3>
            <p className="text-sm text-app-purple font-medium">{groupName} • {isLeader ? 'Leader View' : 'Member View'}</p>
          </div>
          <button 
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
            disabled={actionLoading}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Member List */}
        <div className="max-h-96 overflow-y-auto scrollbar-thin p-6 space-y-4">
          
          {error && (
             <div className="bg-app-red/10 border border-app-red/20 text-app-red p-3 rounded-xl text-sm mb-4">
               {error}
             </div>
          )}

          {loading ? (
             <div className="flex justify-center p-8">
               <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-app-purple"></div>
             </div>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Members ({members.length})</p>
              
              {members.map((member: any) => {
                const isMemberLeader = member.role === 'groupLeader';
                
                return (
                  <div key={member._id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <img 
                        src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${member.user?.userName || member.user?.name || member.user?.email || 'Unknown User'}`}
                        alt="Avatar"
                        className={`size-10 rounded-full object-cover border-2 ${isMemberLeader ? 'border-app-purple' : 'border-slate-700 bg-slate-800'}`}
                      />
                      <div>
                        {/* Assuming the backend populates member.user with the user object containing 'name' or 'userName' */}
                        <p className="text-sm font-bold text-white">
                           {member.user?.userName || member.user?.name || member.user?.email || 'Unknown User'}
                        </p>
                        <p className="text-xs text-slate-400">{isMemberLeader ? 'Group Leader' : 'Member'}</p>
                      </div>
                    </div>
                    
                    {isMemberLeader ? (
                      <span className="text-xs font-bold text-app-purple">OWNER</span>
                    ) : (
                      isLeader && (
                        <button 
                          disabled={actionLoading}
                          onClick={() => handleRemoveMember(member.user?._id || member.user, member.user?.userName || 'User')}
                          className="text-slate-500 hover:text-app-red transition-colors disabled:opacity-50" 
                          title="Remove Member"
                        >
                          <span className="material-symbols-outlined">person_remove</span>
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-app-border bg-[#161925]/50 flex justify-center">
          {isLeader ? (
            <button 
              onClick={handleDeleteGroup}
              disabled={actionLoading || loading}
              className="w-full py-3 rounded-xl border border-app-red/50 text-app-red font-bold hover:bg-app-red hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined">delete_forever</span>
              {actionLoading ? 'Deleting...' : 'Delete Group'}
            </button>
          ) : (
             <button 
               className="w-full py-3 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-app-red hover:text-white hover:border-app-red transition-all flex items-center justify-center gap-2 disabled:opacity-50"
             >
               <span className="material-symbols-outlined">logout</span>
               Leave Group
             </button> 
          )}
        </div>

      </div>
    </div>
  );
}
