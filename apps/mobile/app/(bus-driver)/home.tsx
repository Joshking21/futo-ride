import { apiRequest } from "@/config/apiHelper";
import { auth } from "@/config/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import {
  Bell,
  Check,
  Compass,
  MapPin,
  Navigation,
  Plus,
  Power,
  Route,
  Trash2,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BusIcon from "../../components/BusIcon";

interface RouteItem {
  id: string;
  name: string;
  isCustom?: boolean;
}

const DEFAULT_ROUTES: RouteItem[] = [
  { id: "town-a", name: "Campus → Town" },
];

export default function BusDriverHome() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [routesList, setRoutesList] = useState<RouteItem[]>(DEFAULT_ROUTES);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("town-a");
  const [customRouteInput, setCustomRouteInput] = useState("");
  const [lastPingTime, setLastPingTime] = useState<string | null>(null);
  const [latLngDisplay, setLatLngDisplay] = useState<string | null>(null);

  const consecutiveFailuresRef = useRef(0);
  const maxConsecutiveFailures = 3;

  const driverName = auth.currentUser?.displayName || "Abubakar Usman";
  const driverEmail = auth.currentUser?.email || "abubakar.usman@gmail.com";
  const vehicleNumber = "BUS-" + driverEmail.slice(0, 4).toUpperCase();

  // Load custom routes and selection state on mount
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const storedRoutes = await AsyncStorage.getItem("bus_custom_routes");
        if (storedRoutes) {
          const parsed: RouteItem[] = JSON.parse(storedRoutes);
          // Combine defaults and parsed custom routes
          setRoutesList([...DEFAULT_ROUTES, ...parsed]);
        }
        
        const storedSelected = await AsyncStorage.getItem("bus_selected_route_id");
        if (storedSelected) {
          setSelectedRouteId(storedSelected);
        }
      } catch (e) {
        console.warn("Failed to load routes from storage:", e);
      }
    };
    loadRoutes();
  }, []);

  // Sync selected route to storage
  const handleSelectRoute = async (id: string) => {
    setSelectedRouteId(id);
    try {
      await AsyncStorage.setItem("bus_selected_route_id", id);
    } catch (e) {
      console.warn("Failed to save selected route:", e);
    }
  };

  // Add custom route
  const handleAddRoute = async () => {
    const trimmed = customRouteInput.trim();
    if (!trimmed) return;
    
    // Check for duplicate names
    if (routesList.some(r => r.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert("Route Exists", "This route is already in your list.");
      return;
    }

    const newRoute: RouteItem = {
      id: "custom-" + Date.now(),
      name: trimmed,
      isCustom: true,
    };

    const updatedList = [...routesList, newRoute];
    setRoutesList(updatedList);
    setCustomRouteInput("");

    try {
      const customOnly = updatedList.filter(r => r.isCustom);
      await AsyncStorage.setItem("bus_custom_routes", JSON.stringify(customOnly));
    } catch (e) {
      console.warn("Failed to save custom routes:", e);
    }
  };

  // Delete custom route
  const handleDeleteRoute = async (id: string) => {
    if (id === "town-a") return; // Keep default

    const updatedList = routesList.filter(r => r.id !== id);
    setRoutesList(updatedList);

    // Reset selection if deleted route was selected
    if (selectedRouteId === id) {
      handleSelectRoute("town-a");
    }

    try {
      const customOnly = updatedList.filter(r => r.isCustom);
      await AsyncStorage.setItem("bus_custom_routes", JSON.stringify(customOnly));
    } catch (e) {
      console.warn("Failed to save custom routes after delete:", e);
    }
  };

  // Automated location update loop
  useEffect(() => {
    if (isActive) {
      consecutiveFailuresRef.current = 0;

      const updateLocation = async () => {
        try {
          // 1. Get position
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          const { latitude, longitude } = loc.coords;
          setLatLngDisplay(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);

          // 2. Call API. Custom routes use "town-a" for backend compatibility
          const apiRouteId = selectedRouteId.startsWith("custom-") ? "town-a" : selectedRouteId;

          try {
            await apiRequest("/buses/location", "POST", {
              routeId: apiRouteId,
              lat: latitude,
              lng: longitude,
            });
            consecutiveFailuresRef.current = 0;
            setLastPingTime(new Date().toLocaleTimeString());
          } catch (apiError: any) {
            // Auto register if required
            if (
              apiError.message?.includes("Register as a bus driver first") ||
              apiError.status === 403
            ) {
              const name = auth.currentUser?.displayName || "Bus Partner";
              const plate = "BUS-" + Math.floor(1000 + Math.random() * 9000);
              
              await apiRequest("/buses/register", "POST", {
                name,
                plate,
                routeId: apiRouteId,
              });

              // Retry post
              await apiRequest("/buses/location", "POST", {
                routeId: apiRouteId,
                lat: latitude,
                lng: longitude,
              });
              
              consecutiveFailuresRef.current = 0;
              setLastPingTime(new Date().toLocaleTimeString());
            } else {
              throw apiError;
            }
          }
        } catch (error: any) {
          consecutiveFailuresRef.current += 1;
          console.warn(
            `Bus location update failed (${consecutiveFailuresRef.current}/${maxConsecutiveFailures}):`,
            error.message
          );

          if (consecutiveFailuresRef.current >= maxConsecutiveFailures) {
            Alert.alert(
              "Connection Interrupted",
              "Lost contact with the servers. Tracking has been paused. Please toggle back online.",
              [{ text: "OK" }]
            );
            setIsActive(false);
          }
        }
      };

      // Run once immediately
      updateLocation();
      const interval = setInterval(updateLocation, 5000);
      return () => clearInterval(interval);
    }
  }, [isActive, selectedRouteId]);

  // Handle toggling online/active status
  const handleToggleActive = async () => {
    if (isLoading) return;
    setIsLoading(true);

    const nextActive = !isActive;

    if (nextActive) {
      // Validate route selection
      if (!selectedRouteId) {
        Alert.alert("Route Required", "Please select a transit route before going active.");
        setIsLoading(false);
        return;
      }

      try {
        let { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted" && canAskAgain) {
          const response = await Location.requestForegroundPermissionsAsync();
          status = response.status;
        }

        if (status !== "granted") {
          Alert.alert(
            "Location Permission Needed",
            "Futo Ride needs location access to ping your bus coordinates while active. Please allow it in settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Settings", onPress: () => Linking.openSettings() },
            ]
          );
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Failed checking location permissions:", e);
      }
    }

    setIsActive(nextActive);
    setIsLoading(false);
  };

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const selectedRouteObj = routesList.find(r => r.id === selectedRouteId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9ff" }} edges={["top"]}>
      {/* Header Greeting */}
      <View className="flex-row items-center justify-between px-margin-mobile h-[72px] bg-transparent">
        <View className="flex-row items-center gap-3">
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKv18St18L7X2vZAAMPrAWpe_RTK8EptXVp0FFMqsUDuP_GgeffQiG2BXUbeBK5fAppU3V1r1xiIbGeVUoaoTLduIBmWdC2WEHiVaf2hilbRU54kKuZ7O6ukr9iC-soO0wPXucYYRHL1OQTZr0q7bDRr1TZqfKpkpL290p2tVDrufDqbY7kxXIdHRNxOex755J1_4AtLe8z7qbpg1umUVPxW4tt5r_i6df9PbNJdOf5PFxcsnG6bDlUgGoGZnLt0vZSzW4H3KHhOMD",
            }}
            className="w-11 h-11 rounded-full border border-slate-200"
          />
          <View>
            <Text className="text-on-surface font-bold font-jakarta text-[15px] leading-tight">
              Good day, {driverName.split(" ")[0]}!
            </Text>
            <Text className="text-secondary text-2xs font-jakarta mt-0.5">
              Shuttle Bus • {vehicleNumber}
            </Text>
          </View>
        </View>

        <Pressable className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-outline-variant/10 shadow-xs relative">
          <Bell color="#0B1C30" size={20} />
          <View className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-primary border border-white" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}
        style={{ flexGrow: 1, marginTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Tracking Toggle Card */}
        <View className="bg-white rounded-3xl p-5 border border-outline-variant/5 shadow-sm flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-secondary text-xs font-medium font-jakarta">
              Pinging Status
            </Text>
            <Text
              className={`text-headline-md font-bold font-jakarta mt-1 ${
                isActive ? "text-primary" : "text-secondary"
              }`}
            >
              {isActive ? "ACTIVE & LIVE" : "INACTIVE"}
            </Text>
            <Text className="text-secondary text-2xs font-jakarta mt-1 leading-4">
              {isActive
                ? "Your live location is pinging to riders. Keep the app open."
                : "Toggle active mode to let students track your shuttle."}
            </Text>
          </View>

          <View className="items-center">
            <Pressable
              onPress={handleToggleActive}
              disabled={isLoading}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: isActive ? "#059669" : "#eff3ff",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: isActive ? 0 : 1,
                borderColor: "rgba(197, 197, 216, 0.2)",
              }}
              className="shadow-sm active:scale-95"
            >
              {isLoading ? (
                <ActivityIndicator color={isActive ? "#ffffff" : "#059669"} size="small" />
              ) : (
                <Power color={isActive ? "#ffffff" : "#059669"} size={26} strokeWidth={2.5} />
              )}
            </Pressable>
          </View>
        </View>

        {/* Live Location Stats Indicator */}
        {isActive && (
          <View className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-5 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center">
                <Navigation color="#059669" size={20} />
              </View>
              <View>
                <Text className="text-[#059669] font-bold font-jakarta text-xs">
                  Live Location Broadcast
                </Text>
                <Text className="text-secondary text-2xs font-jakarta mt-0.5">
                  Coords: {latLngDisplay || "Updating..."}
                </Text>
              </View>
            </View>
            <View className="align-end">
              <Text className="text-[#059669] font-bold font-jakarta text-[10px] text-right">
                Pinging OK
              </Text>
              <Text className="text-secondary text-[9px] font-jakarta mt-0.5 text-right">
                Last: {lastPingTime || "Pending"}
              </Text>
            </View>
          </View>
        )}

        {/* Map / Illustration Box */}
        <View className="rounded-3xl border border-outline-variant/5 overflow-hidden shadow-sm bg-white position-relative h-44">
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuD0okzKR0KPq91lUrgoEl5fyfMy1B5eqVhArkpdos9nGZDnDI-ks7j4edISnFdnY4EKDclvfu-tXw48XWwCwLTHkiWgUdTJPzw0-Wbjb64syVe-qicEEPGdmkI1X7mJoq5k_B3J8K-Wlt3yAZ33Dzy6Q9HBEh9IjQITFz8IxurvIKiiZPmecWT2IRE_rFhmA4LK39TpJEwR6einizhW-wxyX5mP-M4C_rzF5V9nyd4VRIX-5fdOl05wnH6PWCU_MI8wXXgOBBcGS5kv",
            }}
            className="w-full h-full object-cover"
          />

          {/* Bus Location Indicator */}
          <View className="absolute top-[50%] left-[50%] ml-[-32px] mt-[-32px] items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center absolute" />
            <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center absolute" />
            <View className="w-5 h-5 rounded-full bg-primary border-2 border-white absolute z-10 shadow-sm" />
            {/* Pulsating animation representation */}
            <View className="z-20 mt-[-24px]">
              <BusIcon size={26} color="#eab308" />
            </View>
          </View>

          {/* Floating actions */}
          <Pressable className="w-9 h-9 rounded-full bg-white border border-outline-variant/10 shadow-xs items-center justify-center absolute bottom-4 right-4">
            <Compass color="#059669" size={16} />
          </Pressable>
        </View>

        {/* Route Management Section */}
        <View className="bg-white rounded-3xl p-5 border border-outline-variant/5 shadow-sm gap-4">
          <View className="flex-row items-center gap-2">
            <Route color="#059669" size={20} />
            <Text className="text-on-surface font-bold font-jakarta text-[15px]">
              Select Active Route
            </Text>
          </View>

          {/* Add Route Input */}
          <View className="flex-row gap-2">
            <TextInput
              placeholder="e.g. Hostel ⇄ Lecture Hall"
              placeholderTextColor="#cbd5e1"
              value={customRouteInput}
              onChangeText={setCustomRouteInput}
              className="flex-1 bg-surface-container border border-outline-variant/10 rounded-xl px-3.5 py-2.5 text-on-surface text-body-sm font-jakarta"
            />
            <Pressable
              onPress={handleAddRoute}
              className="bg-primary px-4 rounded-xl items-center justify-center shadow-xs active:bg-primary/95"
            >
              <Plus color="#ffffff" size={20} />
            </Pressable>
          </View>

          {/* Routes list */}
          <View className="gap-2.5 mt-2">
            {routesList.map((route) => {
              const isSelected = selectedRouteId === route.id;
              return (
                <View
                  key={route.id}
                  className={`flex-row items-center justify-between p-3 rounded-2xl border ${
                    isSelected
                      ? "bg-[#f0fdf4] border-primary/20"
                      : "bg-surface-bright border-outline-variant/10"
                  }`}
                >
                  <Pressable
                    onPress={() => handleSelectRoute(route.id)}
                    className="flex-1 flex-row items-center gap-3 pr-2"
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: isSelected ? "#059669" : "#cbd5e1",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isSelected && (
                        <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </View>
                    <Text
                      className={`font-jakarta text-body-sm ${
                        isSelected ? "text-primary font-bold" : "text-on-surface"
                      }`}
                    >
                      {route.name}
                    </Text>
                  </Pressable>

                  {/* Option to delete custom routes */}
                  {route.isCustom && (
                    <Pressable
                      onPress={() => handleDeleteRoute(route.id)}
                      className="p-1.5 active:bg-slate-200 rounded-lg"
                    >
                      <Trash2 color="#ba1a1a" size={16} />
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
