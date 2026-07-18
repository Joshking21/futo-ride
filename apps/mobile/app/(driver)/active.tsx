import { useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import {
  ArrowLeft,
  Check,
  Compass,
  GraduationCap,
  Landmark,
  MessageSquare,
  Phone,
  Shield,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KekeIcon from "../../components/KekeIcon";
import { apiRequest } from "../../config/apiHelper";
import { db } from "../../config/firebaseConfig";
import { useApp } from "../../context/AppContext";

export default function DriverActiveTrip() {
  const router = useRouter();
  const { activeTrip, setActiveTrip, cancelBooking } = useApp();
  const [rideData, setRideData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Subscribe to ride details in real-time from Firestore
  useEffect(() => {
    if (!activeTrip.rideId) return;

    // For mock rides (no Firestore document), build rideData from activeTrip context once
    const isMockRide = activeTrip.rideId.startsWith("mock-");
    if (isMockRide) {
      if (!rideData) {
        setRideData({
          fromStop: activeTrip.pickup,
          toStop: activeTrip.destination,
          seats: activeTrip.seats || 1,
          fare: activeTrip.fare || 300,
          status: "assigned",
          rideId: activeTrip.rideId,
        });
      }
      return;
    }

    const rideRef = doc(db, "rides", activeTrip.rideId);
    const unsub = onSnapshot(
      rideRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setRideData(data);

          // Map backend statuses to matching context activeTrip statuses
          let mappedStatus: typeof activeTrip.status = activeTrip.status;
          if (data.status === "requested") {
            mappedStatus = "searching";
          } else if (data.status === "assigned") {
            mappedStatus = "confirmed";
          } else if (data.status === "arriving") {
            mappedStatus = "tracking";
          } else if (data.status === "started") {
            mappedStatus = "arrived";
          } else if (
            data.status === "cancelled" ||
            data.status === "completed"
          ) {
            mappedStatus = "idle";
          }

          if (mappedStatus !== activeTrip.status) {
            setActiveTrip((prev) => ({
              ...prev,
              status: mappedStatus,
            }));
          }
        }
      },
      (err) => console.error("Error listening to ride status:", err),
    );

    return () => unsub();
  }, [activeTrip.rideId, setActiveTrip, activeTrip.status]);

  // Handle auto-routing when trip is cancelled on the database
  useEffect(() => {
    if (rideData) {
      if (rideData.status === "cancelled") {
        Alert.alert(
          "Trip Cancelled",
          "This ride was cancelled by the passenger.",
        );
        router.replace("/(driver)/home");
      }
    }
  }, [rideData, router]);

  const handleTripAction = async () => {
    if (!activeTrip.rideId || !rideData) return;

    const isMockRide = activeTrip.rideId.startsWith("mock-");

    setSubmitting(true);
    try {
      if (rideData.status === "assigned") {
        if (isMockRide) {
          setRideData((prev: any) => ({ ...prev, status: "arriving" }));
          setActiveTrip((prev) => ({ ...prev, status: "tracking" }));
        } else {
          await apiRequest(`/rides/${activeTrip.rideId}/status`, "POST", {
            status: "arriving",
          });
        }
      } else if (rideData.status === "arriving") {
        if (isMockRide) {
          setRideData((prev: any) => ({ ...prev, status: "started" }));
          setActiveTrip((prev) => ({ ...prev, status: "arrived" }));
        } else {
          await apiRequest(`/rides/${activeTrip.rideId}/status`, "POST", {
            status: "started",
          });
        }
      } else if (rideData.status === "started") {
        // Route to the QR page
        router.push("/(driver)/qr");
      }
    } catch (err: any) {
      Alert.alert(
        "Operation Failed",
        err.message || "Could not update trip status.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelTrip = () => {
    Alert.alert("Cancel Trip", "Are you sure you want to cancel this trip?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          setSubmitting(true);
          try {
            await cancelBooking();
            router.replace("/(driver)/home");
          } catch (err: any) {
            Alert.alert(
              "Cancellation Failed",
              err.message || "Failed to cancel trip.",
            );
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  const getButtonText = () => {
    if (!rideData) return "Loading...";
    if (rideData.status === "requested") return "Waiting for Payment...";
    if (rideData.status === "assigned") return "Start Heading to Pickup";
    if (rideData.status === "arriving") return "I've Arrived at Pickup";
    return "Complete Trip (Show QR)";
  };

  const getStatusTitle = () => {
    if (!rideData) return "Loading...";
    if (rideData.status === "requested") return "Requested";
    if (rideData.status === "assigned") return "Assigned";
    if (rideData.status === "arriving") return "Heading to Pickup";
    return "Heading to Dropoff";
  };

  const getStatusBadge = () => {
    return (
      <View className="bg-[#e6f9ed] px-2.5 py-0.5 rounded-full flex-row items-center gap-1 mt-1 self-center">
        <View className="w-1.5 h-1.5 bg-[#22c55e] rounded-full" />
        <Text className="text-[#22c55e] text-[10px] font-bold font-jakarta">
          Trip in progress
        </Text>
      </View>
    );
  };

  // Helper to render Stepper Nodes
  const renderStepNode = (step: number, label: string) => {
    let state: "active" | "completed" | "inactive" = "inactive";

    const currentStep =
      activeTrip.status === "searching" || activeTrip.status === "confirmed"
        ? 1
        : activeTrip.status === "tracking"
          ? 2
          : activeTrip.status === "arrived"
            ? 3
            : 1;

    if (step === currentStep) {
      state = "active";
    } else if (step < currentStep) {
      state = "completed";
    } else {
      state = "inactive";
    }

    return (
      <View className="items-center z-10">
        {state === "active" ? (
          <View className="w-6 h-6 rounded-full border-2 border-[#059669] items-center justify-center bg-white">
            <View className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
          </View>
        ) : state === "completed" ? (
          <View className="w-6 h-6 rounded-full bg-[#059669] items-center justify-center">
            <Check color="#ffffff" size={12} strokeWidth={3} />
          </View>
        ) : (
          <View className="w-6 h-6 rounded-full border-2 border-slate-300 bg-white" />
        )}
        <Text
          className={`text-[10px] font-jakarta mt-1.5 font-bold ${
            state === "active" ? "text-[#059669]" : "text-[#5b5e66]"
          }`}
        >
          {label}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      {/* Top Header Row */}
      <View className="flex-row items-center justify-between px-margin-mobile h-[72px] bg-transparent">
        <Pressable
          onPress={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-white items-center justify-center border border-outline-variant/10 shadow-xs active:bg-slate-100"
        >
          <ArrowLeft color="#0B1C30" size={20} />
        </Pressable>

        <View className="items-center">
          <Text className="text-lg font-bold text-on-surface font-jakarta">
            Active Trip
          </Text>
          {getStatusBadge()}
        </View>

        <Pressable
          onPress={() => Alert.alert("Call Passenger", "Calling passenger...")}
          className="w-12 h-12 rounded-2xl bg-white items-center justify-center border border-outline-variant/10 shadow-xs active:bg-slate-100"
        >
          <Phone color="#059669" size={18} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Map Container View */}
        <View className="h-[250px] px-5 relative w-full overflow-hidden border-b border-outline-variant/10">
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhChECydpDyPgt27hlQrat9Rk2U89C00BRo9HxQfDmpSr4MRrxjAG1pGL6iwr1A__rTa5hkvxx5VNhyBHIwUrgEL1XAzRh3vdUsCbmpnjEWdd5tXIJyvuoNbsf17_pEryhtId0Y6snYs2mm-iQfYuoPK3Zrsg2EAG-XD5-Bq8QCQpcEyE5GcSDWhm7yhm20vy7oBcRqJFt0hbOoiU-LdxjqFg6qiW_P7A1aJmd6buI9IlGZRklUN8jk7Fl9tud8gafRai7G4XXH9hL",
            }}
            className="w-full h-full object-cover border-4 border-white rounded-2xl"
          />

          {/* Floating Actions on Map */}
          <View className="absolute left-12 bottom-4 gap-2.5">
            <Pressable
              onPress={() =>
                Alert.alert("Target", "Re-centering map on driver location.")
              }
              className="w-10 h-10 rounded-xl bg-white items-center justify-center border border-outline-variant/10 shadow-sm active:bg-slate-100"
            >
              <Compass color="#059669" size={18} />
            </Pressable>
            <Pressable
              onPress={() => router.push("/sos")}
              className="w-10 h-10 rounded-xl bg-[#ba1a1a] items-center justify-center shadow-sm active:bg-red-800"
            >
              <Shield color="#ffffff" size={18} />
            </Pressable>
          </View>
        </View>

        {/* Content Section below Map */}
        <View className="px-5 py-6 gap-5">
          {/* Passenger Info Card */}
          <View className="bg-white p-4 rounded-lg  shadow-xs flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-12 h-12 rounded-2xl bg-[#eff3ff] items-center justify-center border border-[#e5eeff]">
                <KekeIcon size={22} color="#059669" />
              </View>
              <View className="ml-3.5 flex-1">
                <Text className="text-[14px] font-bold text-on-surface font-jakarta">
                  {activeTrip.driverName || "Chinedu"}
                </Text>
                <Text
                  className="text-secondary text-[11px] font-medium font-jakarta mt-0.5"
                  numberOfLines={1}
                >
                  KEK-1234 • Ride ID: 7G8H2J
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => Alert.alert("Chat", "Opening passenger chat...")}
              className="w-11 h-11 rounded-2xl bg-white items-center justify-center border border-outline-variant/15 shadow-sm active:bg-slate-50"
            >
              <MessageSquare color="#059669" size={18} />
            </Pressable>
          </View>

          {/* Locations details Card */}
          <View className="bg-white p-5 rounded-[28px] shadow-xs relative">
            <View className="absolute left-[34px] top-[40px] bottom-[40px] w-[1px] border-l border-dashed border-slate-300" />

            {/* Pick up Row */}
            <View className="flex-row items-start justify-between mb-6">
              <View className="flex-row items-start flex-1 mr-2">
                <View className="w-[30px] h-[30px] rounded-full border-2 border-success items-center justify-center bg-white">
                  <View className="w-2.5 h-2.5 rounded-full bg-success" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-success text-[10px] font-extrabold font-jakarta">
                    PICK UP
                  </Text>
                  <Text className="text-on-surface text-[14px] font-bold font-jakarta mt-0.5">
                    {activeTrip.pickup || "New Hall"}
                  </Text>
                  <Text className="text-secondary text-xs font-medium font-jakarta mt-0.5">
                    University Road, Km 22, Gwagwalada
                  </Text>
                </View>
              </View>

              <View className="w-10 h-10 rounded-2xl bg-[#f0fcf4] border border-[#dcfce7] items-center justify-center">
                <GraduationCap color="#22c55e" size={18} />
              </View>
            </View>

            {/* Drop off Row */}
            <View className="flex-row items-start justify-between">
              <View className="flex-row items-start flex-1 mr-2">
                <View className="w-[30px] h-[30px] rounded-full border-2 border-primary items-center justify-center bg-white">
                  <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-primary text-[10px] font-extrabold font-jakarta">
                    DROP OFF
                  </Text>
                  <Text className="text-on-surface text-[14px] font-bold font-jakarta mt-0.5">
                    {activeTrip.destination || "Main Gate"}
                  </Text>
                  <Text className="text-secondary text-xs font-medium font-jakarta mt-0.5">
                    Kubwa Expressway, Gwagwalada
                  </Text>
                </View>
              </View>

              <View className="w-10 h-10 rounded-2xl bg-[#f0f4ff] border border-[#dce9ff] items-center justify-center">
                <Landmark color="#059669" size={18} />
              </View>
            </View>
          </View>

          {/* Stepper Progress bar */}
          <View className="flex-row items-center justify-between px-6 py-2 relative">
            <View className="absolute left-[54px] right-[54px] top-[20px] h-[1.5px] border-t border-dashed border-slate-300" />
            {/* Dynamic solid blue line overlays */}
            {activeTrip.status !== "confirmed" &&
              activeTrip.status !== "searching" &&
              activeTrip.status !== "idle" && (
                <View
                  className="absolute left-[54px] top-[20px] h-[1.5px] bg-[#059669]"
                  style={{
                    width: activeTrip.status === "tracking" ? "42%" : "84%",
                  }}
                />
              )}

            {renderStepNode(1, "Arrived")}
            {renderStepNode(2, "Start Trip")}
            {renderStepNode(3, "At Dropoff")}
          </View>

          {/* Buttons Area */}
          <View className="gap-3.5 mt-2">
            <Pressable
              onPress={handleTripAction}
              disabled={
                submitting || !rideData || rideData.status === "requested"
              }
              className={`w-full h-14 rounded-full flex-row items-center justify-center gap-2 shadow-md active:scale-[0.98] ${
                !rideData || rideData.status === "requested" || submitting
                  ? "bg-slate-300"
                  : "bg-[#059669]"
              }`}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Check color="#ffffff" size={18} strokeWidth={3} />
                  <Text className="text-white font-bold text-[16px] font-jakarta">
                    {getButtonText()}
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={handleCancelTrip}
              className="w-full h-14 bg-[#f1f3f7] rounded-full items-center justify-center active:scale-[0.98]"
            >
              <Text className="text-[#059669] font-bold text-[16px] font-jakarta">
                Cancel Trip
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
