import React from "react";
import { Truck, ShieldCheck, Printer, Compass, FileText } from "lucide-react";

interface NavbarProps {
  onPrint?: () => void;
  hasTripData?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onPrint, hasTripData }) => {
  return (
    <header className="no-print sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-cyan-500 text-white p-2.5 rounded-xl shadow-md shadow-blue-500/20">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white m-0">ApexLog</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                FMCSA HOS & ELD
              </span>
            </div>
            <p className="text-xs text-slate-400 m-0 hidden sm:block">
              Electronic Logging Device (49 CFR § 395) & Route Planning Engine
            </p>
          </div>
        </div>

        {/* Status and Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>70-Hour / 8-Day Compliant</span>
          </div>

          {hasTripData && (
            <button
              onClick={onPrint}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition shadow-sm"
              title="Print or Save Daily Log Sheets as PDF"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>Print / Export Logs</span>
            </button>
          )}

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-slate-400 hover:text-white px-2 py-1 rounded transition"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
};
