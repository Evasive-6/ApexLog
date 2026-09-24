import type { Stop } from "../types";
import { ListOrdered, Clock, MapPin, Fuel, Moon, ArrowRight, RotateCcw, PackageCheck, Truck } from "lucide-react";

interface TripTimelineProps {
  stops: Stop[];
}

export const TripTimeline: React.FC<TripTimelineProps> = ({ stops }) => {
  const getBadge = (type: string) => {
    switch (type) {
      case "ORIGIN":
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          icon: <Truck className="w-3.5 h-3.5" />,
          label: "Origin / Start",
        };
      case "PICKUP":
        return {
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          icon: <PackageCheck className="w-3.5 h-3.5" />,
          label: "Cargo Pickup (1 hr)",
        };
      case "DROPOFF":
        return {
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          icon: <PackageCheck className="w-3.5 h-3.5" />,
          label: "Final Dropoff (1 hr)",
        };
      case "FUEL":
        return {
          bg: "bg-orange-500/10 text-orange-400 border-orange-500/20",
          icon: <Fuel className="w-3.5 h-3.5" />,
          label: "Fueling (<1,000 mi)",
        };
      case "30M_BREAK":
        return {
          bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
          icon: <Clock className="w-3.5 h-3.5" />,
          label: "30-Min Rest Break",
        };
      case "10H_REST":
        return {
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          icon: <Moon className="w-3.5 h-3.5" />,
          label: "10-Hr Sleeper Reset",
        };
      case "34H_RESTART":
        return {
          bg: "bg-pink-500/10 text-pink-400 border-pink-500/20",
          icon: <RotateCcw className="w-3.5 h-3.5" />,
          label: "34-Hr Cycle Restart",
        };
      default:
        return {
          bg: "bg-slate-500/10 text-slate-400 border-slate-500/20",
          icon: <MapPin className="w-3.5 h-3.5" />,
          label: type,
        };
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white m-0">Turn-by-Turn Route Itinerary & Stops</h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {stops.length} Planned Stops
        </span>
      </div>

      <div className="relative border-l border-slate-800 ml-4 space-y-6">
        {stops.map((stop, idx) => {
          const badge = getBadge(stop.stop_type);
          const arrival = new Date(stop.arrival_time);
          const departure = new Date(stop.departure_time);

          return (
            <div key={idx} className="relative pl-6 group">
              {/* Dot on timeline */}
              <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-blue-500 group-hover:scale-125 transition-transform" />

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      Odometer: {stop.mileage} mi
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <span>{arrival.toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                    <span>&bull;</span>
                    <span>
                      {arrival.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span>
                      {departure.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-white mb-1">{stop.name}</h4>
                <p className="text-xs text-slate-400 m-0">{stop.activity}</p>

                <div className="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                  <div>
                    <span className="text-slate-500">Duty Status: </span>
                    <span className="text-slate-300 font-medium">{stop.duty_status}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Duration: </span>
                    <span className="text-slate-300 font-medium">{stop.duration_hours} hrs</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
