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
  | "cancelled"
  | "expired"; // payment window lapsed before the rider paid (§20.1)
export type Severity = "critical" | "high" | "medium" | "info";
export type CancelledBy = "rider" | "driver" | "system";
export type PaymentStatus = "pending" | "PAID" | "failed";

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
  poolFromStop?: string; // the pickup this keke's current pool is gathering at (while seatsTaken>0)
  poolToStop?: string; // the destination this keke's current pool is heading to (while seatsTaken>0)
  poolStarted?: boolean; // true once the current pool's trip has started — no new joins (§20.10)
  lastSeenAt?: number; // epoch ms of the last online/location ping — heartbeat (§20.5)
  earningsKobo?: number; // running earnings ledger total (§20.2)
  ratingSum?: number;
  ratingCount?: number;
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
  completionPin: string; // short numeric fallback to the QR (§20.3)
  createdAt: number;
  seats: number; // seats this rider booked on the shared keke (1..4; 4 = charter)
  expiresAt?: number; // epoch ms — unpaid `assigned` hold lapses after this (§20.1)
  paymentStatus?: PaymentStatus; // set to "PAID" once payment confirmed (§20.2)
  cancelledBy?: CancelledBy; // who ended it (§20.4)
  cancelReason?: string;
  refundPending?: boolean; // driver-cancel after a paid ride with no re-match (§20.4)
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
  amount: number; // kobo (integer) — the fare this payment must cover
  status: string; // "pending" | "PAID" | Monnify status
  ref: string; // Monnify transactionReference — used by /verify + /webhook
  checkoutUrl?: string; // stored so /init is idempotent (§20.2)
};

export type Rating = {
  id: string;
  rideId: string;
  driverId: string;
  stars: number;
  comment?: string;
};

/** A driver-earnings ledger credit, written on ride completion (§20.2). */
export type Earning = {
  id: string;
  driverId: string;
  rideId: string;
  amount: number; // kobo credited to the driver for this ride
  createdAt: number;
};

/** A one-time Telegram-link nonce → uid, for the /start handshake (§20.9). */
export type TelegramLink = {
  nonce: string;
  uid: string;
  expiresAt: number; // epoch ms
};
