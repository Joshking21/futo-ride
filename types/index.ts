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
  fare: number;
  priorityFee: number;
  payMethod: PayMethod;
  qrToken: string;
  createdAt: number;
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
  amount: number;
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
