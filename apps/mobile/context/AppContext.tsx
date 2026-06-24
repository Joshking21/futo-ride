import React, { createContext, useContext, useState, useEffect } from "react";

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
}

interface AppContextType {
  userRole: "rider" | "driver";
  setRole: (role: "rider" | "driver") => void;
  isOnline: boolean;
  setOnline: (online: boolean) => void;
  rideHistory: Ride[];
  notifications: AlertNotification[];
  activeTrip: TripState;
  startBooking: (pickup: string, destination: string, rideType: "keke" | "bus") => void;
  confirmBooking: () => void;
  cancelBooking: () => void;
  progressDriverTrip: () => void;
  completeTrip: () => void;
  addNotification: (title: string, body: string, type?: "proximity" | "general") => void;
  clearActiveTrip: () => void;
  earnings: { daily: number; tripsCount: number; onlineTime: string };
  triggerMockIncomingRequest: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_RIDES: Ride[] = [
  {
    id: "ride-1",
    pickup: "FUTO Main Gate",
    destination: "SEET Head",
    price: 300,
    status: "completed",
    date: "Today, 10:24 AM",
    driverName: "Obinna",
    vehicleType: "Keke",
    rating: 5,
  },
  {
    id: "ride-2",
    pickup: "Senate Building",
    destination: "Hall C",
    price: 150,
    status: "completed",
    date: "Yesterday, 4:15 PM",
    driverName: "Chinedu",
    vehicleType: "Bus",
    rating: 4,
  },
  {
    id: "ride-3",
    pickup: "SOSC Extension",
    destination: "SOES Building",
    price: 300,
    status: "canceled",
    date: "June 20, 2:30 PM",
    driverName: "Emeka",
    vehicleType: "Keke",
  },
];

const INITIAL_NOTIFICATIONS: AlertNotification[] = [
  {
    id: "notif-1",
    title: "Proximity Alert",
    body: "Your Keke driver Obinna is just 2 minutes away! Wait near SEET Head roundabout.",
    timestamp: "2 hours ago",
    type: "proximity",
    read: false,
  },
  {
    id: "notif-2",
    title: "System Update",
    body: "New safety updates installed. Always verify driver identity before riding.",
    timestamp: "1 day ago",
    type: "general",
    read: true,
  },
];

const INITIAL_TRIP_STATE: TripState = {
  pickup: "",
  destination: "",
  rideType: "keke",
  price: 0,
  driverName: "Obinna",
  driverRating: 4.8,
  driverPhone: "0803 456 7890",
  vehicleNumber: "FUTO-KK-842",
  eta: "5 mins",
  status: "idle",
  stepIndex: 0,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<"rider" | "driver">("rider");
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [rideHistory, setRideHistory] = useState<Ride[]>(INITIAL_RIDES);
  const [notifications, setNotifications] = useState<AlertNotification[]>(INITIAL_NOTIFICATIONS);
  const [activeTrip, setActiveTrip] = useState<TripState>(INITIAL_TRIP_STATE);
  const [earnings, setEarnings] = useState({
    daily: 12500,
    tripsCount: 14,
    onlineTime: "4h 20m",
  });

  const setRole = (role: "rider" | "driver") => {
    setUserRole(role);
  };

  const setOnline = (online: boolean) => {
    setIsOnline(online);
  };

  const startBooking = (pickup: string, destination: string, rideType: "keke" | "bus") => {
    const calculatedPrice = rideType === "keke" ? 300 : 150;
    setActiveTrip((prev) => ({
      ...prev,
      pickup,
      destination,
      rideType,
      price: calculatedPrice,
      status: "searching",
    }));
  };

  const confirmBooking = () => {
    setActiveTrip((prev) => ({
      ...prev,
      status: "confirmed",
    }));

    // Trigger mock state updates to simulate tracking and arrival for Rider
    setTimeout(() => {
      setActiveTrip((prev) => ({ ...prev, status: "tracking", eta: "3 mins" }));
      addNotification("Driver Confirmed", "Driver Obinna is on his way to pick you up.", "proximity");
    }, 4000);

    setTimeout(() => {
      setActiveTrip((prev) => ({ ...prev, status: "arrived", eta: "Arrived" }));
      addNotification("Driver Arrived", "Your driver has arrived at the pickup location.", "proximity");
    }, 9000);
  };

  const cancelBooking = () => {
    setActiveTrip((prev) => ({
      ...prev,
      status: "idle",
      stepIndex: 0,
    }));
  };

  const progressDriverTrip = () => {
    setActiveTrip((prev) => {
      const nextIndex = prev.stepIndex + 1;
      let nextStatus = prev.status;
      if (nextIndex === 1) {
        nextStatus = "tracking"; // Trip started
      } else if (nextIndex === 2) {
        nextStatus = "arrived"; // At dropoff
      } else if (nextIndex === 3) {
        nextStatus = "completed"; // Trip complete
      }

      return {
        ...prev,
        stepIndex: nextIndex > 3 ? 0 : nextIndex,
        status: nextIndex > 3 ? "idle" : nextStatus,
      };
    });
  };

  const completeTrip = () => {
    // Save to history
    const newRide: Ride = {
      id: `ride-${Math.random().toString(36).substring(2, 9)}`,
      pickup: activeTrip.pickup || "SOES Building",
      destination: activeTrip.destination || "Senate Building",
      price: activeTrip.price || 300,
      status: "completed",
      date: "Just now",
      driverName: activeTrip.driverName,
      vehicleType: activeTrip.rideType === "keke" ? "Keke" : "Bus",
      rating: 5,
    };

    setRideHistory((prev) => [newRide, ...prev]);

    // Update driver earnings if role is driver
    if (userRole === "driver") {
      setEarnings((prev) => ({
        daily: prev.daily + (activeTrip.price || 300),
        tripsCount: prev.tripsCount + 1,
        onlineTime: prev.onlineTime,
      }));
    }

    setActiveTrip((prev) => ({
      ...prev,
      status: "idle",
      stepIndex: 0,
    }));
  };

  const clearActiveTrip = () => {
    setActiveTrip((prev) => ({
      ...prev,
      status: "idle",
      stepIndex: 0,
    }));
  };

  const addNotification = (title: string, body: string, type: "proximity" | "general" = "general") => {
    const newNotif: AlertNotification = {
      id: `notif-${Math.random().toString(36).substring(2, 9)}`,
      title,
      body,
      timestamp: "Just now",
      type,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const triggerMockIncomingRequest = () => {
    setActiveTrip({
      pickup: "SOES Building",
      destination: "Senate Building",
      rideType: "keke",
      price: 300,
      driverName: "Alex", // For driver role, passenger is Alex
      driverRating: 4.9,
      driverPhone: "0812 345 6789",
      vehicleNumber: "FUTO-KK-842",
      eta: "Pickup in 4 mins",
      status: "searching", // Searching state means pending acceptance for Driver
      stepIndex: 0,
    });
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
