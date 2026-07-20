import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert, Linking, View, Text } from "react-native";
import { apiRequest, BASE_URL } from "../config/apiHelper";
import { auth, db } from "../config/firebaseConfig";
import { registerDevicePushToken } from "../services/notificationService";

/** A campus stop as returned by GET /stops. */
export interface CampusStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface Ride {
  id: string;
  pickup: string;
  destination: string;
  price: number;
  status: "completed" | "canceled";
  date: string;
  driverName: string;
  vehicleType: "Keke" | "Bus";
  rating?: number;
}

export interface AlertNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  type: "proximity" | "general";
  read: boolean;
  category?:
    | "ride_arriving"
    | "trip_complete"
    | "queue_update"
    | "security_alert"
    | "reward"
    | "service_update";
}

export interface TripState {
  pickup: string;
  destination: string;
  rideType: "keke" | "bus";
  price: number;
  driverName: string;
  driverRating: number;
  driverPhone: string;
  vehicleNumber: string;
  eta: string;
  status:
    | "idle"
    | "searching"
    | "confirmed"
    | "tracking"
    | "arrived"
    | "completed";
  stepIndex: number; // 0: Arrived, 1: Start Trip, 2: At Dropoff, 3: Complete Trip
  rideId?: string;
  driverId?: string;
  qrToken?: string;
  paymentReference?: string;
  seats?: number;
}

interface AppContextType {
  locationDriver: [number, number] | null;
  setLocationDriver: (location: [number, number] | null) => void;
  locationRider: [number, number] | null;
  setLocationRider: (location: [number, number] | null) => void;
  userRole: "rider" | "driver";
  setRole: (role: "rider" | "driver") => void;
  // isOnline: boolean;
  // setOnline: (online: boolean, lat?: number, lng?: number) => Promise<void>;
  rideHistory: Ride[];
  notifications: AlertNotification[];
  activeTrip: TripState;
  setActiveTrip: React.Dispatch<React.SetStateAction<TripState>>;
  bookedRequest: BookedRideResponse | null;
  setBookedRequest: (request: BookedRideResponse | null) => void;
  /** Campus stops fetched from the backend (GET /stops). */
  campusStops: CampusStop[];
  isSurgeActive: boolean;
  setIsSurgeActive: (active: boolean) => void;
  /** Map a display name to a backend stop id (e.g. "FUTO Main Gate" → "gate"). */
  getStopId: (displayName: string) => string;
  /** Map a backend stop id to a display name (e.g. "gate" → "FUTO Main Gate"). */
  getStopName: (stopId: string) => string;
  // startBooking: (pickup: string, destination: string, rideType: "keke" | "bus") => void;
  confirmBooking: (
    isPriority?: boolean,
    paymentMethod?: "naira" | "cngn",
    seats?: number,
    pickupOverride?: string,
    destinationOverride?: string,
    rideTypeOverride?: "keke" | "bus",
  ) => Promise<void>;
  cancelBooking: () => Promise<void>;
  progressDriverTrip: () => Promise<void>;
  completeTrip: (
    arg?: string | { scannedQrToken?: string; pin?: string },
  ) => Promise<void>;
  addNotification: (
    title: string,
    body: string,
    type?: "proximity" | "general",
    category?: AlertNotification["category"],
  ) => void;
  clearActiveTrip: () => void;
  earnings: { daily: number; tripsCount: number; onlineTime: string };
  fetchDriverEarnings: () => Promise<void>;
  triggerMockIncomingRequest: () => void;
  isOffline: boolean;
}

export interface BookedRideResponse {
  driverId: string | null;
  etaMin?: string;
  fare: number;
  pooled?: boolean;
  rideId: string;
  seats: number;
  seatsTaken?: number;
  stranded: boolean;
  expiresAt?: number;
}
const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_TRIP_STATE: TripState = {
  pickup: "",
  destination: "",
  rideType: "keke",
  price: 0,
  driverName: "",
  driverRating: 5.0,
  driverPhone: "",
  vehicleNumber: "",
  eta: "5 mins",
  status: "idle",
  stepIndex: 0,
};

/** Hardcoded fallback in case the /stops fetch fails on first load. */
const FALLBACK_STOPS: CampusStop[] = [
  { id: "seet", name: "SEET", lat: 5.387, lng: 6.998 },
  { id: "library", name: "Main Library", lat: 5.3875, lng: 6.9972 },
  { id: "gate", name: "Main Gate", lat: 5.3858, lng: 6.999 },
  { id: "town", name: "Town (Owerri)", lat: 5.4833, lng: 7.0333 },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userRole, setUserRole] = useState<"rider" | "driver">("rider");
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [activeTrip, setActiveTrip] = useState<TripState>(INITIAL_TRIP_STATE);
  const [campusStops, setCampusStops] = useState<CampusStop[]>(FALLBACK_STOPS);
  const [isSurgeActive, setIsSurgeActive] = useState<boolean>(false);
  const [earnings, setEarnings] = useState({
    daily: 0,
    tripsCount: 0,
    onlineTime: "0h 0m",
  });
  const [locationRider, setLocationRider] = useState<[number, number] | null>(
    null,
  );
  const [locationDriver, setLocationDriver] = useState<[number, number] | null>(
    null,
  );
  const [bookedRequest, setBookedRequest] = useState<BookedRideResponse | null>(
    null,
  );
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // ── Network Connectivity Monitor ──
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
        
        await fetch(`${BASE_URL}/stops`, {
          method: "GET",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        setIsOffline(false);
      } catch (e) {
        setIsOffline(true);
      }
    };

    // Check immediately and then every 5 seconds
    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  // ── Fetch campus stops from the backend on mount ──
  // useEffect(() => {
  //   const fetchStops = async () => {
  //     try {
  //       const res = await apiRequest<{ stops: CampusStop[] }>("/stops");
  //       console.log(res.stops, "stops")
  //       console.log(res)
  //       if (res.stops?.length) setCampusStops(res.stops);
  //       // return res
  //     } catch (e) {
  //       console.warn("Failed to fetch /stops, using fallback:", e);
  //     }
  //   };
  //   fetchStops();
  // }, []);

  /** Map a display name → backend stop id (best-effort fuzzy match). */
  const getStopId = useCallback(
    (displayName: string): string => {
      const lower = displayName.toLowerCase();
      // Try exact match first
      const exact = campusStops.find((s) => s.name.toLowerCase() === lower);
      if (exact) return exact.id;
      // Fuzzy: check if the display name contains a stop name or vice-versa
      const fuzzy = campusStops.find(
        (s) =>
          lower.includes(s.name.toLowerCase()) ||
          s.name.toLowerCase().includes(lower),
      );
      if (fuzzy) return fuzzy.id;
      // Last resort: match by id substring
      const idMatch = campusStops.find((s) => lower.includes(s.id));
      return idMatch?.id ?? campusStops[0]?.id ?? "seet";
    },
    [campusStops],
  );

  /** Map a backend stop id → display name (e.g. "gate" → "Main Gate"). */
  const getStopName = useCallback(
    (stopId: string): string => {
      const found = campusStops.find((s) => s.id === stopId);
      return found?.name ?? "Campus Stop";
    },
    [campusStops],
  );

  // 1. Sync User Role Automatically from Firestore Profile
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        registerDevicePushToken();
        const userRef = doc(db, "users", user.uid);
        const unsubProfile = onSnapshot(
          userRef,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setUserRole(data.userType === "driver" ? "driver" : "rider");
            }
          },
          (err) => console.error("Error reading profile:", err),
        );
        return () => unsubProfile();
      } else {
        setUserRole("rider");
      }
    });
    return () => unsubAuth();
  }, []);

  // 2. Rider: Listen to Active Ride Status changes
  useEffect(() => {
    if (userRole !== "rider" || !activeTrip.rideId) return;

    const rideRef = doc(db, "rides", activeTrip.rideId);
    const unsubRide = onSnapshot(
      rideRef,
      async (snap) => {
        if (!snap.exists()) return;
        const ride = snap.data();

        // Check for cancel
        if (ride.status === "cancelled") {
          setActiveTrip(INITIAL_TRIP_STATE);
          Alert.alert("Ride Cancelled", "This ride request was cancelled.");
          return;
        }

        // Map statuses: requested | assigned | arriving | started | completed | cancelled
        let mappedStatus: TripState["status"] = "searching";
        let stepIndex = 0;

        if (ride.status === "assigned") {
          mappedStatus = "confirmed";
        } else if (ride.status === "arriving") {
          mappedStatus = "tracking";
          stepIndex = 1;
        } else if (ride.status === "started") {
          mappedStatus = "arrived"; // Started means rider boarded / moving
          stepIndex = 2;
        } else if (ride.status === "completed") {
          mappedStatus = "completed";
          stepIndex = 3;

          // Push to history if completed
          const newRide: Ride = {
            id: rideDocId(activeTrip.rideId),
            pickup: activeTrip.pickup,
            destination: activeTrip.destination,
            price: ride.fare / 100,
            status: "completed",
            date: "Just now",
            driverName: activeTrip.driverName,
            vehicleType: "Keke",
          };
          setRideHistory((prev) => [newRide, ...prev]);
        }

        let driverDetails = {
          name: "Searching...",
          plate: "",
          phone: "",
          rating: 5.0,
        };

        if (ride.driverId) {
          try {
            const dSnap = await getDoc(doc(db, "drivers", ride.driverId));
            if (dSnap.exists()) {
              const d = dSnap.data();
              driverDetails = {
                name: d.fullName || d.name || "Driver",
                plate: d.plate || "KEKE-GO",
                phone: d.phone || "080",
                rating: typeof d.rating === "number" ? d.rating : 5.0,
              };
            }
          } catch (e) {
            console.error("Error loading driver details:", e);
          }
        }

        setActiveTrip((prev) => ({
          ...prev,
          status: mappedStatus,
          stepIndex,
          driverName: driverDetails.name,
          driverRating: driverDetails.rating,
          driverPhone: driverDetails.phone,
          vehicleNumber: driverDetails.plate,
          qrToken: ride.qrToken,
          price: ride.fare / 100,
        }));
      },
      (err) => console.error("Error listening to ride:", err),
    );

    return () => unsubRide();
  }, [userRole, activeTrip.rideId]);

  // Helper helper to avoid TypeScript errors on activeTrip.rideId fallback
  const rideDocId = (id?: string) => id || "ride";

  // 3. Driver: Query active assignments in real-time
  useEffect(() => {
    if (userRole !== "driver" || !isOnline) return;

    const q = query(
      collection(db, "rides"),
      where("driverId", "==", auth.currentUser?.uid),
      where("status", "in", ["assigned", "arriving", "started"]),
    );

    const unsubAssignments = onSnapshot(
      q,
      async (snap) => {
        if (snap.empty) {
          setActiveTrip((prev) => {
            if (prev.status !== "idle") return INITIAL_TRIP_STATE;
            return prev;
          });
          return;
        }

        const rideDoc = snap.docs[0];
        const ride = rideDoc.data();
        const rideId = rideDoc.id;

        // Fetch rider name & details
        let riderName = "Student Passenger";
        let riderPhone = "";
        try {
          const rSnap = await getDoc(doc(db, "users", ride.riderId));
          if (rSnap.exists()) {
            const r = rSnap.data();
            riderName = r.fullName || r.name || "Student Passenger";
            riderPhone = r.phone || "";
          }
        } catch (e) {
          console.error("Error fetching rider info:", e);
        }

        let driverStatus: TripState["status"] = "searching";
        let stepIndex = 0;

        if (ride.status === "arriving") {
          driverStatus = "tracking";
          stepIndex = 1;
        } else if (ride.status === "started") {
          driverStatus = "arrived";
          stepIndex = 2;
        }

        setActiveTrip({
          pickup: getStopName(ride.fromStop),
          destination: getStopName(ride.toStop),
          rideType: "keke",
          price: ride.fare / 100,
          driverName: riderName, //Passenger Name
          driverRating: 4.8,
          driverPhone: riderPhone,
          vehicleNumber: `Seats booked: ${ride.seats || 1}`,
          eta: "ETA ~3 min",
          status: driverStatus,
          stepIndex,
          rideId,
          driverId: ride.driverId,
          qrToken: ride.qrToken,
        });
      },
      (err) => console.error("Error listening to driver matches:", err),
    );

    return () => unsubAssignments();
  }, [userRole, isOnline]);

  // 4. Driver: Live Location posting (Firestore + Realtime Database)
  // useEffect(() => {
  //   if (userRole !== "driver" || !isOnline) return;

  //   let lat = 5.387; // SEET center
  //   let lng = 6.998;

  //   const postLocation = async () => {
  //     // Simulate moving around campus
  //     lat += (Math.random() - 0.5) * 0.0003;
  //     lng += (Math.random() - 0.5) * 0.0003;

  //     try {
  //       // Backend Firestore write
  //       await apiRequest("/drivers/location", "POST", { lat, lng });
  //       }
  //     catch (e) {
  //       console.error("Error updating location:", e);
  //     }
  //   };

  //   postLocation();
  //   const interval = setInterval(postLocation, 10000);

  //   return () => {
  //     clearInterval(interval);
  //     if (auth.currentUser) {
  //       const locationRef = ref(rtdb, `drivers/${auth.currentUser.uid}`);
  //       set(locationRef, null).catch(err => console.error("Error clearing RTDB driver:", err));
  //     }
  //   };
  // }, [userRole, isOnline]);

  const setRole = (role: "rider" | "driver") => {
    setUserRole(role);
  };
  const confirmBooking = async (
    isPriority?: boolean,
    paymentMethod?: "naira" | "cngn",
    seatsCount?: number,
    pickupOverride?: string,
    destinationOverride?: string,
    rideTypeOverride?: "keke" | "bus",
  ) => {
    try {
      const actualPickup = pickupOverride || activeTrip.pickup;
      const actualDestination = destinationOverride || activeTrip.destination;
      const actualRideType = rideTypeOverride || activeTrip.rideType;

      const fromStop = getStopId(actualPickup);
      const toStop = getStopId(actualDestination);

      const requestBody = {
        fromStop,
        toStop,
        payMethod: paymentMethod || "naira",
        seats: seatsCount || 1,
        priorityFee: isPriority ? 10000 : undefined, // ₦100 Priority fee = 10000 kobo
      };

      const matchRes = await apiRequest<{
        rideId: string;
        driverId: string;
        etaMin: number;
        fare: number;
        seats: number;
        pooled: boolean;
      }>("/rides", "POST", requestBody);

      if (paymentMethod === "naira") {
        // Init payment transaction
        const payRes = await apiRequest<{
          checkoutUrl: string;
          reference: string;
        }>("/payments/init", "POST", {
          rideId: matchRes.rideId,
        });

        // Trigger payment checkout popup in browser
        Linking.openURL(payRes.checkoutUrl);

        setActiveTrip((prev) => ({
          ...prev,
          pickup: actualPickup,
          destination: actualDestination,
          rideType: actualRideType,
          rideId: matchRes.rideId,
          driverId: matchRes.driverId,
          price: matchRes.fare / 100,
          paymentReference: payRes.reference,
          eta: `${matchRes.etaMin} mins`,
          status: "confirmed",
        }));
      } else {
        setActiveTrip((prev) => ({
          ...prev,
          pickup: actualPickup,
          destination: actualDestination,
          rideType: actualRideType,
          rideId: matchRes.rideId,
          driverId: matchRes.driverId,
          price: matchRes.fare / 100,
          eta: `${matchRes.etaMin} mins`,
          status: "confirmed",
        }));
      }
    } catch (e: any) {
      setActiveTrip(INITIAL_TRIP_STATE);
      Alert.alert(
        "Booking Request Failed",
        e.message || "No kekes are currently available.",
      );
      throw e;
    }
  };

  const cancelBooking = async () => {
    const rideId = activeTrip.rideId || bookedRequest?.rideId;
    if (rideId) {
      try {
        await apiRequest(`/rides/${rideId}/cancel`, "POST");
      } catch (e) {
        console.error("Cancel API error:", e);
        throw e;
      }
    }
    setActiveTrip(INITIAL_TRIP_STATE);
    setBookedRequest(null);
  };

  // Driver moves trip: assigned -> arriving -> started
  const progressDriverTrip = async () => {
    if (!activeTrip.rideId) return;

    let nextStatus: "arriving" | "started" = "arriving";
    if (activeTrip.status === "searching") {
      nextStatus = "arriving";
    } else if (activeTrip.status === "tracking") {
      nextStatus = "started";
    } else {
      return;
    }

    try {
      await apiRequest(`/rides/${activeTrip.rideId}/status`, "POST", {
        status: nextStatus,
      });
    } catch (e: any) {
      Alert.alert(
        "Cannot Update Trip",
        e.message || "Failed to update trip progress.",
      );
    }
  };

  // Rider confirms QR scan or PIN
  const completeTrip = async (
    arg?: string | { scannedQrToken?: string; pin?: string },
  ) => {
    if (!activeTrip.rideId) return;

    try {
      let token: string | undefined;
      let pin: string | undefined;

      if (typeof arg === "string") {
        token = arg;
      } else if (arg && typeof arg === "object") {
        token = arg.scannedQrToken;
        pin = arg.pin;
      }

      if (!token && !pin) {
        token = activeTrip.qrToken;
      }

      const requestBody: any = {};
      if (pin) {
        requestBody.pin = pin;
      } else if (token) {
        requestBody.qrToken = token;
      } else {
        throw new Error("Missing verification QR code token or PIN.");
      }

      await apiRequest(
        `/rides/${activeTrip.rideId}/complete`,
        "POST",
        requestBody,
      );

      fetchDriverEarnings().catch(() => undefined);

      // Verify payment (best effort)
      if (activeTrip.paymentReference) {
        await apiRequest("/payments/verify", "POST", {
          reference: activeTrip.paymentReference,
        }).catch((err) => console.error("Verify payment warning:", err));
      }

      setActiveTrip((prev) => ({ ...prev, status: "idle", stepIndex: 0 }));
    } catch (e: any) {
      Alert.alert(
        "Verification Failed",
        e.message || "Invalid QR Code scan or PIN.",
      );
      throw e;
    }
  };

  const clearActiveTrip = () => {
    setActiveTrip(INITIAL_TRIP_STATE);
  };

  const addNotification = (
    title: string,
    body: string,
    type: "proximity" | "general" = "general",
    category?: AlertNotification["category"],
  ) => {
    const newNotif: AlertNotification = {
      id: `notif-${Math.random().toString(36).substring(2, 9)}`,
      title,
      body,
      timestamp: "Just now",
      type,
      read: false,
      category,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const fetchDriverEarnings = useCallback(async () => {
    try {
      const res = await apiRequest<{ totalKobo: number; recent: any[] }>("/drivers/me/earnings");
    
      setEarnings({
        daily: res.totalKobo / 100,
        tripsCount: res.recent?.length ?? 0,
        onlineTime: "0h 0m",
      });
    } catch (e) {
      console.warn("Failed to fetch driver earnings:", e);
    }
  }, []);

  useEffect(() => {
    if (userRole === "driver" && auth.currentUser) {
      fetchDriverEarnings();
    }
  }, [userRole, fetchDriverEarnings]);

  const triggerMockIncomingRequest = () => {
    // Left for testing UI triggers locally
  };

  return (
    <AppContext.Provider
      value={{
        userRole,
        locationDriver,
        setLocationDriver,
        locationRider,
        setLocationRider,
        setRole,
        // isOnline,
        // setOnline,
        rideHistory,
        notifications,
        activeTrip,
        setActiveTrip,
        bookedRequest,
        setBookedRequest,
        campusStops,
        isSurgeActive,
        setIsSurgeActive,
        getStopId,
        getStopName,
        // startBooking,
        confirmBooking,
        cancelBooking,
        progressDriverTrip,
        completeTrip,
        addNotification,
        clearActiveTrip,
        earnings,
        fetchDriverEarnings,
        triggerMockIncomingRequest,
        isOffline,
      }}
    >
      {children}
      {isOffline && (
        <View
          style={{
            position: "absolute",
            top: 50,
            left: 20,
            right: 20,
            backgroundColor: "#dc2626",
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            elevation: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
          }}
          pointerEvents="none"
        >
          <Text
            style={{
              color: "#ffffff",
              fontWeight: "700",
              fontFamily: "Plus Jakarta Sans",
              fontSize: 12,
            }}
          >
            No Connection / Server Unreachable
          </Text>
        </View>
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
