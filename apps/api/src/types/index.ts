/**
 * Shared data types — the contract imported by both backend and frontend.
 * Firestore is schemaless; these types plus Zod schemas enforce shape.
 */

export type Role = "rider" | "driver" | "admin";
export type VehicleType = "keke" | "bus";
export type PayMethod = "naira" | "cngn";
export type RideStatus =
  | "requested"
  | "assigned"
  | "arriving"
  | "started"
  | "completed"
  | "cancelled";
export type Severity = "critical" | "high" | "medium" | "info";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  chatId?: string;
  privyWallet?: string;
};

export type Driver = {
  id: string;
  name: string;
  plate: string;
  vehicleType: VehicleType;
  online: boolean;
  currentLat: number;
  currentLng: number;
  routeId?: string;
  capacity?: number; // keke seat count (default 4); undefined treated as 4
  seatsTaken?: number; // seats currently occupied across active pooled rides (0..capacity)
  poolToStop?: string; // the destination this keke's current pool is heading to (while seatsTaken>0)
};

export type Stop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type Route = {
  id: string;
  name: string;
  stopIds: string[];
};

export type Ride = {
  id: string;
  riderId: string;
  driverId: string;
  fromStop: string;
  toStop: string;
  status: RideStatus;
  fare: number; // kobo (integer) = seats × SEAT_FARE_KOBO (+ priorityFee if surge)
  priorityFee: number; // kobo (integer)
  payMethod: PayMethod;
  qrToken: string;
  createdAt: number;
  seats: number; // seats this rider booked on the shared keke (1..4; 4 = charter)
};

export type Incident = {
  id: string;
  rideId?: string;
  type: string;
  severity: Severity;
  aiSeverity: Severity;
  aiSummary: string;
  location: string;
  status: string;
  createdAt: number;
};

export type Payment = {
  id: string;
  rideId: string;
  method: PayMethod;
  amount: number; // kobo (integer)
  status: string;
  ref: string;
};

export type Rating = {
  id: string;
  rideId: string;
  driverId: string;
  stars: number;
  comment?: string;
};
