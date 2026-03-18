import React from 'react';

const spendingCategories = [
  { name: 'Rent & Utilities', percent: 40, amount: '₹3,000', color: 'bg-app-purple', shadow: 'shadow-glow-purple' },
  { name: 'Food & Dining', percent: 25, amount: '₹200', color: 'bg-blue-500', shadow: '' },
  { name: 'Shopping', percent: 15, amount: '₹450', color: 'bg-app-cyan', shadow: 'shadow-glow-cyan' },
  { name: 'Transport', percent: 10, amount: '₹100', color: 'bg-[#c43add]', shadow: 'shadow-glow-purple' },
  { name: 'Other', percent: 10, amount: '₹50', color: 'bg-app-red', shadow: '' },
];

export default function SpendingCard() {
  return (
    <div className="bg-app-card border border-app-border rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-white mb-6">Where your money go?</h2>
      <div className="space-y-4">
        {spendingCategories.map((cat, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-slate-300 font-medium">{cat.name}</span>
              <span className="text-slate-400">{cat.percent}% - {cat.amount}</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div 
                className={`h-full ${cat.color} ${cat.shadow} rounded-full`} 
                style={{ width: `${cat.percent}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
