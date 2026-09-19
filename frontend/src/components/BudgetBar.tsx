import React from "react";
import { DollarSign, ShieldAlert, CheckCircle, Sliders } from "lucide-react";
import { BudgetStateItem } from "../types";

interface BudgetBarProps {
  budget?: BudgetStateItem;
  consumedUsd?: number;
  allocatedUsd?: number;
  onUpdateBudget?: (consumedUsd: number) => void;
}

export const BudgetBar: React.FC<BudgetBarProps> = ({ budget: propBudget, consumedUsd, allocatedUsd, onUpdateBudget }) => {
  const budget: BudgetStateItem = propBudget || {
    total_budget_usd: allocatedUsd || 50.0,
    consumed_budget_usd: consumedUsd || 31.4,
    remaining_budget_usd: (allocatedUsd || 50.0) - (consumedUsd || 31.4),
    percentage_used: Math.round(((consumedUsd || 31.4) / (allocatedUsd || 50.0)) * 100),
    tier: ((consumedUsd || 31.4) / (allocatedUsd || 50.0)) > 0.8 ? "CONSTRAINED" : "NORMAL",
    narrative_generation_enabled: true,
    deterministic_checks_enabled: true,
    disabled_tasks: [],
  };
  const isConstrained = budget.percentage_used >= 80;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">AI Budget Governor</span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
              budget.tier === "CRITICAL"
                ? "bg-rose-100 text-rose-800 border-rose-300"
                : budget.tier === "CONSTRAINED"
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : budget.tier === "CAUTION"
                ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                : "bg-emerald-100 text-emerald-800 border-emerald-300"
            }`}
          >
            {budget.tier} TIER
          </span>
        </div>
        <span className="text-xs font-medium text-slate-600">
          ${budget.consumed_budget_usd.toFixed(2)} / ${budget.total_budget_usd.toFixed(2)} ({budget.percentage_used}%)
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            budget.percentage_used > 85 ? "bg-rose-500" : budget.percentage_used > 70 ? "bg-amber-500" : "bg-blue-600"
          }`}
          style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
        />
      </div>

      {/* Policy State */}
      <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-500">
        <div className="flex items-center space-x-3">
          <span className="flex items-center text-emerald-600">
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Deterministic checks active (100%)
          </span>
          {isConstrained ? (
            <span className="flex items-center text-amber-600 font-medium">
              <ShieldAlert className="w-3.5 h-3.5 mr-1" />
              Narrative AI generation disabled to preserve safety checks
            </span>
          ) : (
            <span className="text-slate-400">Narrative AI enabled</span>
          )}
        </div>

        {onUpdateBudget && (
          <div className="flex items-center space-x-1.5 mt-1 sm:mt-0">
            <Sliders className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] text-slate-400 mr-1">Simulate Budget:</span>
            <button
              onClick={() => onUpdateBudget(18.5)}
              className={`px-2 py-0.5 text-[11px] rounded border ${
                budget.percentage_used < 70 ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-slate-600"
              }`}
            >
              Normal (18%)
            </button>
            <button
              onClick={() => onUpdateBudget(82.0)}
              className={`px-2 py-0.5 text-[11px] rounded border ${
                budget.percentage_used >= 80 && budget.percentage_used < 95
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-white text-slate-600"
              }`}
            >
              Constrained (82%)
            </button>
            <button
              onClick={() => onUpdateBudget(96.0)}
              className={`px-2 py-0.5 text-[11px] rounded border ${
                budget.percentage_used >= 95 ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-white text-slate-600"
              }`}
            >
              Critical (96%)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
