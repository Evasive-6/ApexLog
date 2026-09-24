import { useState } from "react";
import type { DailyLog } from "../types";
import { EldLogSheet } from "./EldLogSheet";
import { FileText, ChevronLeft, ChevronRight, Eye, Printer, Layers } from "lucide-react";

interface EldLogViewerProps {
  dailyLogs: DailyLog[];
  onPrint?: () => void;
}

export const EldLogViewer: React.FC<EldLogViewerProps> = ({ dailyLogs, onPrint }) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [viewAll, setViewAll] = useState(false);

  if (!dailyLogs || dailyLogs.length === 0) {
    return null;
  }

  const activeLog = dailyLogs[activeDayIndex] || dailyLogs[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 lg:p-6 shadow-xl space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white m-0">
              FMCSA Driver Daily Log Sheets (RODS)
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
              {dailyLogs.length} Day{dailyLogs.length > 1 ? "s" : ""} Generated
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official 24-hour graph grid logs drawn with continuous step lines per 49 CFR § 395.8
          </p>
        </div>

        {/* View toggle and print button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewAll(!viewAll)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              viewAll
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{viewAll ? "Single Day View" : "View All Sheets"}</span>
          </button>

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Print / PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Day Tabs */}
      {!viewAll && (
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5">
            {dailyLogs.map((log, idx) => (
              <button
                key={log.day_number}
                type="button"
                onClick={() => setActiveDayIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-2 ${
                  activeDayIndex === idx
                    ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20"
                    : "bg-slate-800/80 text-slate-400 border-slate-700/80 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span>Day {log.day_number}</span>
                <span className="text-[10px] opacity-75 font-normal">({log.date})</span>
              </button>
            ))}
          </div>

          {/* Quick Prev / Next */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={activeDayIndex === 0}
              onClick={() => setActiveDayIndex((i) => Math.max(0, i - 1))}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 px-1 font-medium">
              {activeDayIndex + 1} / {dailyLogs.length}
            </span>
            <button
              type="button"
              disabled={activeDayIndex === dailyLogs.length - 1}
              onClick={() => setActiveDayIndex((i) => Math.min(dailyLogs.length - 1, i + 1))}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Render Single Sheet or All Sheets */}
      <div className="pt-2">
        {viewAll ? (
          <div className="space-y-8">
            {dailyLogs.map((log) => (
              <div key={log.day_number} className="page-break">
                <div className="text-xs font-bold text-slate-400 mb-2 pl-2">
                  Daily Sheet &mdash; Day {log.day_number} ({log.date_formatted})
                </div>
                <EldLogSheet log={log} />
              </div>
            ))}
          </div>
        ) : (
          <div>
            <EldLogSheet log={activeLog} />
          </div>
        )}
      </div>
    </div>
  );
};
