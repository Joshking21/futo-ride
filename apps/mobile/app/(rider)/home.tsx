import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRouter } from "expo-router";
import {
  Car,
  CarFront,
  ChevronRight,
  Clock,
  LocateFixed,
  Menu,
  Search,
  ShieldAlert,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Platform,
  Pressable,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import MapView, { UrlTile } from "react-native-maps";
// import { Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KekeIcon from "../../components/KekeIcon";
import { useApp } from "../../context/AppContext";
import LiveMapScreen from "@/components/liveMap";
import * as Location from "expo-location";
// import { LinearGradient } from "react-native-svg";

export default function RiderHome() {
  const router = useRouter();
  const { activeTrip} = useApp();
  const [vehicleType, setVehicleType] = useState<"keke" | "bus">("keke");

  const navigation = useNavigation();

  // Use a mutable ref to track the number of back button taps
  const backPressCount = useRef(0);

  // useEffect(() => {
  //   // 1. Configure iOS Navigation Layout Safety
  //   if (Platform.OS === "ios") {
  //     navigation.setOptions({
  //       gestureEnabled: false, // Prevents swipe-to-go-back to login screen
  //       headerLeft: () => null, // Removes back arrows from top layouts
  //     });
  //     return; // Android-specific hardware back button logic skips iOS entirely
  //   }

  //   // 2. Android Double-Tap Exit Logic
  //   const onBackPress = () => {
  //     if (backPressCount.current === 1) {
  //       // Second tap within 2 seconds -> Completely shut down the app process
  //       BackHandler.exitApp();
  //       return true;
  //     }

  //     // First tap -> Trigger a Toast reminder and bump count
  //     backPressCount.current = 1;
  //     ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);

  //     // Reset the tap counter back to 0 if they don't tap again within 2 seconds
  //     const timeout = setTimeout(() => {
  //       backPressCount.current = 0;
  //     }, 2000);

  //     return true; // Stop native navigation from pushing them back to login screen
  //   };

  //   const subscription = BackHandler.addEventListener(
  //     "hardwareBackPress",
  //     onBackPress,
  //   );

  //   return () => {
  //     subscription.remove();
  //   };
  // }, [navigation]);

  return (
    <SafeAreaView className="flex-1 bg-surface-bright relative" edges={[]}>
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
       
        <LiveMapScreen />
        

        <LinearGradient
          colors={["transparent", "rgba(255, 255, 255, 0.6)", "#ffffff"]}
          locations={[0, 0.7, 1]}
          className="absolute top-0 left-0 w-full h-full"
          pointerEvents="none"
        />

        {/* User Location pulsing dot */}
        <View className="absolute top-[48%] left-[50%] -ml-6 -mt-6 w-12 h-12 items-center justify-center" pointerEvents="none">
          <View className="absolute w-10 h-10 rounded-full bg-primary/10 " />
          <View className="absolute w-8 h-8 rounded-full bg-primary/20" />
          <View className="w-4.5 h-4.5 rounded-full bg-primary border-2 border-white shadow-md shadow-primary/20" />
        </View>

        {/* Nearby vehicles drawn on map */}
        {/* <View className="absolute top-[35%] left-[25%] p-1 bg-white rounded-xl shadow-md border border-outline-variant/10">
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
        </View> */}

        {/* Floating Actions Panel (Right Side above panel) */}

        {/* Bottom Search & Toggle Sheet */}
        <View
          style={{
            position: "absolute",
            bottom: 60,
            left: 20,
            right: 20,
            borderRadius: 24,
            // padding: 20,
            // borderWidth: 1,
            // borderColor: "rgba(197, 197, 216, 0.1)",
            zIndex: 25,
            // shadowColor: "#000000",
            // shadowOffset: { width: 0, height: 10 },
            // shadowOpacity: 0.1,
            // shadowRadius: 20,
            // elevation: 10,
          }}
          className="flex gap-4"
        >
          {/* Search bar input container */}
          <View className="flex flex-row  gap-4 align-bottom items-end justify-end">
            <Pressable
              onPress={() => router.push("/(rider)/confirm")}
              style={{
                // width: "100%",
                flexDirection: "row",
                alignItems: "center",
                // backgroundColor: "#f8f9ff",
                // borderWidth: 1,
                // borderColor: "rgba(197, 197, 216, 0.15)",
                height: 50,
                borderRadius: 16,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: "rgba(197, 197, 216, 0.15)",
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                // elevation: 1,
                // marginBottom: 16,
              }}
              className="flex flex-1 bg-white"
            >
              <Search color="#757687" size={20} style={{ marginRight: 12 }} />
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 24,
                  color: "#5b5e66",
                  fontWeight: "700",
                  fontFamily: "Plus Jakarta Sans",
                  flex: 1,
                }}
                className=""
              >
                Where to?
              </Text>
            </Pressable>
            <View className=" gap-3">
              {/* Floating SOS Button */}
              <Pressable
                onPress={() => router.push("/sos")}
                className=" bg-error w-14 h-14 rounded-full items-center justify-center shadow-lg border border-outline-variant/10 active:bg-error/80"
              >
                <ShieldAlert color="#ffffff" size={24} />
                <Text className="text-[10px] font-bold text-white uppercase tracking-wider font-jakarta mt-0.5">
                  SOS
                </Text>
              </Pressable>

              {/* Floating History/Clock Button */}
              <Pressable
                onPress={() => router.push("/(rider)/rides")}
                className=" bg-white w-14 h-14 rounded-full items-center justify-center shadow-lg border border-outline-variant/10 active:bg-surface-container-high"
              >
                <Clock color="#0B1C30" size={24} />
              </Pressable>
            </View>
          </View>

          {/* Keke vs Bus toggle selection */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#f8f9ff",
              borderWidth: 1,
              borderColor: "rgba(197, 197, 216, 0.10)",
              borderRadius: 16,
              // padding: 4,
              marginBottom: 16,
            }}
          >
            <Pressable
              onPress={() => setVehicleType("keke")}
              style={{
                flex: 1,
                flexDirection: "row",
                height: 40,
                borderRadius: 15,
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
                height: 40,
                borderRadius: 15,
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
              <CarFront
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
              padding: 9,
              borderWidth: 1,
              borderColor: "rgba(197, 197, 216, 0.15)",
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 1,
            }}
            className=" rounded-2xl px-5 bg-white"
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              className=""
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
