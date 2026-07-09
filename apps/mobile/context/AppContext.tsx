import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db, rtdb } from "../config/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, getDoc, collection, query, where } from "firebase/firestore";
import { ref, set } from "firebase/database";
import { apiRequest } from "../config/apiHelper";
import { Linking, Alert } from "react-native";

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
  category?: "ride_arriving" | "trip_complete" | "queue_update" | "security_alert" | "reward" | "service_update";
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
  status: "idle" | "searching" | "confirmed" | "tracking" | "arrived" | "completed";
  stepIndex: number; // 0: Arrived, 1: Start Trip, 2: At Dropoff, 3: Complete Trip
  rideId?: string;
  driverId?: string;
  qrToken?: string;
  paymentReference?: string;
  seats?: number;
}

interface AppContextType {
  userRole: "rider" | "driver";
  setRole: (role: "rider" | "driver") => void;
  isOnline: boolean;
  setOnline: (online: boolean) => Promise<void>;
  rideHistory: Ride[];
  notifications: AlertNotification[];
  activeTrip: TripState;
  startBooking: (pickup: string, destination: string, rideType: "keke" | "bus") => void;
  confirmBooking: (isPriority?: boolean, paymentMethod?: "naira" | "cngn", seats?: number) => Promise<void>;
  cancelBooking: () => Promise<void>;
  progressDriverTrip: () => Promise<void>;
  completeTrip: (scannedQrToken?: string) => Promise<void>;
  addNotification: (title: string, body: string, type?: "proximity" | "general", category?: AlertNotification["category"]) => void;
  clearActiveTrip: () => void;
  earnings: { daily: number; tripsCount: number; onlineTime: string };
  triggerMockIncomingRequest: () => void;
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<"rider" | "driver">("rider");
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [activeTrip, setActiveTrip] = useState<TripState>(INITIAL_TRIP_STATE);
  const [earnings, setEarnings] = useState({
    daily: 0,
    tripsCount: 0,
    onlineTime: "0h 0m",
  });

  // 1. Sync User Role Automatically from Firestore Profile
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const unsubProfile = onSnapshot(
          userRef,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setUserRole(data.userType === "driver" ? "driver" : "rider");
            }
          },
          (err) => console.error("Error reading profile:", err)
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
      (err) => console.error("Error listening to ride:", err)
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
      where("status", "in", ["assigned", "arriving", "started"])
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
          pickup: ride.fromStop === "gate" ? "FUTO Main Gate" : ride.fromStop === "seet" ? "SEET Head" : ride.fromStop === "library" ? "Main Library" : "Campus Stop",
          destination: ride.toStop === "gate" ? "FUTO Main Gate" : ride.toStop === "seet" ? "SEET Head" : ride.toStop === "library" ? "Main Library" : ride.toStop === "town" ? "Town (Owerri)" : "Campus Stop",
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
      (err) => console.error("Error listening to driver matches:", err)
    );

    return () => unsubAssignments();
  }, [userRole, isOnline]);

  // 4. Driver: Live Location posting (Firestore + Realtime Database)
  useEffect(() => {
    if (userRole !== "driver" || !isOnline) return;

    let lat = 5.387; // SEET center
    let lng = 6.998;

    const postLocation = async () => {
      // Simulate moving around campus
      lat += (Math.random() - 0.5) * 0.0003;
      lng += (Math.random() - 0.5) * 0.0003;

      try {
        // Backend Firestore write
        await apiRequest("/drivers/location", "POST", { lat, lng });

        // Direct RTDB write for client live mapping
        if (auth.currentUser) {
          const locationRef = ref(rtdb, `drivers/${auth.currentUser.uid}`);
          await set(locationRef, {
            id: auth.currentUser.uid,
            lat,
            lng,
            online: true,
            vehicleType: "keke",
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error("Error updating location:", e);
      }
    };

    postLocation();
    const interval = setInterval(postLocation, 10000);

    return () => {
      clearInterval(interval);
      if (auth.currentUser) {
        const locationRef = ref(rtdb, `drivers/${auth.currentUser.uid}`);
        set(locationRef, null).catch(err => console.error("Error clearing RTDB driver:", err));
      }
    };
  }, [userRole, isOnline]);

  const setRole = (role: "rider" | "driver") => {
    setUserRole(role);
  };

  // Driver go online/offline
  const setOnline = async (online: boolean) => {
    try {
      await apiRequest("/drivers/online", "POST", {
        online,
        lat: 5.387,
        lng: 6.998,
      });
      setIsOnline(online);
    } catch (e: any) {
      Alert.alert("Failed to change status", e.message || "Failed to update availability");
    }
  };

  const startBooking = (pickup: string, destination: string, rideType: "keke" | "bus") => {
    setActiveTrip((prev) => ({
      ...prev,
      pickup,
      destination,
      rideType,
      status: "searching",
    }));
  };

  const confirmBooking = async (
    isPriority?: boolean,
    paymentMethod?: "naira" | "cngn",
    seatsCount?: number
  ) => {
    try {
      // Map stops to IDs matching backend stops (gate, library, seet, town)
      const getStopId = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes("gate")) return "gate";
        if (lower.includes("library")) return "library";
        if (lower.includes("seet")) return "seet";
        if (lower.includes("town")) return "town";
        return "seet"; // default
      };

      const fromStop = getStopId(activeTrip.pickup);
      const toStop = getStopId(activeTrip.destination);

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
        const payRes = await apiRequest<{ checkoutUrl: string; reference: string }>("/payments/init", "POST", {
          rideId: matchRes.rideId,
        });

        // Trigger payment checkout popup in browser
        Linking.openURL(payRes.checkoutUrl);

        setActiveTrip((prev) => ({
          ...prev,
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
          rideId: matchRes.rideId,
          driverId: matchRes.driverId,
          price: matchRes.fare / 100,
          eta: `${matchRes.etaMin} mins`,
          status: "confirmed",
        }));
      }
    } catch (e: any) {
      setActiveTrip(INITIAL_TRIP_STATE);
      Alert.alert("Booking Request Failed", e.message || "No kekes are currently available.");
    }
  };

  const cancelBooking = async () => {
    if (activeTrip.rideId) {
      try {
        await apiRequest(`/rides/${activeTrip.rideId}/cancel`, "POST");
      } catch (e) {
        console.error("Cancel API error:", e);
      }
    }
    setActiveTrip(INITIAL_TRIP_STATE);
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
      await apiRequest(`/rides/${activeTrip.rideId}/status`, "POST", { status: nextStatus });
    } catch (e: any) {
      Alert.alert("Cannot Update Trip", e.message || "Failed to update trip progress.");
    }
  };

  // Rider confirms QR scan
  const completeTrip = async (scannedQrToken?: string) => {
    if (!activeTrip.rideId) return;

    try {
      const token = scannedQrToken || activeTrip.qrToken;
      if (!token) {
        throw new Error("Missing verification QR code token.");
      }

      await apiRequest(`/rides/${activeTrip.rideId}/complete`, "POST", {
        qrToken: token,
      });

      // Verify payment (best effort)
      if (activeTrip.paymentReference) {
        await apiRequest("/payments/verify", "POST", {
          reference: activeTrip.paymentReference,
        }).catch(err => console.error("Verify payment warning:", err));
      }

      setActiveTrip((prev) => ({ ...prev, status: "idle", stepIndex: 0 }));
    } catch (e: any) {
      Alert.alert("Verification Failed", e.message || "Invalid QR Code scan.");
    }
  };

  const clearActiveTrip = () => {
    setActiveTrip(INITIAL_TRIP_STATE);
  };

  const addNotification = (
    title: string,
    body: string,
    type: "proximity" | "general" = "general",
    category?: AlertNotification["category"]
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

  const triggerMockIncomingRequest = () => {
    // Left for testing UI triggers locally
  };

  return (
    <AppContext.Provider
      value={{
        userRole,
        setRole,
        isOnline,
        setOnline,
        rideHistory,
        notifications,
        activeTrip,
        startBooking,
        confirmBooking,
        cancelBooking,
        progressDriverTrip,
        completeTrip,
        addNotification,
        clearActiveTrip,
        earnings,
        triggerMockIncomingRequest,
      }}
    >
      {children}
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
