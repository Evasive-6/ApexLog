import { useEffect, useRef } from "react";
import L from "leaflet";
import type { RouteData, Stop } from "../types";
import { Map, Layers, Navigation } from "lucide-react";

interface TripMapProps {
  route: RouteData;
  stops: Stop[];
}

export const TripMap: React.FC<TripMapProps> = ({ route, stops }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Cleanup previous map instance if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center (USA center)
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([39.8283, -98.5795], 4);

    mapInstanceRef.current = map;

    // Dark-themed or standard clean OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const bounds = L.latLngBounds([]);

    // Draw route polyline if coordinates available
    if (route.coordinates && route.coordinates.length > 0) {
      const latLngs: L.LatLngExpression[] = route.coordinates.map((pt) => [pt[0], pt[1]]);
      
      // Shadow / outline line
      L.polyline(latLngs, {
        color: "#1e3a8a",
        weight: 7,
        opacity: 0.6,
      }).addTo(map);

      // Core route line
      const polyline = L.polyline(latLngs, {
        color: "#3b82f6",
        weight: 4,
        opacity: 0.95,
        dashArray: undefined,
      }).addTo(map);

      route.coordinates.forEach((pt) => bounds.extend([pt[0], pt[1]]));
    }

    // Stop icon color and badge generator
    const getMarkerIcon = (stopType: string, label: string) => {
      let bg = "#10b981"; // emerald
      let border = "#059669";
      let text = "Start";

      switch (stopType) {
        case "ORIGIN":
          bg = "#10b981";
          border = "#059669";
          text = "ORIGIN";
          break;
        case "PICKUP":
          bg = "#3b82f6";
          border = "#1d4ed8";
          text = "LOAD";
          break;
        case "DROPOFF":
          bg = "#ef4444";
          border = "#b91c1c";
          text = "DROP";
          break;
        case "FUEL":
          bg = "#f97316";
          border = "#c2410c";
          text = "FUEL";
          break;
        case "30M_BREAK":
          bg = "#06b6d4";
          border = "#0891b2";
          text = "BREAK";
          break;
        case "10H_REST":
          bg = "#8b5cf6";
          border = "#6d28d9";
          text = "10H REST";
          break;
        case "34H_RESTART":
          bg = "#f43f5e";
          border = "#e11d48";
          text = "34H RESET";
          break;
      }

      return L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="
            background: ${bg};
            border: 2px solid #ffffff;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            padding: 3px 6px;
            border-radius: 9999px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3);
            white-space: nowrap;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: translate(-50%, -50%);
          ">
            ${text}
          </div>
        `,
        iconSize: [40, 20],
        iconAnchor: [20, 10],
      });
    };

    // Add Stop Markers
    stops.forEach((stop, idx) => {
      bounds.extend([stop.lat, stop.lng]);

      const marker = L.marker([stop.lat, stop.lng], {
        icon: getMarkerIcon(stop.stop_type, stop.name),
      }).addTo(map);

      const arrivalFormatted = new Date(stop.arrival_time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        day: "numeric",
      });
      const departureFormatted = new Date(stop.departure_time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        day: "numeric",
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 220px; color: #0f172a;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: #e2e8f0;">
              ${stop.stop_type}
            </span>
            <span style="font-size: 12px; font-weight: bold; color: #1e293b;">
              Mile ${stop.mileage}
            </span>
          </div>
          <h4 style="margin: 4px 0; font-size: 14px; font-weight: 700; color: #0f172a;">
            ${stop.name}
          </h4>
          <p style="margin: 4px 0 8px 0; font-size: 12px; color: #475569;">
            ${stop.activity}
          </p>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 11px; color: #64748b;">
            <div><strong>Duty Status:</strong> ${stop.duty_status}</div>
            <div><strong>Duration:</strong> ${stop.duration_hours} hrs</div>
            <div><strong>Arrival:</strong> ${arrivalFormatted}</div>
            <div><strong>Departure:</strong> ${departureFormatted}</div>
          </div>
        </div>
      `);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [route, stops]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
        <div className="flex items-center gap-2">
          <Map className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white m-0">Interactive Route & Stop Waypoints</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Origin
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Pickup
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Fuel
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> 10h Rest
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Dropoff
          </span>
        </div>
      </div>
      <div ref={mapContainerRef} className="w-full h-[420px] z-10" />
    </div>
  );
};
