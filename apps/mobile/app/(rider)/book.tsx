import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Bus,
  ChevronDown,
  Compass,
  MapPin,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KekeIcon from "../../components/KekeIcon";
import { useApp } from "../../context/AppContext";

const CAMPUS_LOCATIONS = [
  { name: "SEET Head", desc: "School of Engineering & Tech Complex" },
  { name: "FUTO Main Gate", desc: "Campus main entrance shuttle park" },
  { name: "Hall C Hostel", desc: "Student housing residential area" },
  {
    name: "Senate Building",
    desc: "University admin & vice chancellor office",
  },
  { name: "SOES Building", desc: "School of Environmental Sciences" },
  { name: "PGS Complex", desc: "Post Graduate School building" },
  { name: "Health Centre", desc: "Campus medical clinic and emergency" },
  { name: "Town (Owerri)", desc: "Town transport terminal outside campus" },
];

export default function BookRide() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { startBooking } = useApp();

  const [pickup, setPickup] = useState("FUTO Main Gate");
  const [pickupDesc, setPickupDesc] = useState(
    "Campus main entrance shuttle park",
  );
  const [destination, setDestination] = useState("");
  const [destinationDesc, setDestinationDesc] = useState(
    "Select your dropoff point",
  );
  const [rideType, setRideType] = useState<"keke" | "bus">("keke");
  const [showPickupDropdown, setShowPickupDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  useEffect(() => {
    if (params.prefillDestination) {
      const matched = CAMPUS_LOCATIONS.find(
        (loc) => loc.name === params.prefillDestination,
      );
      if (matched) {
        setDestination(matched.name);
        setDestinationDesc(matched.desc);
      } else {
        setDestination(params.prefillDestination as string);
        setDestinationDesc("Selected location");
      }
    }
  }, [params]);

  const handleSwap = () => {
    const tempName = pickup;
    const tempDesc = pickupDesc;
    setPickup(destination || "Where to?");
    setPickupDesc(destinationDesc);
    setDestination(tempName === "Where to?" ? "" : tempName);
    setDestinationDesc(tempDesc);
  };

  const handleFindRide = () => {
    if (!pickup || !destination) return;
    startBooking(pickup, destination, rideType);
    router.push("/(rider)/confirm");
  };

  return (
    <SafeAreaView
      className="flex-1 bg-surface-bright"
      edges={["top", "bottom"]}
    >
      {/* Top Header with Back & Close Buttons */}
      <View className="flex-row justify-between items-center px-margin-mobile h-[64px] bg-surface-bright z-20">
        <Pressable
          onPress={() => router.back()}
          style={{ elevation: 1 }}
          className="w-12 h-12 rounded-2xl bg-white items-center justify-center  active:bg-surface-container"
        >
          <ArrowLeft color="#0B1C30" size={24} />
        </Pressable>
        <Text className="text-headline-sm font-bold text-on-surface font-jakarta">
          Book a Ride
        </Text>
        <Pressable
          // onPress={}
          style={{ elevation: 1 }}
          className="w-12 "
        >
          {/* <X color="#0B1C30" size={24} /> */}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
      >
        <View className="px-margin-mobile pt-6 flex-1 gap-6 md:max-w-[600px] md:mx-auto w-full pb-32">
          {/* Map Preview Card */}
          <View className="w-full h-[220px] rounded-3xl overflow-hidden shadow-sm border-4 border-white relative bg-surface-container-lowest">
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhChECydpDyPgt27hlQrat9Rk2U89C00BRo9HxQfDmpSr4MRrxjAG1pGL6iwr1A__rTa5hkvxx5VNhyBHIwUrgEL1XAzRh3vdUsCbmpnjEWdd5tXIJyvuoNbsf17_pEryhtId0Y6snYs2mm-iQfYuoPK3Zrsg2EAG-XD5-Bq8QCQpcEyE5GcSDWhm7yhm20vy7oBcRqJFt0hbOoiU-LdxjqFg6qiW_P7A1aJmd6buI9IlGZRklUN8jk7Fl9tud8gafRai7G4XXH9hL",
              }}
              className="w-full h-full object-cover"
            />
            {/* Draw a route path simulation using absolute views on web/app */}
            <View className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Path dots */}
              <View className="absolute top-[40%] left-[30%] w-3 h-3 rounded-full bg-primary border-2 border-white shadow-sm" />
              <View className="absolute top-[50%] left-[60%] w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-sm" />
              {/* Simulated blue path line */}
              <View className="absolute top-[45%] left-[35%] w-[45%] h-1 bg-primary/80 rotate-[18deg]" />
            </View>
          </View>

          {/* Booking Inputs Bento Card */}
          <View
            style={{ elevation: 1 }}
            className="bg-white rounded-3xl shadow-sm border border-outline-variant/10 p-5 flex-col relative"
          >
            {/* Timeline connector line */}
            <View className="absolute left-[31px] top-[48px] bottom-[48px] w-[1px] border-l border-dashed border-outline-variant/30" />

            {/* From Row */}
            <View className="flex-row items-center gap-4 relative z-10 w-full pb-4">
              <View className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <View className="w-3 h-3 rounded-full bg-primary" />
              </View>
              <Pressable
                onPress={() => {
                  setShowPickupDropdown(!showPickupDropdown);
                  setShowDestDropdown(false);
                }}
                className="flex-1 flex-row items-center justify-between  pb-2"
              >
                <View className="flex-1">
                  <Text className="text-[10px] uppercase font-bold text-secondary font-jakarta">
                    From
                  </Text>
                  <Text className="text-body-md font-bold text-on-surface font-jakarta mt-0.5">
                    {pickup}
                  </Text>
                  <Text className="text-body-sm text-secondary font-jakarta mt-0.5">
                    {pickupDesc}
                  </Text>
                </View>
                <ChevronDown color="#757687" size={18} />
              </Pressable>
            </View>

            {/* Swap Button Divider */}
            <View className="relative h-6 w-full flex items-center justify-center z-20 my-1">
              <View className="absolute w-full  border-t border-outline-variant/10" />
              <Pressable
                onPress={handleSwap}
                className="w-9 h-9 rounded-full bg-white border border-outline-variant/15 flex items-center justify-center shadow-sm active:bg-surface-container"
              >
                <Text className="text-[20px] text-on-surface font-bold">⇅</Text>
              </Pressable>
            </View>

            {/* To Row */}
            <View className="flex-row items-center gap-4 relative z-10 w-full pt-2">
              <View className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <View className="w-3.5 h-3.5 rounded-full bg-primary border-2 border-white" />
              </View>
              <Pressable
                onPress={() => {
                  setShowDestDropdown(!showDestDropdown);
                  setShowPickupDropdown(false);
                }}
                className="flex-1 flex-row items-center justify-between pb-1"
              >
                <View className="flex-1">
                  <Text className="text-[10px] uppercase font-bold text-secondary font-jakarta">
                    To
                  </Text>
                  <Text className="text-body-md font-bold text-on-surface font-jakarta mt-0.5">
                    {destination || "Where to?"}
                  </Text>
                  <Text className="text-body-sm text-secondary font-jakarta mt-0.5">
                    {destinationDesc}
                  </Text>
                </View>
                <ChevronDown color="#757687" size={18} />
              </Pressable>
            </View>
          </View>

          {/* Autocomplete Pickup Dropdown List */}
          {showPickupDropdown && (
            <View className="border border-outline-variant/10 bg-white rounded-2xl max-h-[200px] overflow-hidden -mt-3 shadow-md">
              <ScrollView keyboardShouldPersistTaps="handled">
                {CAMPUS_LOCATIONS.map((loc, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      setPickup(loc.name);
                      setPickupDesc(loc.desc);
                      setShowPickupDropdown(false);
                    }}
                    className="flex-row items-center gap-3.5 px-4 py-3.5 border-b border-outline-variant/5 active:bg-surface-container-low"
                  >
                    <MapPin color="#757687" size={16} />
                    <View>
                      <Text className="text-body-md text-on-surface font-bold font-jakarta">
                        {loc.name}
                      </Text>
                      <Text className="text-body-sm text-secondary font-jakarta">
                        {loc.desc}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Autocomplete Dropoff Dropdown List */}
          {showDestDropdown && (
            <View className="border border-outline-variant/10 bg-white rounded-2xl max-h-[200px] overflow-hidden -mt-3 shadow-md">
              <ScrollView keyboardShouldPersistTaps="handled">
                {CAMPUS_LOCATIONS.map((loc, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      setDestination(loc.name);
                      setDestinationDesc(loc.desc);
                      setShowDestDropdown(false);
                    }}
                    className="flex-row items-center gap-3.5 px-4 py-3.5 border-b border-outline-variant/5 active:bg-surface-container-low"
                  >
                    <MapPin color="#757687" size={16} />
                    <View>
                      <Text className="text-body-md text-on-surface font-bold font-jakarta">
                        {loc.name}
                      </Text>
                      <Text className="text-body-sm text-secondary font-jakarta">
                        {loc.desc}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Vehicle Type selection tabs */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#f8f9ff",
              borderWidth: 1,
              borderColor: "rgba(197, 197, 216, 0.10)",
              borderRadius: 16,
              padding: 4,
              height: 48,
            }}
          >
            <Pressable
              onPress={() => setRideType("keke")}
              style={{
                flex: 1,
                flexDirection: "row",
                height: 40,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: rideType === "keke" ? "#001caa" : "transparent",
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: rideType === "keke" ? 0.05 : 0,
                shadowRadius: 4,
                elevation: rideType === "keke" ? 1 : 0,
              }}
            >
              <KekeIcon
                size={20}
                color={rideType === "keke" ? "#ffffff" : "#5b5e66"}
              />
              <Text
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  fontSize: 14,
                  fontWeight: "700",
                  color: rideType === "keke" ? "#ffffff" : "#5b5e66",
                }}
              >
                Keke
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setRideType("bus")}
              style={{
                flex: 1,
                flexDirection: "row",
                height: 40,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: rideType === "bus" ? "#001caa" : "transparent",
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: rideType === "bus" ? 0.05 : 0,
                shadowRadius: 4,
                elevation: rideType === "bus" ? 1 : 0,
              }}
            >
              <Bus
                color={rideType === "bus" ? "#ffffff" : "#5b5e66"}
                size={18}
              />
              <Text
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  fontSize: 14,
                  fontWeight: "700",
                  color: rideType === "bus" ? "#ffffff" : "#5b5e66",
                }}
              >
                Bus
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Action Area */}
      <View className="absolute bottom-0 left-0 right-0 p-4 z-40">
        <View className="max-w-[600px] mx-auto w-full">
          <Pressable
            onPress={handleFindRide}
            disabled={!pickup || !destination}
            className={`w-full h-14 rounded-full items-center justify-center shadow-md active:scale-[0.98] ${
              pickup && destination ? "bg-[#0b1c30]" : "bg-outline-variant/30"
            }`}
          >
            <Text
              className={`text-action-lg font-bold font-jakarta ${
                pickup && destination ? "text-white" : "text-secondary"
              }`}
            >
              Find ride
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
