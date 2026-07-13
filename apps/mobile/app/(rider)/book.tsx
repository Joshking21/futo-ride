import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Info,
  User,
  Zap,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KekeIcon from "../../components/KekeIcon";
import { apiRequest } from "../../config/apiHelper";
import { BookedRideResponse, useApp } from "../../context/AppContext";

export default function BookRide() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { confirmBooking, campusStops, getStopId, setBookedRequest, isSurgeActive, setIsSurgeActive } = useApp();
  const [loading, setLoading] = useState(false);
  const [isPriority, setIsPriority] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"naira" | "cngn">("naira");
  const [seats, setSeats] = useState(1);
  // const [isSurgeActive, setIsSurgeActive] = useState(false);

  const [pickup, setPickup] = useState(
    campusStops[0]?.name ?? "FUTO Main Gate",
  );
  const [destination, setDestination] = useState("");
  const [pickupDesc, setPickupDesc] = useState("");
  const [destinationDesc, setDestinationDesc] = useState(
    "Select your dropoff point",
  );
  const [rideType, setRideType] = useState<"keke" | "bus">("keke");
  const [showPickupDropdown, setShowPickupDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  useEffect(() => {
    if (params.prefillDestination) {
      const matched = campusStops.find(
        (loc) => loc.name === params.prefillDestination,
      );
      if (matched) {
        setDestination(matched.name);
        setDestinationDesc("");
      } else {
        setDestination(params.prefillDestination as string);
        setDestinationDesc("Selected location");
      }
    }
  }, [params]);

  useEffect(() => {
    const checkSurge = async () => {
      if (!pickup) return;
      const zone = getStopId(pickup);
      try {
        const res = await apiRequest<{ zone: string; surge: "on" | "off" }>(
          `/surge/${zone}`,
        );
        setIsSurgeActive(res.surge === "on");
        console.log(res)
      } catch (e) {
        console.error("Surge query faikled:", e);
      }
    };
    checkSurge();
  }, [pickup]);

  const basePrice = rideType === "keke" ? seats * 150 : 150;
  const serviceFee = rideType === "keke" ? 50 : 20;
  const priorityFee = 100;
  const totalPrice =
    basePrice + serviceFee + (isPriority && isSurgeActive ? priorityFee : 0);

  // Custom Toggle Switch
  const CustomSwitch = ({
    value,
    onValueChange,
    disabled,
  }: {
    value: boolean;
    onValueChange: (v: boolean) => void;
    disabled?: boolean;
  }) => {
    return (
      <Pressable
        onPress={() => onValueChange(!value)}
        disabled={disabled}
        style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          padding: 2,
          justifyContent: "center",
          alignItems: value ? "flex-end" : "flex-start",
          backgroundColor: value ? "#001caa" : "#cbd5e1",
        }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: "#ffffff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 1,
            elevation: 1,
          }}
        />
      </Pressable>
    );
  };

  const handleSwap = () => {
    const tempName = pickup;
    const tempDesc = pickupDesc;
    setPickup(destination || "Where to?");
    setPickupDesc(destinationDesc);
    setDestination(tempName === "Where to?" ? "" : tempName);
    setDestinationDesc(tempDesc);
  };

  const handleFindRide = async () => {
    if (!pickup || !destination) return;
    setLoading(true);
     const pickupID = getStopId(pickup);
     const destinationID = getStopId(destination);
    try {
      const Booked = await apiRequest<BookedRideResponse>("/rides", "POST", {
        fromStop: pickupID,
        toStop: destinationID,
        paymentMethod: paymentMethod,
        seats: seats || 1,
        priorityFee: isPriority ? 50 : 0,
      });
      console.log("matchRes:", Booked);
      setBookedRequest(Booked);


      router.push("/(rider)/confirm");
    } catch (error: any) {
      Alert.alert("Booking failed", error.message);
    } finally {
      setLoading(false);
    }
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

            <View className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <View className="absolute top-[40%] left-[30%] w-3 h-3 rounded-full bg-primary border-2 border-white shadow-sm" />
              <View className="absolute top-[50%] left-[60%] w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-sm" />

              <View className="absolute top-[45%] left-[35%] w-[45%] h-1 bg-primary/80 rotate-[18deg]" />
            </View>
          </View>

          {/* Booking Inputs Bento Card */}
          <View
            style={{ elevation: 1 }}
            className="bg-white rounded-3xl shadow-sm p-5 flex-col relative"
          >
            {/* Timeline connector line */}
            <View className="absolute left-[31px] top-[48px] bottom-[48px] w-[1px] border-l border-dashed border-outline-variant/30" />

            {/* From Row */}
            <View className="flex-row items-center gap-4 relative z-10 w-full justify-center ">
              <View className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <View className="w-3 h-3 rounded-full bg-primary" />
              </View>
              <Pressable
                onPress={() => {
                  setShowPickupDropdown(!showPickupDropdown);
                  setShowDestDropdown(false);
                }}
                className="flex-1 flex-row items-center justify-between "
              >
                <View className="  justify-center text-center pt-4 h-fit flex ">
                  <Text className="text-[10px] uppercase font-bold text-secondary font-jakarta">
                    From
                  </Text>
                  <Text className="text-body-md font-bold text-on-surface font-jakarta ">
                    {pickup}
                  </Text>
                  <Text className="text-body-sm text-secondary font-jakarta ">
                    {pickupDesc}
                  </Text>
                </View>
                <ChevronDown color="#757687" size={18} />
              </Pressable>
            </View>

            {/* Swap Button Divider */}
            <View className="relative h-6 w-full flex items-center justify-center z-20 my-1">
              <View className="absolute w-[80%] border-t border-1 border-outline-variant/50" />
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
                <ChevronDown color="#757687" size={18} className="" />
              </Pressable>
            </View>
          </View>

          {/* Vehicle Type selection tabs */}
          {/* <View
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
                backgroundColor:
                  rideType === "keke" ? "#001caa" : "transparent",
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
          </View> */}

          {/* {pickup && destination ? ( */}
          <View style={{ gap: 16, marginTop: 0 }}>
            {/* Ride Option details Card */}
            <View
              style={{
                backgroundColor: "#ffffff",
                // borderWidth: 1,
                // borderColor: "#e5eeff",
                borderRadius: 18,
                paddingHorizontal: 20,
                paddingVertical: 10,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  flex: 1,
                  justifyContent: "space-between",
                }}
                className="flex justify-between "
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    backgroundColor: "#eff3ff",
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#e5eeff",
                  }}
                >
                  <KekeIcon size={38} color="#001caa" />
                </View>
                <View style={{ flex: 1 }} className="">
                  {/* <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: "#0b1c30",
                        fontFamily: "Plus Jakarta Sans",
                      }}
                    >
                      {rideType === "keke" ? "Keke" : "Bus"}
                    </Text> */}
                  <Text
                    style={{
                      color: "#5b5e66",
                      fontSize: 18,
                      fontWeight: "700",
                      fontFamily: "Plus Jakarta Sans",
                      marginTop: 4,
                    }}
                    className="text-center"
                  >
                    Number of Seats
                  </Text>
                  {/* Interactive Seats selector (Keke only) */}
                  {rideType === "keke" ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        marginTop: 8,
                      }}
                      className="flex justify-center items-center"
                    >
                      <Pressable
                        onPress={() => setSeats((s) => Math.max(1, s - 1))}
                        style={{
                          width: 30,
                          height: 30,
                          // borderRadius: 12,
                          backgroundColor: "#eff3ff",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        className="rounded-full"
                      >
                        <Text
                          style={{
                            color: "#001caa",
                            fontWeight: "900",
                            fontSize: 20,
                          }}
                        >
                          -
                        </Text>
                      </Pressable>
                      <Text
                        style={{
                          fontFamily: "Plus Jakarta Sans",
                          fontSize: 15,
                          fontWeight: "700",
                          color: "#0b1c30",
                        }}
                      >
                        {seats} seat{seats > 1 ? "s" : ""}
                      </Text>
                      <Pressable
                        onPress={() => setSeats((s) => Math.min(4, s + 1))}
                        style={{
                          width: 30,
                          height: 30,
                          // borderRadius: 12,
                          backgroundColor: "#eff3ff",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        className="rounded-full "
                      >
                        <Text
                          style={{
                            color: "#001caa",
                            fontWeight: "900",
                            fontSize: 20,
                          }}
                        >
                          +
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View
                      style={{
                        backgroundColor: "#eff3ff",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                        marginTop: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        alignSelf: "flex-start",
                      }}
                    >
                      <User color="#001caa" size={11} />
                      <Text
                        style={{
                          color: "#001caa",
                          fontSize: 10,
                          fontWeight: "700",
                          fontFamily: "Plus Jakarta Sans",
                          lineHeight: 12,
                        }}
                      >
                        Transit Boarding
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* <View style={{ alignItems: "flex-end" }}> */}
              {/* <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "800",
                      color: "#0b1c30",
                      fontFamily: "Plus Jakarta Sans",
                    }}
                  >
                    ₦{basePrice}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      marginTop: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: "#5b5e66",
                        fontSize: 10,
                        fontWeight: "500",
                        fontFamily: "Plus Jakarta Sans",
                      }}
                    >
                      Estimated fare
                    </Text>
                    <Info color="#5b5e66" size={11} />
                  </View> */}
              {/* </View> */}
            </View>

            {/* Priority Banner Card — only shown during active surge on keke rides */}
            {/* {rideType === "keke" && isSurgeActive && ( */}
            {isSurgeActive && (
              <View
                style={{
                  backgroundColor: "#eff3ff",
                  padding: 18,
                  borderRadius: 18,
                  // borderWidth: 1,
                  // borderColor: "#dce9ff",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    flex: 1,
                    paddingRight: 16,
                  }}
                >
                  <View
                    style={{
                      width: 30,
                      // backgroundColor: "#ffffff",
                      // borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      // borderWidth: 1,
                      // borderColor: "#e5eeff",
                      // shadowColor: "#000",
                      // shadowOffset: { width: 0, height: 1 },
                      // shadowOpacity: 0.05,
                      // shadowRadius: 1,
                      // elevation: 1,
                    }}
                  >
                    <Zap color="#001caa" size={18} fill="#001caa" />
                  </View>
                  <View
                    style={{ flex: 1 }}
                    className=" text-center justify-center items-center flex"
                  >
                    <Text
                      style={{
                        color: "#0b1c30",
                        fontSize: 14,
                        fontWeight: "700",
                        fontFamily: "Plus Jakarta Sans",
                      }}
                      className=" text-center"
                    >
                      {isSurgeActive
                        ? "Surge: Priority — skip the queue"
                        : "No Surge at this Location"}
                    </Text>
                    {isSurgeActive && (
                      <Text
                        style={{
                          color: "#5b5e66",
                          fontSize: 12,
                          fontFamily: "Plus Jakarta Sans",
                          marginTop: 2,
                        }}
                      >
                        Get matched faster
                      </Text>
                    )}
                  </View>
                </View>
                <CustomSwitch
                  disabled={!isSurgeActive}
                  value={isPriority}
                  onValueChange={setIsPriority}
                />
              </View>
            )}

            {/* Payment selector label */}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#5b5e66",
                fontFamily: "Plus Jakarta Sans",
                // marginTop: 8,
                marginBottom: 4,
              }}
            >
              Payment method
            </Text>

            {/* Payment Selector Cards */}
            <View style={{ gap: 14 }}>
              {/* Option 1: Naira */}
              <Pressable
                onPress={() => setPaymentMethod("naira")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 12,

                  borderWidth: 1,
                  borderRadius: 16,
                  backgroundColor: "#ffffff",
                  borderColor:
                    paymentMethod === "naira" ? "#001caa" : "#e5eeff",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  {/* Radio Indicator */}
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 2,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#ffffff",
                      borderColor:
                        paymentMethod === "naira" ? "#001caa" : "#cbd5e1",
                    }}
                  >
                    {paymentMethod === "naira" && (
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          backgroundColor: "#001caa",
                          borderRadius: 6,
                        }}
                      />
                    )}
                  </View>

                  {/* Currency Logo */}
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: "#001caa",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#ffffff",
                        fontWeight: "800",
                        fontSize: 14,
                        fontFamily: "Plus Jakarta Sans",
                        marginTop: -1,
                      }}
                    >
                      ₦
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: "#0b1c30",
                      fontFamily: "Plus Jakarta Sans",
                    }}
                  >
                    Naira
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "#f8fafc",
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 9999,
                      borderWidth: 1,
                      borderColor: "#f1f5f9",
                    }}
                  >
                    <Text
                      style={{
                        color: "#5b5e66",
                        fontSize: 11,
                        fontWeight: "700",
                        fontFamily: "Plus Jakarta Sans",
                      }}
                    >
                      Balance: ₦5,200
                    </Text>
                  </View>
                  <ChevronRight color="#c5c5d8" size={16} />
                </View>
              </Pressable>

              {/* Option 2: cNGN */}
              {/* <Pressable
                onPress={() => setPaymentMethod("cngn")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  borderWidth: 1,
                  borderRadius: 16,
                  backgroundColor: "#ffffff",
                  borderColor: paymentMethod === "cngn" ? "#001caa" : "#e5eeff",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 2,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#ffffff",
                      borderColor:
                        paymentMethod === "cngn" ? "#001caa" : "#cbd5e1",
                    }}
                  >
                    {paymentMethod === "cngn" && (
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          backgroundColor: "#001caa",
                          borderRadius: 6,
                        }}
                      />
                    )}
                  </View>

                 
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: "#000000",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#ffffff",
                        fontWeight: "800",
                        fontSize: 9,
                        fontFamily: "Plus Jakarta Sans",
                      }}
                    >
                      cNGN
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: "#0b1c30",
                      fontFamily: "Plus Jakarta Sans",
                    }}
                  >
                    cNGN
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "#f8fafc",
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 9999,
                      borderWidth: 1,
                      borderColor: "#f1f5f9",
                    }}
                  >
                    <Text
                      style={{
                        color: "#5b5e66",
                        fontSize: 11,
                        fontWeight: "700",
                        fontFamily: "Plus Jakarta Sans",
                      }}
                    >
                      Balance: cNGN 12.50
                    </Text>
                  </View>
                  <ChevronRight color="#c5c5d8" size={16} />
                </View>
              </Pressable> */}
            </View>

            {/* Fare Breakdown Details Card */}
            {/* <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: "#e5eeff",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
                gap: 14,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#5b5e66",
                    fontSize: 13,
                    fontWeight: "500",
                    fontFamily: "Plus Jakarta Sans",
                  }}
                >
                  Fare
                </Text>
                <Text
                  style={{
                    color: "#0b1c30",
                    fontSize: 13,
                    fontWeight: "700",
                    fontFamily: "Plus Jakarta Sans",
                  }}
                >
                  ₦{basePrice}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Text
                    style={{
                      color: "#5b5e66",
                      fontSize: 13,
                      fontWeight: "500",
                      fontFamily: "Plus Jakarta Sans",
                    }}
                  >
                    Service fee
                  </Text>
                  <Info color="#5b5e66" size={11} />
                </View>
                <Text
                  style={{
                    color: "#0b1c30",
                    fontSize: 13,
                    fontWeight: "700",
                    fontFamily: "Plus Jakarta Sans",
                  }}
                >
                  ₦{serviceFee}
                </Text>
              </View>

              {isPriority && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#5b5e66",
                      fontSize: 13,
                      fontWeight: "500",
                      fontFamily: "Plus Jakarta Sans",
                    }}
                  >
                    Priority (skip the queue)
                  </Text>
                  <Text
                    style={{
                      color: "#0b1c30",
                      fontSize: 13,
                      fontWeight: "700",
                      fontFamily: "Plus Jakarta Sans",
                    }}
                  >
                    ₦{priorityFee}
                  </Text>
                </View>
              )}

              <View
                style={{
                  height: 1,
                  backgroundColor: "#f1f5f9",
                  marginVertical: 4,
                }}
              />

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#0b1c30",
                    fontWeight: "800",
                    fontSize: 15,
                    fontFamily: "Plus Jakarta Sans",
                  }}
                >
                  Total
                </Text>
                <Text
                  style={{
                    color: "#0b1c30",
                    fontWeight: "800",
                    fontSize: 15,
                    fontFamily: "Plus Jakarta Sans",
                  }}
                >
                  ₦{totalPrice}
                </Text>
              </View>
            </View> */}
          </View>
          {/* ) : null} */}
        </View>
      </ScrollView>

      <Modal
        visible={showPickupDropdown || showDestDropdown}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowPickupDropdown(false);
          setShowDestDropdown(false);
        }}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onPress={() => {
            setShowPickupDropdown(false);
            setShowDestDropdown(false);
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}
              className=" flex justify-center text-center"
            >
              {showPickupDropdown ? "Select Pickup" : "Select Destination"}
            </Text>
            <ScrollView>
              {campusStops.map((loc) => (
                <Pressable
                  key={loc.id}
                  onPress={() => {
                    if (showPickupDropdown) {
                      setPickup(loc.name);
                      setPickupDesc("");
                    } else {
                      setDestination(loc.name);
                      setDestinationDesc("");
                    }
                    setShowPickupDropdown(false);
                    setShowDestDropdown(false);
                  }}
                  style={{
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderColor: "#e0e0e0",
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{loc.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Floating Bottom Action Area */}
      <View className="absolute bottom-0 left-0 right-0 p-4 z-40">
        <View className="max-w-[600px] mx-auto w-full flex items-center">
          <Pressable
            onPress={handleFindRide}
            disabled={!pickup || !destination || loading}
            className={`w-[90%] h-14 rounded-2xl items-center justify-center shadow-md active:scale-[0.98] ${
              pickup && destination && !loading
                ? "bg-[#0b1c30]"
                : "bg-outline-variant/30"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text
                className={`text-action-lg font-bold font-jakarta ${
                  pickup && destination ? "text-white" : "text-secondary"
                }`}
              >
                {pickup && destination ? "Confirm Ride" : "Find ride"}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
