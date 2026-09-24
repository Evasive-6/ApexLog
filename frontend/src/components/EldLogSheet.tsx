import type { DailyLog } from "../types";

interface EldLogSheetProps {
  log: DailyLog;
}

export const EldLogSheet: React.FC<EldLogSheetProps> = ({ log }) => {
  // SVG grid sizing
  const GRID_LEFT = 110;
  const GRID_WIDTH = 720;
  const ROW_HEIGHT = 32;
  const GRID_TOP = 30;

  // Y positions for the 4 rows (center of each row)
  // 1: Off Duty, 2: Sleeper Berth, 3: Driving, 4: On Duty (Not Driving)
  const getRowY = (status: number) => {
    return GRID_TOP + (status - 1) * ROW_HEIGHT + ROW_HEIGHT / 2;
  };

  const getX = (hour: number) => {
    return GRID_LEFT + (Math.max(0, Math.min(24, hour)) / 24.0) * GRID_WIDTH;
  };

  // Generate SVG path for the continuous step line
  const buildStepLinePath = () => {
    if (!log.intervals || log.intervals.length === 0) return "";

    let path = "";
    log.intervals.forEach((interval, idx) => {
      const x1 = getX(interval.start_hour);
      const x2 = getX(interval.end_hour);
      const y = getRowY(interval.status);

      if (idx === 0) {
        path += `M ${x1} ${y} L ${x2} ${y}`;
      } else {
        const prevInterval = log.intervals[idx - 1];
        const prevY = getRowY(prevInterval.status);
        // Vertical connector from previous status to this status
        path += ` L ${x1} ${y} L ${x2} ${y}`;
      }
    });

    return path;
  };

  return (
    <div className="bg-white text-slate-900 border border-slate-300 rounded-xl p-6 shadow-2xl max-w-4xl mx-auto my-6 print:m-0 print:border-none print:shadow-none print:p-4 text-xs font-sans">
      {/* Top Header */}
      <div className="border-b-2 border-black pb-3 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-tight text-black m-0">
              Driver&apos;s Daily Log
            </h1>
            <span className="text-[11px] font-semibold text-slate-700 tracking-wide">
              (ONE CALENDAR DAY &mdash; 24 HOURS) &bull; 49 CFR § 395.8
            </span>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Log Date</div>
              <div className="text-sm font-black border-b border-black px-2 pb-0.5">
                {log.date}
              </div>
            </div>
            <div className="text-[9px] text-slate-500 max-w-[150px] leading-tight text-right">
              ORIGINAL: File at terminal.<br />
              DUPLICATE: Retain for 8 days.
            </div>
          </div>
        </div>

        {/* Carrier and Vehicle Info Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-300 text-[11px]">
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-slate-700 w-24">From:</span>
              <span className="border-b border-slate-400 flex-1 font-semibold">{log.from_location}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-slate-700 w-24">To:</span>
              <span className="border-b border-slate-400 flex-1 font-semibold">{log.to_location}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="border border-slate-300 rounded p-1.5 bg-slate-50">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Miles Driving Today</span>
                <span className="text-sm font-black text-black">{log.miles_driving_today}</span>
              </div>
              <div className="border border-slate-300 rounded p-1.5 bg-slate-50">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Vehicle / Trailer #</span>
                <span className="text-xs font-bold text-black truncate block">{log.truck_number}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-slate-700 w-28">Name of Carrier:</span>
              <span className="border-b border-slate-400 flex-1 font-semibold truncate">{log.carrier_name}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-slate-700 w-28">Main Office Address:</span>
              <span className="border-b border-slate-400 flex-1 font-medium truncate">{log.main_office}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-slate-700 w-28">Home Terminal:</span>
              <span className="border-b border-slate-400 flex-1 font-medium truncate">{log.home_terminal}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-slate-700 w-28">Driver Signature:</span>
              <span className="border-b border-slate-400 flex-1 italic font-serif text-blue-900">{log.driver_name} (Certified)</span>
            </div>
          </div>
        </div>
      </div>

      {/* FMCSA 24-HOUR GRAPH GRID (SVG) */}
      <div className="overflow-x-auto my-4 border border-black rounded shadow-sm bg-white p-2">
        <svg
          viewBox="0 0 910 180"
          className="w-full h-auto select-none"
          style={{ minWidth: "780px" }}
        >
          {/* Header Row: Black background band */}
          <rect x={GRID_LEFT} y={5} width={GRID_WIDTH} height={20} fill="#111827" />

          {/* Time Labels in Header */}
          {Array.from({ length: 25 }).map((_, i) => {
            const x = getX(i);
            let label = i.toString();
            if (i === 0 || i === 24) label = "Mid";
            else if (i === 12) label = "Noon";
            else if (i > 12) label = (i - 12).toString();

            return (
              <text
                key={`th-${i}`}
                x={x}
                y={19}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="9"
                fontWeight="700"
                fontFamily="sans-serif"
              >
                {label}
              </text>
            );
          })}

          {/* Total Hours Header label */}
          <text
            x={GRID_LEFT + GRID_WIDTH + 40}
            y={19}
            textAnchor="middle"
            fill="#111827"
            fontSize="10"
            fontWeight="800"
          >
            Total Hours
          </text>

          {/* Row Labels & Backgrounds */}
          {[
            { id: 1, label: "1. Off Duty" },
            { id: 2, label: "2. Sleeper Berth" },
            { id: 3, label: "3. Driving" },
            { id: 4, label: "4. On Duty (Not Driving)" },
          ].map((row, idx) => {
            const yTop = GRID_TOP + idx * ROW_HEIGHT;
            return (
              <g key={`row-${row.id}`}>
                {/* Row label */}
                <text
                  x={GRID_LEFT - 8}
                  y={yTop + ROW_HEIGHT / 2 + 4}
                  textAnchor="end"
                  fill="#000000"
                  fontSize="9.5"
                  fontWeight="700"
                >
                  {row.label}
                </text>

                {/* Row background striping */}
                <rect
                  x={GRID_LEFT}
                  y={yTop}
                  width={GRID_WIDTH}
                  height={ROW_HEIGHT}
                  fill={idx % 2 === 0 ? "#f8fafc" : "#ffffff"}
                  stroke="#cbd5e1"
                  strokeWidth="0.5"
                />

                {/* Center guideline */}
                <line
                  x1={GRID_LEFT}
                  y1={yTop + ROW_HEIGHT / 2}
                  x2={GRID_LEFT + GRID_WIDTH}
                  y2={yTop + ROW_HEIGHT / 2}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              </g>
            );
          })}

          {/* Vertical Hourly and Quarter-Hour Ticks */}
          {Array.from({ length: 24 }).map((_, hour) => {
            const hx = getX(hour);
            const gridBottom = GRID_TOP + 4 * ROW_HEIGHT;

            return (
              <g key={`grid-h-${hour}`}>
                {/* Full hour line across all 4 rows */}
                <line
                  x1={hx}
                  y1={GRID_TOP}
                  x2={hx}
                  y2={gridBottom}
                  stroke="#94a3b8"
                  strokeWidth="1"
                />

                {/* 15, 30, 45 minute ticks inside each row */}
                {[0, 1, 2, 3].map((rowIdx) => {
                  const ry = GRID_TOP + rowIdx * ROW_HEIGHT;
                  const x15 = getX(hour + 0.25);
                  const x30 = getX(hour + 0.5);
                  const x45 = getX(hour + 0.75);

                  return (
                    <g key={`ticks-${hour}-${rowIdx}`}>
                      {/* 15 min */}
                      <line x1={x15} y1={ry} x2={x15} y2={ry + 6} stroke="#cbd5e1" strokeWidth="0.75" />
                      {/* 30 min (taller) */}
                      <line x1={x30} y1={ry} x2={x30} y2={ry + 12} stroke="#94a3b8" strokeWidth="1" />
                      {/* 45 min */}
                      <line x1={x45} y1={ry} x2={x45} y2={ry + 6} stroke="#cbd5e1" strokeWidth="0.75" />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Final hour line at hour 24 */}
          <line
            x1={getX(24)}
            y1={GRID_TOP}
            x2={getX(24)}
            y2={GRID_TOP + 4 * ROW_HEIGHT}
            stroke="#94a3b8"
            strokeWidth="1"
          />

          {/* Outer Grid Border */}
          <rect
            x={GRID_LEFT}
            y={GRID_TOP}
            width={GRID_WIDTH}
            height={4 * ROW_HEIGHT}
            fill="none"
            stroke="#000000"
            strokeWidth="1.5"
          />

          {/* THE STEP LINE DRAWING */}
          <path
            d={buildStepLinePath()}
            fill="none"
            stroke="#1d4ed8"
            strokeWidth="3.5"
            strokeLinejoin="round"
            strokeLinecap="square"
          />

          {/* Total Hours Column on the Right */}
          <g>
            {/* Box for Totals */}
            <rect
              x={GRID_LEFT + GRID_WIDTH + 10}
              y={GRID_TOP}
              width={65}
              height={4 * ROW_HEIGHT}
              fill="#f8fafc"
              stroke="#000000"
              strokeWidth="1"
            />
            {/* Horizontal lines in totals */}
            {[1, 2, 3].map((i) => (
              <line
                key={`tot-div-${i}`}
                x1={GRID_LEFT + GRID_WIDTH + 10}
                y1={GRID_TOP + i * ROW_HEIGHT}
                x2={GRID_LEFT + GRID_WIDTH + 75}
                y2={GRID_TOP + i * ROW_HEIGHT}
                stroke="#cbd5e1"
                strokeWidth="1"
              />
            ))}

            {/* Individual totals */}
            <text
              x={GRID_LEFT + GRID_WIDTH + 42}
              y={GRID_TOP + 0 * ROW_HEIGHT + ROW_HEIGHT / 2 + 5}
              textAnchor="middle"
              fill="#000000"
              fontSize="12"
              fontWeight="800"
            >
              {log.totals.off_duty}
            </text>
            <text
              x={GRID_LEFT + GRID_WIDTH + 42}
              y={GRID_TOP + 1 * ROW_HEIGHT + ROW_HEIGHT / 2 + 5}
              textAnchor="middle"
              fill="#000000"
              fontSize="12"
              fontWeight="800"
            >
              {log.totals.sleeper_berth}
            </text>
            <text
              x={GRID_LEFT + GRID_WIDTH + 42}
              y={GRID_TOP + 2 * ROW_HEIGHT + ROW_HEIGHT / 2 + 5}
              textAnchor="middle"
              fill="#000000"
              fontSize="12"
              fontWeight="800"
            >
              {log.totals.driving}
            </text>
            <text
              x={GRID_LEFT + GRID_WIDTH + 42}
              y={GRID_TOP + 3 * ROW_HEIGHT + ROW_HEIGHT / 2 + 5}
              textAnchor="middle"
              fill="#000000"
              fontSize="12"
              fontWeight="800"
            >
              {log.totals.on_duty}
            </text>

            {/* Sum line = 24.0 */}
            <text
              x={GRID_LEFT + GRID_WIDTH + 42}
              y={GRID_TOP + 4 * ROW_HEIGHT + 18}
              textAnchor="middle"
              fill="#059669"
              fontSize="12"
              fontWeight="900"
            >
              = {log.totals.total_hours}
            </text>
          </g>
        </svg>
      </div>

      {/* Remarks Section */}
      <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 my-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-extrabold uppercase text-[11px] text-slate-800">
            Remarks & Duty Status Changes (Time standard of home terminal)
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            Shipping: {log.shipping_doc} &bull; Commodity: {log.commodity}
          </span>
        </div>

        {log.remarks && log.remarks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {log.remarks.map((rem, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded p-2 text-[10px] shadow-2xs"
              >
                <div className="flex items-center justify-between text-slate-500 font-bold mb-0.5">
                  <span className="text-blue-700">{rem.time_str}</span>
                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px]">
                    {rem.status_label}
                  </span>
                </div>
                <div className="font-bold text-slate-900 truncate">{rem.location}</div>
                <div className="text-slate-600 truncate mt-0.5">{rem.remarks}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-400 italic text-[11px] py-1">
            Continuous driving or off-duty status maintained throughout the 24-hour period.
          </div>
        )}
      </div>

      {/* Bottom 70-Hour / 8-Day Recap Table */}
      <div className="border-t-2 border-black pt-3 mt-4">
        <div className="text-[11px] font-bold text-slate-800 mb-2 flex items-center justify-between">
          <span>70-HOUR / 8-DAY DRIVERS RECAP &bull; COMPLETE AT END OF DAY</span>
          {log.recap.restart_applied && (
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-black border border-amber-300 text-[10px]">
              * 34-Hour Restart Applied (Cycle Reset to 70 hrs)
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
          <div className="border border-slate-300 rounded p-2 bg-slate-50">
            <span className="text-slate-500 font-bold block uppercase text-[9px]">
              On Duty Hours Today (Lines 3 & 4)
            </span>
            <span className="text-sm font-extrabold text-black block mt-0.5">
              {log.recap.on_duty_today} hrs
            </span>
          </div>

          <div className="border border-slate-300 rounded p-2 bg-slate-50">
            <span className="text-slate-500 font-bold block uppercase text-[9px]">
              Total Hours Last 8 Days
            </span>
            <span className="text-sm font-extrabold text-blue-700 block mt-0.5">
              {log.recap.cycle_used_cumulative} hrs
            </span>
          </div>

          <div className="border border-slate-300 rounded p-2 bg-slate-50">
            <span className="text-slate-500 font-bold block uppercase text-[9px]">
              Hours Available Tomorrow
            </span>
            <span className="text-sm font-extrabold text-emerald-700 block mt-0.5">
              {log.recap.cycle_available_tomorrow} hrs
            </span>
          </div>

          <div className="border border-slate-300 rounded p-2 bg-slate-50">
            <span className="text-slate-500 font-bold block uppercase text-[9px]">
              Compliance Status
            </span>
            <span className="text-xs font-black text-emerald-600 block mt-1 uppercase">
              HOS Compliant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
