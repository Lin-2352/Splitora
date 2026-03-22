"use client"
import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';

import GroupHeader from '@/components/groups/details/GroupHeader';
import MembersCard from '@/components/groups/details/MembersCard';
import BalancesCard from '@/components/groups/details/BalancesCard';
import ActivityFeedCard from '@/components/groups/details/ActivityFeedCard';
import AddExpenseModal from '@/components/groups/details/AddExpenseModal';
import SettleUpModal from '@/components/groups/details/SettleUpModal';
import SpendingChart from '@/components/dashboard/SpendingChart';

export default function GroupDetailsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  
  // Random hash to trigger re-renders of the child feed widgets
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId);
      }

      const res = await fetch(`/api/getSingleGroup/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch group details');
      
      setGroup(data.group);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const currentUserIsLeader = group?.members?.some(
    (m: any) => (m.user?._id === currentUserId || m.user === currentUserId) && m.role === 'groupLeader'
  );

  return (
    <>
        <div className="flex-1 overflow-y-auto w-full">
          {error && (
            <div className="p-8">
              <div className="bg-app-red/10 border border-app-red/20 text-app-red p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-4xl mb-2">error</span>
                <h2 className="text-xl font-bold mb-2">Oops! Something went wrong.</h2>
                <p>{error}</p>
                <Link href="/dashboard/groups" className="mt-6 px-6 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors">
                  Go Back to Groups
                </Link>
              </div>
            </div>
          )}

          {!error && loading && (
            <div className="flex items-center justify-center h-full pt-20">
              <div className="flex flex-col items-center gap-4">
                 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-app-cyan"></div>
                 <p className="text-slate-400 font-medium animate-pulse">Loading group details...</p>
                 <img src="/logo.png" alt="Splitora Logo" className="w-16 h-16 opacity-20 grayscale mt-4 animate-pulse" />
              </div>
            </div>
          )}

          {!error && !loading && !group && (
             <div className="flex flex-col items-center justify-center h-full pt-20">
               <span className="material-symbols-outlined text-border-slate-500 text-6xl mb-4">search_off</span>
               <p className="text-slate-500 text-xl font-bold">Group not found.</p>
               <Link href="/dashboard/groups" className="mt-4 text-app-cyan hover:underline">Return to Groups</Link>
             </div>
          )}

          {!error && !loading && group && (
            <div className="p-6 md:p-8 max-w-[1600px] mx-auto relative pb-24">
              
              {/* Decorative Subtle Logo Background */}
              <div className="absolute right-0 top-0 opacity-[0.03] pointer-events-none overflow-hidden select-none z-0 w-96 h-96">
                 <img src="/logo.png" alt="" className="w-full h-full object-contain filter grayscale" />
              </div>

              {/* Breadcrumb Navigation */}
              <nav className="flex items-center gap-2 mb-6 text-sm font-medium relative z-10">
                <Link href="/dashboard/groups" className="text-slate-500 hover:text-white transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  My Groups
                </Link>
                <span className="text-slate-700">/</span>
                <span className="text-app-cyan">{group.groupName}</span>
              </nav>

              <div className="relative z-10">
                <GroupHeader 
                  groupId={group._id} 
                  groupName={group.groupName} 
                  memberCount={group.members?.length || 0} 
                  onOpenExpense={() => setIsExpenseModalOpen(true)}
                  onOpenSettle={() => setIsSettleModalOpen(true)}
                />
              </div>

              {/* Main Detail Grid Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 relative z-10">
                 
                 {/* Left Column (Balances & Members) */}
                 <div className="flex flex-col gap-6">
                    <BalancesCard groupId={group._id} refreshTrigger={refreshTrigger} onRefresh={() => setRefreshTrigger(prev => prev + 1)} members={group.members} currentUserIsLeader={currentUserIsLeader} currentUserId={currentUserId} />
                    <MembersCard 
                      groupId={group._id} 
                      members={group.members} 
                      currentUserIsLeader={currentUserIsLeader} 
                      onRefresh={fetchGroupData} 
                    />
                 </div>

                 {/* Right Column (Activity Feed + Spending Chart) */}
                 <div className="flex flex-col gap-6">
                    <ActivityFeedCard groupId={group._id} refreshTrigger={refreshTrigger} onRefresh={() => setRefreshTrigger(prev => prev + 1)} />
                    <SpendingChart groupId={group._id} title="Group Spending" />
                 </div>

              </div>
            </div>
          )}
        </div>

      {/* Modals */}
      {group && (
        <>
          <AddExpenseModal 
            isOpen={isExpenseModalOpen}
            onClose={() => setIsExpenseModalOpen(false)}
            groupId={group._id}
            members={group.members}
            onSuccess={() => setRefreshTrigger(prev => prev + 1)}
          />
          <SettleUpModal 
            isOpen={isSettleModalOpen}
            onClose={() => setIsSettleModalOpen(false)}
            groupId={group._id}
            members={group.members}
            currentUserId={currentUserId}
            onSuccess={() => setRefreshTrigger(prev => prev + 1)}
          />
        </>
      )}
    </>
  );
}
