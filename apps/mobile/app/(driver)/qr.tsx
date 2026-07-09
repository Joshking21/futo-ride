import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Compass,
  MapPin,
  Navigation,
  Shield,
} from "lucide-react-native";
import React, { useState, useEffect } from "react";
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
import { useApp } from "../../context/AppContext";
import { apiRequest } from "../../config/apiHelper";

export default function DriverQR() {
  const router = useRouter();
  const { activeTrip, clearActiveTrip } = useApp();
  const [qrToken, setQrToken] = useState<string>("");

  useEffect(() => {
    const fetchQrToken = async () => {
      if (!activeTrip.rideId) return;
      try {
        const res = await apiRequest<{ qrToken: string }>(`/rides/${activeTrip.rideId}/qr`);
        setQrToken(res.qrToken);
      } catch (err) {
        console.error("Failed to load QR token:", err);
      }
    };
    fetchQrToken();
  }, [activeTrip.rideId]);

  // Automatically redirect driver home when rider scans QR (which clears activeTrip on driver side)
  useEffect(() => {
    if (activeTrip.status === "idle") {
      Alert.alert("Ride Complete", "The student has scanned the QR code and the fare has been verified.");
      router.replace("/(driver)/home");
    }
  }, [activeTrip.status]);

  const handleScanDone = () => {
    clearActiveTrip();
    router.replace("/(driver)/home");
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const tripPrice = activeTrip.price || 150.0;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-margin-mobile h-[72px] bg-transparent">
        <Pressable
          onPress={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-white items-center justify-center border border-outline-variant/10 shadow-xs active:bg-slate-100"
        >
          <ArrowLeft color="#0B1C30" size={20} />
        </Pressable>

        <View className="items-center">
          <Text className="text-lg font-bold text-on-surface font-jakarta">Completion QR</Text>
          <Text className="text-secondary text-[11px] font-medium font-jakarta mt-0.5">
            Show this to the rider
          </Text>
        </View>

        <View className="w-12" />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Trip details summary card */}
        <View className="bg-white p-4 rounded-2xl  shadow-xs flex-row items-center justify-between mt-4">
          <View className="flex-row items-center flex-1 mr-2 relative pl-6">
            {/* Timeline connector visual */}
            <View className="absolute left-[7px] top-[14px] bottom-[14px] w-[1px] border-l border-dashed border-slate-300" />

            <View className="gap-3.5 flex-1">
              {/* Pickup info */}
              <View className="flex-row items-start gap-3">
                <View className="w-4 h-4 rounded-full bg-[#f1f3f7] items-center justify-center mt-0.5">
                  <View className="rotate-45">
                    <Navigation color="#0b1c30" size={8} fill="#0b1c30" />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-on-surface text-[13px] font-bold font-jakarta leading-none">
                    {activeTrip.pickup || "New Hall"}
                  </Text>
                  <Text className="text-secondary text-[10px] font-medium font-jakarta mt-1">
                    Pickup
                  </Text>
                </View>
              </View>

              {/* Drop-off info */}
              <View className="flex-row items-start gap-3">
                <View className="w-4 h-4 rounded-full bg-[#f1f3f7] items-center justify-center mt-0.5">
                  <MapPin color="#0b1c30" size={9} fill="#0b1c30" />
                </View>
                <View className="flex-1">
                  <Text className="text-on-surface text-[13px] font-bold font-jakarta leading-none">
                    {activeTrip.destination || "Main Gate"}
                  </Text>
                  <Text className="text-secondary text-[10px] font-medium font-jakarta mt-1">
                    Drop-off
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Vertical Divider */}
          <View className="w-[1px] h-12 bg-slate-100 mx-4" />

          {/* Price breakdown and Status */}
          <View className="items-end mr-1">
            <Text className="text-secondary text-[10px] font-medium font-jakarta">Trip Fare</Text>
            <Text className="text-on-surface font-extrabold text-[18px] font-jakarta mt-0.5">
              {formatCurrency(tripPrice)}
            </Text>
            <View className="bg-[#e6f9ed] px-2.5 py-0.5 rounded-full mt-1.5">
              <Text className="text-success font-bold text-[10px] font-jakarta">Paid</Text>
            </View>
          </View>
        </View>

        {/* Central Instruction label */}
        <Text className="text-secondary text-xs font-medium text-center font-jakarta mt-6 px-4">
          Ask the rider to scan this QR code to complete the trip.
        </Text>

        {/* QR Code Container Card */}
        <View className="bg-white p-6 rounded-[32px] border border-[#e5eeff] shadow-xs items-center justify-center mt-5">
          <View className="relative w-56 h-56 items-center justify-center p-4 border border-outline-variant/5 rounded-3xl bg-slate-50">
            {/* Corner anchor guides */}
            <View className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[#001caa] rounded-tl-lg" />
            <View className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#001caa] rounded-tr-lg" />
            <View className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[#001caa] rounded-bl-lg" />
            <View className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#001caa] rounded-br-lg" />

            <Pressable
              // onPress={handleScanDone}
              className="w-full h-full rounded-2xl overflow-hidden p-1.5 active:opacity-90"
            >
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAwU9p-p3MAM0M5CJ_uCAQo00mPIGbk1LtH9mb6CeU6eK4o9ldjRGsAlGd7jEJucTJ44oFbnErneToX7T0XMWtCmX3suULYGB5cD8gMskYI8qXtGDZsJjMGrb6_0-o6JGC6TBuPHkVX_H4qz6MrMOMMJ5dRmwR9z2SwKiRdf6DxhqSAymb8J-JREiJQtgrLkMKEh6_jqg2HjDJYhJfNAK1MK8kgKCAis6aO3S1YeVDn2BLeggH5-57fKB6I3Ol-1I-LRXn7VlgTBIrf",
                }}
                className="w-full h-full object-contain"
              />
            </Pressable>
          </View>

          {/* Waiting Status Bar */}
          <View className="bg-[#eff3ff] p-4 rounded-2xl mt-5 w-full flex-row items-center justify-center gap-2.5">
            <ActivityIndicator color="#001caa" size="small" />
            <Text className="text-[#001caa] font-bold text-xs font-jakarta">
              Waiting for rider to scan...
            </Text>
          </View>
          {qrToken ? (
            <Text className="text-secondary text-sm font-jakarta mt-4 font-bold text-center">
              Verification Code: {qrToken}
            </Text>
          ) : null}
        </View>

        {/* Tip Instruction Card */}
        <View className="bg-white border border-[#e5eeff] p-4 rounded-3xl flex-row items-center gap-3.5 mt-5 shadow-xs">
          <View className="w-10 h-10 rounded-2xl bg-[#eff3ff] items-center justify-center">
            <Shield color="#001caa" size={18} />
          </View>
          <View className="flex-1">
            <Text className="text-on-surface text-xs font-bold font-jakarta">Tip</Text>
            <Text className="text-secondary text-[11px] font-medium font-jakarta mt-0.5 leading-4">
              Make sure the screen is bright and the QR code is clearly visible.
            </Text>
          </View>
        </View>

        {/* Action Button fallback */}
        <Pressable
          onPress={handleScanDone}
          className="w-full h-14 bg-[#001caa] rounded-full items-center justify-center shadow-md active:scale-[0.98] mt-6"
        >
          <Text className="text-white font-bold text-[16px] font-jakarta">
            Complete & Return
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
