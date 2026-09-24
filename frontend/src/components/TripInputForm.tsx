import { useState } from "react";
import type { TripInputs, PresetTrip } from "../types";
import { MapPin, Navigation, Clock, Truck, ChevronDown, ChevronUp, Sparkles, Loader2, Play } from "lucide-react";

interface TripInputFormProps {
  onCalculate: (inputs: TripInputs) => void;
  isLoading: boolean;
  presets: PresetTrip[];
}

export const TripInputForm: React.FC<TripInputFormProps> = ({
  onCalculate,
  isLoading,
  presets,
}) => {
  const [currentLocation, setCurrentLocation] = useState("Dallas, TX");
  const [pickupLocation, setPickupLocation] = useState("Atlanta, GA");
  const [dropoffLocation, setDropoffLocation] = useState("New York, NY");
  const [currentCycleUsed, setCurrentCycleUsed] = useState<number>(15.0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced metadata fields
  const [driverName, setDriverName] = useState("John E. Doe");
  const [carrierName, setCarrierName] = useState("Apex Freight Logistics LLC");
  const [truckNumber, setTruckNumber] = useState("TRK-4421 / TRL-8809");
  const [shippingDoc, setShippingDoc] = useState("BOL-908234");
  const [commodity, setCommodity] = useState("General Freight / Electronics");
  const [departureTime, setDepartureTime] = useState(
    new Date().toISOString().slice(0, 16)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate({
      current_location: currentLocation,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      current_cycle_used: Number(currentCycleUsed),
      departure_time: departureTime,
      driver_name: driverName,
      carrier_name: carrierName,
      truck_number: truckNumber,
      shipping_doc: shippingDoc,
      commodity: commodity,
    });
  };

  const handleApplyPreset = (p: PresetTrip) => {
    setCurrentLocation(p.current_location);
    setPickupLocation(p.pickup_location);
    setDropoffLocation(p.dropoff_location);
    setCurrentCycleUsed(p.current_cycle_used);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 lg:p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white m-0 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-400" />
            Trip & Dispatch Dispatch Parameters
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure trip origins, cargo pickup/delivery, and driver cycle hours
          </p>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="mb-5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Quick Test Scenarios
        </label>
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 transition group"
            >
              <div className="text-xs font-bold text-slate-200 group-hover:text-blue-400 truncate">
                {preset.title}
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                {preset.current_location} &rarr; {preset.pickup_location} &rarr; {preset.dropoff_location}
              </div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Route Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Current Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              Current Location (Start)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                placeholder="e.g. Dallas, TX"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
              />
              <MapPin className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Pickup Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-500/20" />
              Pickup Location (1 hr load)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="e.g. Atlanta, GA"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
              />
              <MapPin className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Dropoff Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/20" />
              Dropoff Location (1 hr unload)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={dropoffLocation}
                onChange={(e) => setDropoffLocation(e.target.value)}
                placeholder="e.g. New York, NY"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
              />
              <MapPin className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Current Cycle Used Slider */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <label className="text-xs font-medium text-slate-200">
                Current Cycle Used (70-hr / 8-day rule)
              </label>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                max="70"
                step="0.5"
                value={currentCycleUsed}
                onChange={(e) => setCurrentCycleUsed(Math.min(70, Math.max(0, parseFloat(e.target.value) || 0)))}
                className="w-16 bg-slate-900 border border-slate-700 text-center text-sm font-bold text-amber-400 rounded-lg py-1 px-1 outline-none"
              />
              <span className="text-xs text-slate-400 font-semibold">/ 70 hrs</span>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="70"
            step="0.5"
            value={currentCycleUsed}
            onChange={(e) => setCurrentCycleUsed(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />

          <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
            <span>0 hrs (Fresh 34h restart)</span>
            <span className="text-slate-400 font-medium">
              Available before restart: {(70 - currentCycleUsed).toFixed(1)} hrs
            </span>
            <span>70 hrs (Limit reached)</span>
          </div>
        </div>

        {/* Advanced Accordion */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition font-medium py-1"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{showAdvanced ? "Hide" : "Show"} FMCSA ELD Carrier & Driver Details</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Driver Name</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Carrier Name</label>
                <input
                  type="text"
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Tractor & Trailer #</label>
                <input
                  type="text"
                  value={truckNumber}
                  onChange={(e) => setTruckNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Shipping BOL / Manifest #</label>
                <input
                  type="text"
                  value={shippingDoc}
                  onChange={(e) => setShippingDoc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Commodity</label>
                <input
                  type="text"
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Departure Date & Time</label>
                <input
                  type="datetime-local"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Calculating Route & Generating FMCSA Daily Logs...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Calculate Route & Draw ELD Daily Logs</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
