import React from 'react';
import HeroCard from '@/components/dashboard/HeroCard';
import LineChartCard from '@/components/dashboard/LineChartCard';
import BalanceChartCard from '@/components/dashboard/BalanceChartCard';
import DashboardGroups from '@/components/dashboard/DashboardGroups';
import ProfitCard from '@/components/dashboard/ProfitCard';
import BalanceCard from '@/components/dashboard/BalanceCard';
import GroupTreemap from '@/components/dashboard/GroupTreemap';
import MonthlySummaryCard from '@/components/dashboard/MonthlySummaryCard';
import SettlementRateCard from '@/components/dashboard/SettlementRateCard';
import AnimatedCard from '@/components/AnimatedCard';

export default function Dashboard() {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-[1600px] mx-auto">
            
            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* LEFT COLUMN — 8/12 */}
              <div className="xl:col-span-8 flex flex-col gap-6">
                <AnimatedCard delay={0}>
                  <HeroCard />
                </AnimatedCard>
                
                <AnimatedCard delay={80}>
                  <DashboardGroups />
                </AnimatedCard>

                {/* Treemap + Pie Chart row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatedCard delay={160}>
                    <GroupTreemap />
                  </AnimatedCard>
                  <AnimatedCard delay={240}>
                    <BalanceChartCard />
                  </AnimatedCard>
                </div>

                {/* Activity + Spending Chart */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatedCard delay={320}>
                    <BalanceCard />
                  </AnimatedCard>
                  <AnimatedCard delay={400}>
                    <LineChartCard />
                  </AnimatedCard>
                </div>
              </div>
              
              {/* RIGHT COLUMN — 4/12 */}
              <div className="xl:col-span-4 flex flex-col gap-6">
                <AnimatedCard delay={100}>
                  <ProfitCard />
                </AnimatedCard>
                <AnimatedCard delay={200}>
                  <MonthlySummaryCard />
                </AnimatedCard>
                <AnimatedCard delay={300}>
                  <SettlementRateCard />
                </AnimatedCard>
              </div>
              
            </div>
            
          </div>
    </div>
  );
}
