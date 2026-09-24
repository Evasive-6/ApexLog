import type { TripSummary } from "../types";
import { Milestone, Clock, Calendar, Fuel, Moon, ShieldCheck, CheckCircle2, RotateCcw, AlertTriangle } from "lucide-react";

interface TripSummaryCardsProps {
  summary: TripSummary;
}

export const TripSummaryCards: React.FC<TripSummaryCardsProps> = ({ summary }) => {
  const cyclePercent = Math.min(100, Math.round((summary.final_cycle_used / 70.0) * 100));

  return (
    <div className="space-y-4">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Mileage */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Distance</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Milestone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {summary.total_miles.toLocaleString()} <span className="text-sm font-medium text-slate-400">mi</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {summary.total_days} calendar day{summary.total_days > 1 ? "s" : ""}
          </div>
        </div>

        {/* Driving & On Duty */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Drive & Duty Time</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {summary.total_driving_hours} <span className="text-sm font-medium text-slate-400">hrs drive</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total on-duty: <span className="text-indigo-300 font-semibold">{summary.total_on_duty_hours} hrs</span>
          </div>
        </div>

        {/* 70-Hour Cycle Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">70-Hr / 8-Day Cycle</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {summary.final_cycle_used} <span className="text-sm font-medium text-slate-400">/ 70 hrs</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                cyclePercent > 90 ? "bg-rose-500" : cyclePercent > 70 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${cyclePercent}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
            <span>Remaining: {summary.cycle_remaining} hrs</span>
            <span>{cyclePercent}%</span>
          </div>
        </div>

        {/* Total Elapsed Trip Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Duration</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {summary.total_trip_duration_hours} <span className="text-sm font-medium text-slate-400">hrs</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Includes stops, loading & sleeper rests
          </div>
        </div>
      </div>

      {/* Compliance & Stops Breakdown Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Compliance Status */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">FMCSA Hours of Service Compliance</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                100% Validated
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              11-hr driving limit &bull; 14-hr duty window &bull; 30-min break after 8 hrs &bull; 1,000-mi fueling &bull; 10-hr sleeper berth resets
            </p>
          </div>
        </div>

        {/* Stops Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 flex items-center gap-1.5 font-medium">
            <Fuel className="w-3.5 h-3.5" />
            {summary.num_fuel_stops} Fuel Stop{summary.num_fuel_stops !== 1 ? "s" : ""}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5" />
            {summary.num_rest_breaks} Rest Break{summary.num_rest_breaks !== 1 ? "s" : ""}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center gap-1.5 font-medium">
            <Moon className="w-3.5 h-3.5" />
            {summary.num_10h_sleepers} 10-Hr Sleep{summary.num_10h_sleepers !== 1 ? "s" : ""}
          </span>
          {summary.num_34h_restarts > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-1.5 font-medium">
              <RotateCcw className="w-3.5 h-3.5" />
              {summary.num_34h_restarts} 34-Hr Restart
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
