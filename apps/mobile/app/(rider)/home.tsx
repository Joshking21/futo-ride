import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  Clock,
  Compass,
  LocateFixed,
  Menu,
  Search,
  ShieldAlert,
} from "lucide-react-native";
import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KekeIcon from "../../components/KekeIcon";
import { useApp } from "../../context/AppContext";
// import { LinearGradient } from "react-native-svg";

export default function RiderHome() {
  const router = useRouter();
  const { activeTrip } = useApp();
  const [vehicleType, setVehicleType] = useState<"keke" | "bus">("keke");

  return (
    <SafeAreaView className="flex-1 bg-surface-bright relative" edges={["top"]}>
      {/* Top Overlay Menu */}
      <View className="absolute top-4 left-margin-mobile z-50">
        <Pressable className="bg-white p-3.5 rounded-full shadow-md border border-outline-variant/10 active:bg-surface-container flex items-center justify-center">
          <Menu color="#0B1C30" size={22} />
        </Pressable>
      </View>

      {/* Top Locator Button */}
      <View className="absolute top-4 right-margin-mobile z-50">
        <Pressable className="bg-white p-3.5 rounded-full shadow-md border border-outline-variant/10 active:bg-surface-container flex items-center justify-center">
          <LocateFixed color="#0B1C30" size={22} className="rotate-45" />
        </Pressable>
      </View>

      {/* Map Area */}
      <View className="flex-1 relative z-10 bg-surface-container-low">
        {/* Map Background */}
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhChECydpDyPgt27hlQrat9Rk2U89C00BRo9HxQfDmpSr4MRrxjAG1pGL6iwr1A__rTa5hkvxx5VNhyBHIwUrgEL1XAzRh3vdUsCbmpnjEWdd5tXIJyvuoNbsf17_pEryhtId0Y6snYs2mm-iQfYuoPK3Zrsg2EAG-XD5-Bq8QCQpcEyE5GcSDWhm7yhm20vy7oBcRqJFt0hbOoiU-LdxjqFg6qiW_P7A1aJmd6buI9IlGZRklUN8jk7Fl9tud8gafRai7G4XXH9hL",
          }}
          className="w-full h-full object-cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(255, 255, 255, 0.7)", "#ffffff"]}
          locations={[0, 0.6, 1]}
          className="absolute top-0 left-0 w-full h-[60%]"
        />

        {/* User Location pulsing dot */}
        <View className="absolute top-[48%] left-[50%] -ml-6 -mt-6 w-12 h-12 items-center justify-center">
          <View className="absolute w-10 h-10 rounded-full bg-primary/10 scale-125" />
          <View className="absolute w-8 h-8 rounded-full bg-primary/20" />
          <View className="w-4.5 h-4.5 rounded-full bg-primary border-2 border-white shadow-md shadow-primary/20" />
        </View>

        {/* Nearby vehicles drawn on map */}
        <View className="absolute top-[35%] left-[25%] p-1 bg-white rounded-xl shadow-md border border-outline-variant/10">
          <KekeIcon size={32} color="#001caa" />
        </View>

        <View className="absolute top-[28%] left-[60%] p-1 bg-white rounded-xl shadow-md border border-outline-variant/10">
          <KekeIcon size={32} color="#001caa" />
        </View>

        <View className="absolute top-[60%] left-[30%] p-1 bg-white rounded-xl shadow-md border border-outline-variant/10">
          <KekeIcon size={32} color="#001caa" />
        </View>

        <View className="absolute top-[52%] left-[75%] p-1 bg-white rounded-xl shadow-md border border-outline-variant/10">
          <KekeIcon size={32} color="#001caa" />
        </View>

        {/* Floating Actions Panel (Right Side above panel) */}
        <View className="absolute bottom-[260px] right-margin-mobile z-20 gap-3">
          {/* Floating SOS Button */}
          <Pressable
            onPress={() => router.push("/sos")}
            className="bg-white w-14 h-14 rounded-full items-center justify-center shadow-lg border border-outline-variant/10 active:bg-error/5"
          >
            <ShieldAlert color="#ba1a1a" size={24} />
            <Text className="text-[10px] font-bold text-error uppercase tracking-wider font-jakarta mt-0.5">
              SOS
            </Text>
          </Pressable>

          {/* Floating History/Clock Button */}
          <Pressable
            onPress={() => router.push("/(rider)/rides")}
            className="bg-white w-14 h-14 rounded-full items-center justify-center shadow-lg border border-outline-variant/10 active:bg-surface-container-high"
          >
            <Clock color="#0B1C30" size={24} />
          </Pressable>
        </View>

        {/* Bottom Search & Toggle Sheet */}
        <View
          style={{
            position: "absolute",
            bottom: 24,
            left: 20,
            right: 20,
            backgroundColor: "#ffffff",
            borderRadius: 24,
            padding: 20,
            borderWidth: 1,
            borderColor: "rgba(197, 197, 216, 0.1)",
            zIndex: 25,
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          {/* Search bar input container */}
          <Pressable
            onPress={() => router.push("/(rider)/book")}
            style={{
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#f8f9ff",
              borderWidth: 1,
              borderColor: "rgba(197, 197, 216, 0.15)",
              height: 56,
              borderRadius: 16,
              paddingHorizontal: 16,
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
              marginBottom: 16,
            }}
          >
            <Search color="#757687" size={20} style={{ marginRight: 12 }} />
            <Text
              style={{
                fontSize: 16,
                lineHeight: 24,
                color: "#5b5e66",
                fontWeight: "500",
                fontFamily: "Plus Jakarta Sans",
                flex: 1,
              }}
            >
              Where to?
            </Text>
          </Pressable>

          {/* Keke vs Bus toggle selection */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#f8f9ff",
              borderWidth: 1,
              borderColor: "rgba(197, 197, 216, 0.10)",
              borderRadius: 16,
              padding: 4,
              marginBottom: 16,
            }}
          >
            <Pressable
              onPress={() => setVehicleType("keke")}
              style={{
                flex: 1,
                flexDirection: "row",
                height: 44,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor:
                  vehicleType === "keke" ? "#001caa" : "transparent",
                shadowColor: vehicleType === "keke" ? "#001caa" : undefined,
                shadowOffset:
                  vehicleType === "keke" ? { width: 0, height: 2 } : undefined,
                shadowOpacity: vehicleType === "keke" ? 0.2 : undefined,
                shadowRadius: vehicleType === "keke" ? 4 : undefined,
                elevation: vehicleType === "keke" ? 3 : 0,
              }}
            >
              <KekeIcon
                size={20}
                color={vehicleType === "keke" ? "#ffffff" : "#444655"}
              />
              <Text
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  fontSize: 14,
                  lineHeight: 20,
                  fontWeight: "700",
                  color: vehicleType === "keke" ? "#ffffff" : "#444655",
                }}
              >
                Keke
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setVehicleType("bus")}
              style={{
                flex: 1,
                flexDirection: "row",
                height: 44,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor:
                  vehicleType === "bus" ? "#001caa" : "transparent",
                shadowColor: vehicleType === "bus" ? "#001caa" : undefined,
                shadowOffset:
                  vehicleType === "bus" ? { width: 0, height: 2 } : undefined,
                shadowOpacity: vehicleType === "bus" ? 0.2 : undefined,
                shadowRadius: vehicleType === "bus" ? 4 : undefined,
                elevation: vehicleType === "bus" ? 3 : 0,
              }}
            >
              {/* Bus icon simulation */}
              <Compass
                color={vehicleType === "bus" ? "#ffffff" : "#444655"}
                size={18}
              />
              <Text
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  fontSize: 14,
                  lineHeight: 20,
                  fontWeight: "700",
                  color: vehicleType === "bus" ? "#ffffff" : "#444655",
                }}
              >
                Bus
              </Text>
            </Pressable>
          </View>

          {/* Nearby status bar */}
          <Pressable
            onPress={() => router.push("/(rider)/book")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: "rgba(197, 197, 216, 0.15)",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: "#22c55e",
                }}
              />
              <Text
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  fontSize: 14,
                  lineHeight: 20,
                  color: "#0b1c30",
                }}
              >
                <Text style={{ fontWeight: "700" }}>
                  {vehicleType === "keke" ? "12" : "4"}
                </Text>{" "}
                {vehicleType === "keke" ? "kekes nearby" : "buses nearby"}
              </Text>
            </View>
            <ChevronRight color="#757687" size={18} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
