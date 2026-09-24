export interface TripInputs {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used: number;
  departure_time?: string;
  driver_name?: string;
  carrier_name?: string;
  truck_number?: string;
  main_office?: string;
  home_terminal?: string;
  shipping_doc?: string;
  commodity?: string;
}

export interface TripSummary {
  total_miles: number;
  total_driving_hours: number;
  total_on_duty_hours: number;
  total_trip_duration_hours: number;
  total_days: number;
  starting_cycle_used: number;
  final_cycle_used: number;
  cycle_remaining: number;
  num_fuel_stops: number;
  num_rest_breaks: number;
  num_10h_sleepers: number;
  num_34h_restarts: number;
  compliance_status: string;
  violations: string[];
}

export type StopType = "ORIGIN" | "PICKUP" | "DROPOFF" | "FUEL" | "30M_BREAK" | "10H_REST" | "34H_RESTART";

export interface Stop {
  stop_type: StopType;
  name: string;
  lat: number;
  lng: number;
  arrival_time: string;
  departure_time: string;
  activity: string;
  duration_hours: number;
  duty_status: string;
  mileage: number;
}

export interface DutyInterval {
  status: 1 | 2 | 3 | 4;
  status_label: string;
  start_hour: number;
  end_hour: number;
  duration_hours: number;
  start_time_str: string;
  end_time_str: string;
  location: string;
  remarks: string;
}

export interface DayRemark {
  time_str: string;
  hour: number;
  location: string;
  status_label: string;
  remarks: string;
}

export interface DailyLog {
  day_number: number;
  date: string;
  date_formatted: string;
  carrier_name: string;
  main_office: string;
  home_terminal: string;
  driver_name: string;
  truck_number: string;
  shipping_doc: string;
  commodity: string;
  from_location: string;
  to_location: string;
  miles_driving_today: number;
  intervals: DutyInterval[];
  totals: {
    off_duty: number;
    sleeper_berth: number;
    driving: number;
    on_duty: number;
    total_hours: number;
  };
  remarks: DayRemark[];
  recap: {
    on_duty_today: number;
    cycle_used_cumulative: number;
    cycle_available_tomorrow: number;
    cycle_limit: number;
    restart_applied: boolean;
  };
}

export interface RouteData {
  total_distance_miles: number;
  total_duration_hours: number;
  coordinates: [number, number][];
  legs: {
    from_name: string;
    to_name: string;
    distance_miles: number;
    duration_hours: number;
    coordinates: [number, number][];
  }[];
}

export interface TripResponse {
  summary: TripSummary;
  driver_info: {
    driver_name: string;
    carrier_name: string;
    truck_number: string;
    main_office: string;
    home_terminal: string;
    shipping_doc: string;
    commodity: string;
  };
  stops: Stop[];
  daily_logs: DailyLog[];
  route: RouteData;
}

export interface PresetTrip {
  id: string;
  title: string;
  description: string;
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used: number;
}
