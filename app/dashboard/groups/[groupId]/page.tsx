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
import AITipCard from '@/components/groups/details/AITipCard';

export default function GroupDetailsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settlePrefill, setSettlePrefill] = useState({ recipientId: "", amount: "" });
  
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
      {/* Background Dots */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02] light:opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>

      <div className="flex-1 overflow-y-auto w-full relative z-10">
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
              <div className="flex flex-col items-center gap-6">
                 <div className="flex space-x-2 justify-center items-center mt-4">
                   <div className="h-4 w-4 bg-[#00f2fe] light:bg-[#7e22ce] rounded-full animate-bounce [animation-delay:-0.3s] shadow-glow-cyan light:shadow-sm"></div>
                   <div className="h-4 w-4 bg-[#a82ee2] light:bg-[#00f2fe] rounded-full animate-bounce [animation-delay:-0.15s] shadow-glow-purple light:shadow-sm"></div>
                   <div className="h-4 w-4 bg-[#00f2fe] light:bg-[#7e22ce] rounded-full animate-bounce shadow-glow-cyan light:shadow-sm"></div>
                 </div>
                 <p className="text-slate-400 light:text-slate-500 font-bold tracking-tight animate-pulse">Loading group details...</p>
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
              
              {/* Logo Removed */}

              {/* Breadcrumb Navigation */}
              <nav className="flex items-center gap-2 mb-6 text-sm font-medium relative z-10">
                <Link href="/dashboard/groups" className="text-slate-500 hover:text-white transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  My Groups
                </Link>
                <span className="text-slate-700 light:text-slate-400">/</span>
                <span className="text-[#00f2fe] light:text-[#7e22ce]">{group.groupName}</span>
              </nav>

              <div className="relative z-10">
                <GroupHeader 
                  groupId={group._id} 
                  groupName={group.groupName} 
                  memberCount={group.members?.length || 0} 
                  onOpenExpense={() => setIsExpenseModalOpen(true)}
                  onOpenSettle={() => { setSettlePrefill({ recipientId: "", amount: "" }); setIsSettleModalOpen(true); }}
                />
              </div>

              {/* Main Detail Grid Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 relative z-10 items-stretch">
                 
                 {/* Left Column (Balances & Recent Activity) */}
                 <div className="flex flex-col gap-6 h-full">
                    <BalancesCard 
                      groupId={group._id} 
                      refreshTrigger={refreshTrigger} 
                      onRefresh={() => setRefreshTrigger(prev => prev + 1)} 
                      members={group.members} 
                      currentUserIsLeader={currentUserIsLeader} 
                      currentUserId={currentUserId} 
                      onOpenSettle={(recId, amt) => { setSettlePrefill({ recipientId: recId, amount: amt }); setIsSettleModalOpen(true); }}
                    />
                    <div className="flex-1 min-h-[400px] relative">
                      <div className="absolute inset-0">
                        <ActivityFeedCard className="h-full" groupId={group._id} refreshTrigger={refreshTrigger} onRefresh={() => setRefreshTrigger(prev => prev + 1)} />
                      </div>
                    </div>
                 </div>

                 {/* Right Column (AI Tip + Members + Spending Chart) */}
                 <div className="flex flex-col gap-6 h-full justify-between">
                    <div className="flex flex-col gap-6">
                      <AITipCard groupId={group._id} refreshTrigger={refreshTrigger} />
                      <MembersCard 
                        groupId={group._id} 
                        members={group.members} 
                        currentUserIsLeader={currentUserIsLeader} 
                        onRefresh={fetchGroupData} 
                      />
                    </div>
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
            onClose={() => { setIsSettleModalOpen(false); setSettlePrefill({ recipientId: "", amount: "" }); }}
            groupId={group._id}
            members={group.members}
            currentUserId={currentUserId}
            onSuccess={() => setRefreshTrigger(prev => prev + 1)}
            defaultRecipientId={settlePrefill.recipientId}
            defaultAmount={settlePrefill.amount}
          />
        </>
      )}
    </>
  );
}
