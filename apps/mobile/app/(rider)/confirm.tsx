import { useRouter } from "expo-router";
import { ArrowLeft, Clock, Info } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KekeIcon from "../../components/KekeIcon";
import { apiRequest } from "../../config/apiHelper";
import { useApp } from "../../context/AppContext";

export default function ConfirmRide() {
  const router = useRouter();
  const {
    activeTrip,
    confirmBooking,
    cancelBooking,
    getStopId,
    bookedRequest,
    setBookedRequest,
    setActiveTrip,
    isSurgeActive,
  } = useApp();
  const [isPriority, setIsPriority] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"naira" | "cngn">("naira");
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  // const [isSurgeActive, setIsSurgeActive] = useState(false);
 
  const handleCancel = async () => {
    try {
      await cancelBooking();
      router.replace("/(rider)/book");
    } catch (error: any) {
      Alert.alert(
        "Cancellation Failed",
        error.message || "Failed to cancel ride.",
      );
    }
  };
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const etaVal = bookedRequest?.etaMin ?? (bookedRequest as any)?.eta;
    const etaMinutes = etaVal ? parseInt(String(etaVal), 10) : 5;
    if (!isNaN(etaMinutes)) {
      setTimeLeft(etaMinutes * 60);
    } else {
      setTimeLeft(5 * 60);
    }
  }, [bookedRequest]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    const expiresAt = bookedRequest?.expiresAt;
    if (expiresAt) {
      const calculateTimeLeft = () => {
        const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        setPaymentTimeLeft(diff);
      };

      calculateTimeLeft();
      const timer = setInterval(() => {
        const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        setPaymentTimeLeft(diff);
        if (diff <= 0) {
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [bookedRequest]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // useEffect(() => {
  //   const checkSurge = async () => {
  //     const zone = getStopId(activeTrip.pickup);
  //     try {
  //       const res = await apiRequest<{ zone: string; surge: "on" | "off" }>(`/surge/${zone}`);
  //       setIsSurgeActive(res.surge === "on");
  //     } catch (e) {
  //       console.error("Surge query failed:", e);
  //     }
  //   };
  //   checkSurge();
  // }, [activeTrip.pickup]);

  const basePrice =
    activeTrip.rideType === "keke" ? seats * (bookedRequest?.fare ?? 0) : 150;
  const serviceFee = activeTrip.rideType === "keke" ? 50 : 20;
  const priorityFee = 100;
  const totalPrice =
    basePrice + serviceFee + (isPriority && isSurgeActive ? priorityFee : 0);

  const handleConfirm = async () => {
    if (!bookedRequest) return;
    setLoading(true);
    try {
      // 1. Call the payment bypass API to mark the ride as paid
      await apiRequest("/payments/bypass", "POST", {
        rideId: bookedRequest.rideId,
      });

      // 2. Set the active trip in context so the real-time listener starts tracking
      setActiveTrip({
        pickup: activeTrip.pickup,
        destination: activeTrip.destination,
        rideType: activeTrip.rideType,
        rideId: bookedRequest.rideId,
        driverId: bookedRequest.driverId || "",
        price: (bookedRequest.fare || 30000) / 100, // convert kobo to Naira
        driverName: "Searching...",
        driverRating: 5.0,
        driverPhone: "",
        vehicleNumber: "",
        eta: bookedRequest.etaMin ? `${bookedRequest.etaMin} mins` : "5 mins",
        status: "confirmed",
        stepIndex: 0,
      });

      // 3. Clear booked request and navigate to tracking page
      setBookedRequest(null);
      router.replace("/(rider)/tracking");
    } catch (error: any) {
      Alert.alert("Payment Failed", error.message || "Failed to bypass payment.");
    } finally {
      setLoading(false);
    }
  };

  // Custom Toggle Switch
  const CustomSwitch = ({
    value,
    onValueChange,
  }: {
    value: boolean;
    onValueChange: (v: boolean) => void;
  }) => {
    return (
      <Pressable
        onPress={() => onValueChange(!value)}
        style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          padding: 2,
          justifyContent: "center",
          alignItems: value ? "flex-end" : "flex-start",
          backgroundColor: value ? "#059669" : "#cbd5e1",
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

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f8f9ff" }}
      edges={["top", "bottom"]}
    >
      {/* Top Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          height: 72,
          backgroundColor: "transparent",
        }}
      >
        <Pressable
          onPress={() => router.replace("/(rider)/book")}
          style={{ elevation: 1 }}
          className="w-12 h-12 rounded-2xl bg-white items-center justify-center  active:bg-surface-container"
        >
          <ArrowLeft color="#0B1C30" size={24} />
        </Pressable>

        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#0b1c30",
            fontFamily: "Plus Jakarta Sans",
          }}
        >
          Confirm Ride
        </Text>

        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Ride Option details Card */}
        <View
          style={{
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderColor: "#e5eeff",
            borderRadius: 24,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              flex: 1,
            }}
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
              <KekeIcon size={38} color="#059669" />
            </View>
            <View style={{ flex: 1 }} className="">
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: "#0b1c30",
                  fontFamily: "Plus Jakarta Sans",
                }}
              >
                {activeTrip.rideType === "keke" ? "Keke" : "Bus"}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: "#0b1c30",
                  fontFamily: "Plus Jakarta Sans",
                }}
              >
              {`${bookedRequest?.seats || 0}/4 seat${(bookedRequest?.seats ?? 0) > 1 ? "s" : ""} booked`}
              </Text>
            </View>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "800",
                color: "#0b1c30",
                fontFamily: "Plus Jakarta Sans",
              }}
            >
              ₦{bookedRequest?.fare ?? 0}
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
            </View>
          </View>
        </View>

        {/* Countdown Card */}
        {timeLeft !== null && (
          <View
            style={{
              backgroundColor: "#f4f7ff",
              borderWidth: 1,
              borderColor: "#dbe5ff",
              borderRadius: 24,
              padding: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              marginTop: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                backgroundColor: "#eff3ff",
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#e5eeff",
              }}
            >
              <Clock size={24} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: "#5b5e66",
                  fontFamily: "Plus Jakarta Sans",
                }}
              >
                Estimated Driver Arrival
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: "#0b1c30",
                  fontFamily: "Plus Jakarta Sans",
                  marginTop: 2,
                }}
              >
                {timeLeft > 0
                  ? `Arriving in ${formatCountdown(timeLeft)}`
                  : "Driver is here!"}
              </Text>
            </View>
          </View>
        )}

        {/* Payment Expiry Card */}
        {paymentTimeLeft !== null && paymentTimeLeft > 0 && (
          <View
            style={{
              backgroundColor: "#fff5f5",
              borderWidth: 1,
              borderColor: "#ffe0e0",
              borderRadius: 24,
              padding: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              marginTop: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                backgroundColor: "#ffebeb",
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#ffe0e0",
              }}
            >
              <Clock size={24} color="#ba1a1a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: "#7a5c5c",
                  fontFamily: "Plus Jakarta Sans",
                }}
              >
                Payment Window Expiry
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: "#ba1a1a",
                  fontFamily: "Plus Jakarta Sans",
                  marginTop: 2,
                }}
              >
                Ride gets cancelled in {formatCountdown(paymentTimeLeft ?? 0)}
              </Text>
            </View>
          </View>
        )}

        {/* Priority Banner Card — only shown during active surge on keke rides */}
        {/* {activeTrip.rideType === "keke" && isSurgeActive && (
          <View
            style={{
              backgroundColor: "#eff3ff",
              padding: 18,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "#dce9ff",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
              marginTop: 16,
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
                  width: 44,
                  height: 44,
                  backgroundColor: "#ffffff",
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#e5eeff",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 1,
                  elevation: 1,
                }}
              >
                <Zap color="#059669" size={18} fill="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#0b1c30",
                    fontSize: 14,
                    fontWeight: "700",
                    fontFamily: "Plus Jakarta Sans",
                  }}
                >
                  Priority — skip the queue
                </Text>
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
              </View>
            </View>
            <CustomSwitch value={isPriority} onValueChange={setIsPriority} />
          </View>
        )} */}

        {/* Payment selector label */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: "#5b5e66",
            fontFamily: "Plus Jakarta Sans",
            marginTop: 24,
            marginBottom: 12,
          }}
        >
          Payment method
        </Text>

        {/* Payment Selector Cards */}
        {/* <View style={{ gap: 14 }}>
          <Pressable
            onPress={() => setPaymentMethod("naira")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              borderWidth: 1,
              borderRadius: 16,
              backgroundColor: "#ffffff",
              borderColor: paymentMethod === "naira" ? "#059669" : "#e5eeff",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
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
                    paymentMethod === "naira" ? "#059669" : "#cbd5e1",
                }}
              >
                {paymentMethod === "naira" && (
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: "#059669",
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
                  backgroundColor: "#059669",
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
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
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

          <Pressable
            onPress={() => setPaymentMethod("cngn")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              borderWidth: 1,
              borderRadius: 16,
              backgroundColor: "#ffffff",
              borderColor: paymentMethod === "cngn" ? "#059669" : "#e5eeff",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
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
                  borderColor: paymentMethod === "cngn" ? "#059669" : "#cbd5e1",
                }}
              >
                {paymentMethod === "cngn" && (
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: "#059669",
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
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
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
          </Pressable>
        </View> */}

        {/* Fare Breakdown Details Card */}
        <View
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
            marginTop: 24,
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

          {/* <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text
                style={{
                  color: "#5b5e66",
                  fontSize: 13,
                  fontWeight: "500",
                  fontFamily: "Plus Jakarta Sans",
                }}
              >
                Priority fee
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
              ₦{"50"}
            </Text>
          </View> */}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              opacity: isSurgeActive ? 1 : 0.5,
            }}
            className="w-full "
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
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
              ₦{isSurgeActive ? priorityFee : 0}
            </Text>
          </View>

          <View
            style={{ height: 1, backgroundColor: "#f1f5f9", marginVertical: 4 }}
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
        </View>
      </ScrollView>

      {/* Fixed bottom action buttons */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 20,
          zIndex: 40,
          // backgroundColor: "#ffffff",
          // borderTopWidth: 1,
          // borderTopColor: "rgba(197, 197, 216, 0.2)",
        }}
        
        // className="bg-red-400 "
      >
        <View style={{ flexDirection: "row", gap: 12, maxWidth: 600, alignSelf: "center", width: "100%" }}>
        <Pressable
          onPress={handleCancel}
          style={({ pressed }) => ({
            flex: 1,
            height: 56,
            borderRadius: 28,
            borderWidth: 1.5,
            borderColor: "#ba1a1a",
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.5 : 1,
          })}
          className="bg-error flex-1 p-3 justify-center items-center rounded-3xl"
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              fontFamily: "Plus Jakarta Sans",
            }}
            className="text-on-error"
          >
            Cancel Ride
          </Text>
        </Pressable>

        <Pressable
          onPress={handleConfirm}
          disabled={loading}
          style={({ pressed }) => ({
            flex: 1.2,
            height: 56,
            // backgroundColor: "#059669",
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
            opacity: pressed || loading ? 0.5 : 1,
          })}
          className=" bg-primary flex-1 p-3 justify-center items-center rounded-3xl"
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text
              style={{
                // color: "#ffffff",
                fontSize: 16,
                fontWeight: "700",
                fontFamily: "Plus Jakarta Sans",
              }}
              className="  text-white"
            >
              Confirm Ride
            </Text>
          )}
        </Pressable>
      </View>
      </View>
    </SafeAreaView>
  );
}
