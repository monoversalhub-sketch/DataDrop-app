'use client';

import { useMemo } from 'react';
import { PLANS_BY_NETWORK } from '@/lib/plans';

export default function PlanGrid({ network, selectedPlanId, onPlanSelect }) {
  const plans = useMemo(() => {
    return PLANS_BY_NETWORK[network] || [];
  }, [network]);

  if (plans.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400">
        No plans available for this network right now.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {plans.map((plan) => (
        <button
          key={plan.id}
          onClick={() => onPlanSelect(plan)}
          className={`min-h-[72px] p-3 rounded-xl cursor-pointer transition ${
            selectedPlanId === plan.id
              ? 'ring-2 ring-emerald-500 bg-zinc-800'
              : 'bg-zinc-900 hover:bg-zinc-800'
          }`}
        >
          <div className="text-xl font-bold text-white">{plan.data_size}</div>
          <div className="text-xs text-zinc-400 mt-1">{plan.validity}</div>
          <div className="text-lg font-semibold text-emerald-400 mt-2">₦{plan.retail_price}</div>
        </button>
      ))}
    </div>
  );
}
