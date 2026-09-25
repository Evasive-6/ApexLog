import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { TripInputForm } from "./components/TripInputForm";
import { TripSummaryCards } from "./components/TripSummaryCards";
import { TripMap } from "./components/TripMap";
import { TripTimeline } from "./components/TripTimeline";
import { EldLogViewer } from "./components/EldLogViewer";
import type { TripInputs, TripResponse, PresetTrip } from "./types";
import { AlertCircle, Truck, Compass, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` : "/api";

const DEFAULT_PRESETS: PresetTrip[] = [
  {
    id: "cross_country",
    title: "Cross-Country Heavy Haul (Coast to Coast)",
    description: "Los Angeles to New York via Dallas (~2,800 miles, 4+ days, multiple 10h rests, 1000-mile fueling)",
    current_location: "Los Angeles, CA",
    pickup_location: "Dallas, TX",
    dropoff_location: "New York, NY",
    current_cycle_used: 12.0,
  },
  {
    id: "midwest_regional",
    title: "Midwest Express (Regional 1-Day)",
    description: "Chicago to Columbus via Indianapolis (~350 miles, 1 calendar day, 1 hour pickup and dropoff)",
    current_location: "Chicago, IL",
    pickup_location: "Indianapolis, IN",
    dropoff_location: "Columbus, OH",
    current_cycle_used: 8.5,
  },
  {
    id: "southern_freight",
    title: "Southeast Corridor (2-Day Medium Haul)",
    description: "Miami to Nashville via Atlanta (~950 miles, requires 10-hr sleeper rest and 30-min break)",
    current_location: "Miami, FL",
    pickup_location: "Atlanta, GA",
    dropoff_location: "Nashville, TN",
    current_cycle_used: 24.0,
  },
  {
    id: "cycle_restart_stress",
    title: "Cycle Exhaustion & 34-Hour Restart Test",
    description: "High starting cycle (62.0 hrs) forcing a mandatory 34-hour restart mid-route before reaching 70 hours",
    current_location: "Dallas, TX",
    pickup_location: "Memphis, TN",
    dropoff_location: "Philadelphia, PA",
    current_cycle_used: 62.0,
  },
];

export function App() {
  const [tripData, setTripData] = useState<TripResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<PresetTrip[]>(DEFAULT_PRESETS);

  useEffect(() => {
    fetch(`${API_BASE}/presets/`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.presets) {
          setPresets(data.presets);
        }
      })
      .catch(() => {});

    handleCalculate({
      current_location: "Dallas, TX",
      pickup_location: "Atlanta, GA",
      dropoff_location: "New York, NY",
      current_cycle_used: 15.0,
      departure_time: new Date().toISOString().slice(0, 16),
      driver_name: "John E. Doe",
      carrier_name: "Apex Freight Logistics LLC",
      truck_number: "TRK-4421 / TRL-8809",
      shipping_doc: "BOL-908234",
      commodity: "General Freight / Electronics",
    });
  }, []);

  const handleCalculate = async (inputs: TripInputs) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/calculate-trip/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputs),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Failed to calculate trip and logs");
      }

      const data: TripResponse = await response.json();
      setTripData(data);
    } catch (err: any) {
      console.error("Trip calculation error:", err);
      setError(err.message || "An error occurred while connecting to the backend HOS engine.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar onPrint={handlePrint} hasTripData={!!tripData} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Dispatch Error: </span>
              {error}
            </div>
          </div>
        )}

        {/* Top Two-Column Grid: Form & Summary / Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form & Key Stats */}
          <div className="lg:col-span-5 space-y-6">
            <TripInputForm
              onCalculate={handleCalculate}
              isLoading={isLoading}
              presets={presets}
            />

            {tripData && <TripSummaryCards summary={tripData.summary} />}
          </div>

          {/* Right Column: Interactive Map & Turn-by-Turn Itinerary */}
          <div className="lg:col-span-7 space-y-6">
            {tripData ? (
              <>
                <TripMap route={tripData.route} stops={tripData.stops} />
                <TripTimeline stops={tripData.stops} />
              </>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 mb-3">
                  <Compass className="w-8 h-8 animate-pulse" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Awaiting Trip Parameters</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Enter your current location, cargo pickup, and dropoff destinations to plot the optimal route and generate FMCSA ELD logs.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Full-Width Section: FMCSA ELD Daily Log Sheets */}
        {tripData && tripData.daily_logs && tripData.daily_logs.length > 0 && (
          <section className="pt-4">
            <EldLogViewer dailyLogs={tripData.daily_logs} onPrint={handlePrint} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ApexLog &bull; Full-Stack Django & React HOS/ELD Dispatch Engine</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            FMCSA 49 CFR Part 395 Compliant &bull; 70-Hour / 8-Day Rule
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
