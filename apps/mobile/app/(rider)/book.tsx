import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MapPin, Compass, Wallet } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../context/AppContext";

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
  const [filteredDestinations, setFilteredDestinations] = useState<string[]>(
    [],
  );
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
          loc.toLowerCase() !== pickup.toLowerCase(),
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

  const handleSwap = () => {
    const temp = pickup;
    setPickup(destination || "Where to?");
    setDestination(temp === "Where to?" ? "" : temp);
  };

  const handleFindRide = () => {
    if (!pickup || !destination) return;
    startBooking(pickup, destination, rideType);
    router.push("/(rider)/confirm");
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Top App Bar */}
      <View className="flex-row justify-between items-center px-margin-mobile h-[64px] bg-surface border-b border-outline-variant z-20">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full active:bg-surface-container-high text-primary"
        >
          <ArrowLeft color="#001caa" size={24} />
        </Pressable>
        <Text className="text-headline-md font-bold text-primary font-jakarta">Book a Ride</Text>
        <Pressable className="flex-row items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full active:opacity-75">
          <Wallet color="#001caa" size={16} />
          <Text className="text-label-sm text-primary font-bold">₦ 1,850</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
      >
        <View className="p-margin-mobile flex-1 gap-lg md:max-w-[600px] md:mx-auto w-full">
          {/* Map Preview Card */}
          <View className="w-full h-[200px] rounded-xl overflow-hidden shadow-md border border-outline-variant relative bg-surface-container-lowest">
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhChECydpDyPgt27hlQrat9Rk2U89C00BRo9HxQfDmpSr4MRrxjAG1pGL6iwr1A__rTa5hkvxx5VNhyBHIwUrgEL1XAzRh3vdUsCbmpnjEWdd5tXIJyvuoNbsf17_pEryhtId0Y6snYs2mm-iQfYuoPK3Zrsg2EAG-XD5-Bq8QCQpcEyE5GcSDWhm7yhm20vy7oBcRqJFt0hbOoiU-LdxjqFg6qiW_P7A1aJmd6buI9IlGZRklUN8jk7Fl9tud8gafRai7G4XXH9hL",
              }}
              className="w-full h-full object-cover"
            />
            {/* Overlay Gradient */}
            <View className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-40" />
          </View>

          {/* Booking Input Card */}
          <View className="bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant p-md flex flex-col gap-md relative">
            {/* Timeline connector line */}
            <View className="absolute left-[31px] top-[40px] bottom-[40px] w-[1px] border-l border-dashed border-outline-variant" />

            {/* From Input */}
            <View className="flex-row items-center gap-md relative z-10 w-full">
              <View className="w-[30px] items-center justify-center shrink-0">
                <View className="w-4 h-4 rounded-full bg-primary-fixed-dim border-2 border-primary flex items-center justify-center">
                  <View className="w-1.5 h-1.5 rounded-full bg-primary" />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-label-sm font-label-sm text-secondary block mb-0.5">From</Text>
                <TextInput
                  value={pickup}
                  onChangeText={setPickup}
                  placeholder="Pickup Location"
                  placeholderTextColor="#c5c5d8"
                  className="w-full py-1 text-body-md font-semibold text-on-surface"
                />
              </View>
            </View>

            {/* Swap Button */}
            <View className="relative h-4 w-full flex items-center justify-center z-20">
              <View className="absolute w-full border-t border-outline-variant/30" />
              <Pressable
                onPress={handleSwap}
                className="w-8 h-8 rounded-full bg-surface border border-outline-variant flex items-center justify-center text-secondary shadow-sm active:bg-surface-container-low"
              >
                <Text className="text-[18px] text-secondary">⇅</Text>
              </Pressable>
            </View>

            {/* To Input */}
            <View className="flex-row items-center gap-md relative z-10 w-full">
              <View className="w-[30px] items-center justify-center shrink-0">
                <View className="w-4 h-4 rounded-full bg-surface-variant border-2 border-primary flex items-center justify-center" />
              </View>
              <View className="flex-1">
                <Text className="text-label-sm font-label-sm text-secondary block mb-0.5">To</Text>
                <TextInput
                  placeholder="Where to?"
                  placeholderTextColor="#c5c5d8"
                  value={destination}
                  onChangeText={handleDestinationChange}
                  className="w-full py-1 text-body-md font-semibold text-on-surface"
                />
              </View>
            </View>
          </View>

          {/* Autocomplete Dropdown List */}
          {showDropdown && filteredDestinations.length > 0 && (
            <View className="border border-outline-variant bg-surface rounded-xl max-h-[160px] overflow-hidden -mt-2">
              <ScrollView keyboardShouldPersistTaps="handled">
                {filteredDestinations.map((loc, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => handleSelectDestination(loc)}
                    className="flex-row items-center gap-3 px-4 py-3 border-b border-outline-variant/10 active:bg-surface-container-low"
                  >
                    <MapPin color="#757687" size={16} />
                    <Text className="text-body-md text-on-surface font-semibold">
                      {loc}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Vehicle Type Selection */}
          <View className="bg-surface-container-lowest rounded-xl border border-outline-variant flex overflow-hidden shadow-sm h-14">
            <Pressable
              onPress={() => setRideType("keke")}
              className={`flex-1 flex-row items-center justify-center gap-2 ${
                rideType === "keke" ? "bg-primary" : "bg-transparent"
              }`}
            >
              <Compass color={rideType === "keke" ? "#ffffff" : "#5b5e66"} size={20} />
              <Text className={`font-label-md text-label-md font-bold ${
                rideType === "keke" ? "text-on-primary" : "text-secondary"
              }`}>Keke</Text>
            </Pressable>

            <Pressable
              onPress={() => setRideType("bus")}
              className={`flex-1 flex-row items-center justify-center gap-2 border-l border-outline-variant ${
                rideType === "bus" ? "bg-primary" : "bg-transparent"
              }`}
            >
              <Compass color={rideType === "bus" ? "#ffffff" : "#5b5e66"} size={20} />
              <Text className={`font-label-md text-label-md font-bold ${
                rideType === "bus" ? "text-on-primary" : "text-secondary"
              }`}>Bus</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Area */}
      <View className="p-margin-mobile border-t border-outline-variant/30 bg-surface-container-lowest md:max-w-[600px] md:mx-auto w-full">
        <Pressable
          onPress={handleFindRide}
          disabled={!pickup || !destination}
          className={`w-full h-14 rounded-xl items-center justify-center shadow-lg active:scale-[0.98] ${
            pickup && destination ? "bg-on-surface" : "bg-outline-variant/50"
          }`}
        >
          <Text className={`text-action-lg font-bold ${
            pickup && destination ? "text-surface-container-lowest" : "text-secondary"
          }`}>
            Find ride
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

