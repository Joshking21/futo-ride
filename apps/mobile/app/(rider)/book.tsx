import React, { useState, useEffect } from "react";
import { View, Text, Image, Pressable, TextInput, ScrollView, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useApp } from "../../context/AppContext";
import { ArrowLeft, Wallet, Search, MapPin, Compass } from "lucide-react-native";

const CAMPUS_LOCATIONS = [
  "SEET Head",
  "SOSC Extension",
  "Hall C",
  "Senate Building",
  "SOES Building",
  "FUTO Main Gate",
  "PGS (Post Graduate School)",
  "Health Centre",
];

export default function BookRide() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { startBooking } = useApp();

  const [pickup, setPickup] = useState("FUTO Main Gate");
  const [destination, setDestination] = useState("");
  const [rideType, setRideType] = useState<"keke" | "bus">("keke");
  const [filteredDestinations, setFilteredDestinations] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (params.prefillDestination) {
      setDestination(params.prefillDestination as string);
    }
  }, [params]);

  const handleDestinationChange = (text: string) => {
    setDestination(text);
    if (text.length > 0) {
      const filtered = CAMPUS_LOCATIONS.filter(
        (loc) =>
          loc.toLowerCase().includes(text.toLowerCase()) &&
          loc.toLowerCase() !== pickup.toLowerCase()
      );
      setFilteredDestinations(filtered);
      setShowDropdown(true);
    } else {
      setFilteredDestinations([]);
      setShowDropdown(false);
    }
  };

  const handleSelectDestination = (loc: string) => {
    setDestination(loc);
    setShowDropdown(false);
    Keyboard.dismiss();
  };

  const handleFindRide = () => {
    if (!pickup || !destination) return;
    startBooking(pickup, destination, rideType);
    router.push("/(rider)/confirm");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Top Header */}
      <View className="flex-row justify-between items-center px-margin-mobile h-touch-target bg-surface border-b border-outline-variant/30 z-30">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-surface-container">
            <ArrowLeft color="#001caa" size={24} />
          </Pressable>
          <Text className="text-headline-md font-bold text-primary font-jakarta">Futo Ride</Text>
        </View>
        <Pressable className="flex-row items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full active:opacity-75">
          <Wallet color="#001caa" size={16} />
          <Text className="text-label-sm text-primary font-bold">₦ 1,850</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" className="flex-1">
        {/* Map Header Area */}
        <View className="relative w-full h-[250px] bg-surface-container-high overflow-hidden">
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhChECydpDyPgt27hlQrat9Rk2U89C00BRo9HxQfDmpSr4MRrxjAG1pGL6iwr1A__rTa5hkvxx5VNhyBHIwUrgEL1XAzRh3vdUsCbmpnjEWdd5tXIJyvuoNbsf17_pEryhtId0Y6snYs2mm-iQfYuoPK3Zrsg2EAG-XD5-Bq8QCQpcEyE5GcSDWhm7yhm20vy7oBcRqJFt0hbOoiU-LdxjqFg6qiW_P7A1aJmd6buI9IlGZRklUN8jk7Fl9tud8gafRai7G4XXH9hL",
            }}
            className="w-full h-full object-cover"
          />
          <View className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-40" />
        </View>

        {/* Booking Form Card (Floating Over Map) */}
        <View className="mx-container-margin -mt-12 bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-md p-6 relative z-10 flex flex-col gap-6">
          
          {/* Inputs Section */}
          <View className="relative flex flex-col gap-4">
            
            {/* Visual Route indicator bar */}
            <View className="absolute left-[21px] top-[26px] bottom-[26px] w-[2px] bg-outline-variant z-0 rounded-full" />

            {/* Pickup Input */}
            <View className="flex-row items-center gap-3 relative z-10 w-full">
              <View className="w-11 h-11 items-center justify-center shrink-0">
                <View className="w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-primary-container/30" />
              </View>
              <View className="flex-1">
                <TextInput
                  value={pickup}
                  onChangeText={setPickup}
                  placeholder="Current Location"
                  placeholderTextColor="#c5c5d8"
                  className="w-full h-11 px-3 bg-surface border border-outline-variant rounded-lg text-body-md font-semibold text-on-surface"
                />
              </View>
            </View>

            {/* Destination Input */}
            <View className="flex-row items-center gap-3 relative z-10 w-full">
              <View className="w-11 h-11 items-center justify-center shrink-0">
                <MapPin color="#333640" size={20} />
              </View>
              <View className="flex-1">
                <TextInput
                  placeholder="Where to?"
                  placeholderTextColor="#c5c5d8"
                  value={destination}
                  onChangeText={handleDestinationChange}
                  className="w-full h-11 px-3 bg-surface border border-outline-variant rounded-lg text-body-md font-semibold text-on-surface"
                />
              </View>
            </View>
          </View>

          {/* Autocomplete Dropdown List */}
          {showDropdown && filteredDestinations.length > 0 && (
            <View className="border border-outline-variant/40 bg-surface rounded-lg max-h-[160px] overflow-hidden">
              <ScrollView keyboardShouldPersistTaps="handled">
                {filteredDestinations.map((loc, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => handleSelectDestination(loc)}
                    className="flex-row items-center gap-3 px-4 py-3 border-b border-outline-variant/10 active:bg-surface-container-low"
                  >
                    <MapPin color="#757687" size={16} />
                    <Text className="text-body-md text-on-surface font-semibold">{loc}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <View className="h-[1px] bg-outline-variant/20 w-full" />

          {/* Vehicle Type Selector */}
          <View className="flex flex-col gap-2">
            <Text className="text-label-sm text-secondary font-bold uppercase tracking-wider">
              Ride Type
            </Text>
            <View className="flex-row gap-3 w-full">
              {/* Keke Option */}
              <Pressable
                onPress={() => setRideType("keke")}
                className={`flex-1 h-12 rounded-lg flex-row items-center justify-center gap-2 active:scale-95 ${
                  rideType === "keke"
                    ? "bg-on-surface text-surface"
                    : "bg-surface-container border border-outline-variant"
                }`}
              >
                <Compass color={rideType === "keke" ? "#ffffff" : "#0b1c30"} size={18} />
                <Text
                  className={`font-bold text-action-lg ${
                    rideType === "keke" ? "text-white" : "text-on-surface"
                  }`}
                >
                  Keke
                </Text>
              </Pressable>

              {/* Bus Option */}
              <Pressable
                onPress={() => setRideType("bus")}
                className={`flex-1 h-12 rounded-lg flex-row items-center justify-center gap-2 active:scale-95 ${
                  rideType === "bus"
                    ? "bg-on-surface text-surface"
                    : "bg-surface-container border border-outline-variant"
                }`}
              >
                <Compass color={rideType === "bus" ? "#ffffff" : "#0b1c30"} size={18} />
                <Text
                  className={`font-bold text-action-lg ${
                    rideType === "bus" ? "text-white" : "text-on-surface"
                  }`}
                >
                  Bus
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Find Ride Action Button */}
          <Pressable
            onPress={handleFindRide}
            disabled={!destination}
            className={`w-full h-14 rounded-lg items-center justify-center shadow-md active:scale-[0.98] mt-2 ${
              destination ? "bg-primary hover:bg-surface-tint" : "bg-outline-variant/40"
            }`}
          >
            <Text className="text-on-primary text-action-lg font-bold">Find Ride</Text>
          </Pressable>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
