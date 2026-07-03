import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Check,
  Info,
  MapPin,
  Maximize,
  MessageSquare,
  Phone,
  Shield,
  ShieldAlert,
  Star,
  User,
  XCircle,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KekeIcon from "../../components/KekeIcon";
import { useApp } from "../../context/AppContext";

export default function LiveTracking() {
  const router = useRouter();
  const { activeTrip, cancelBooking, completeTrip } = useApp();
  const [driverState, setDriverState] = useState<"assigned" | "arriving" | "arrived">("assigned");

  useEffect(() => {
    // Simulate real-time tracking progression
    const timer1 = setTimeout(() => {
      setDriverState("arriving");
    }, 4000);

    const timer2 = setTimeout(() => {
      setDriverState("arrived");
    }, 10000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleCancel = () => {
    Alert.alert(
      "Cancel Ride",
      "Are you sure you want to cancel your ride?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            cancelBooking();
            router.replace("/(rider)/home");
          },
        },
      ]
    );
  };

  const handleVerifyComplete = () => {
    completeTrip();
    router.replace("/(rider)/receipt");
  };

  // Helper to render Stepper Node dynamically
  const renderStepNode = (step: number) => {
    if (step === 1) {
      // Assigned Step
      return (
        <View style={{ alignItems: "center", zIndex: 10 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#001caa",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: "#ffffff",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 1,
              elevation: 1,
            }}
          >
            <User color="#ffffff" size={13} />
          </View>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: "#0b1c30",
              fontFamily: "Plus Jakarta Sans",
              marginTop: 8,
            }}
          >
            Assigned
          </Text>
          <Text
            style={{
              fontSize: 10,
              color: "#5b5e66",
              fontWeight: "500",
              fontFamily: "Plus Jakarta Sans",
              marginTop: 2,
            }}
          >
            11:24 AM
          </Text>
        </View>
      );
    } else if (step === 2) {
      // Arriving Step
      const isActive = driverState === "arriving";
      const isCompleted = driverState === "arrived";

      return (
        <View style={{ alignItems: "center", zIndex: 10 }}>
          {isCompleted ? (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#001caa",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "#ffffff",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 1,
                elevation: 1,
              }}
            >
              <Check color="#ffffff" size={13} strokeWidth={3} />
            </View>
          ) : isActive ? (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#001caa",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "#ffffff",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 1,
                elevation: 1,
              }}
            >
              <KekeIcon size={16} color="#ffffff" />
            </View>
          ) : (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#cbd5e1",
                backgroundColor: "#ffffff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <KekeIcon size={16} color="#94a3b8" />
            </View>
          )}
          <Text
            style={{
              fontSize: 11,
              fontFamily: "Plus Jakarta Sans",
              marginTop: 8,
              fontWeight: "700",
              color: isActive || isCompleted ? "#0b1c30" : "#5b5e66",
            }}
          >
            Arriving
          </Text>
          <Text
            style={{
              fontSize: 10,
              fontFamily: "Plus Jakarta Sans",
              marginTop: 2,
              fontWeight: isActive ? "700" : "500",
              color: isActive ? "#001caa" : "#5b5e66",
            }}
          >
            In 3:45 min
          </Text>
        </View>
      );
    } else {
      // Arrived Step
      const isCompleted = driverState === "arrived";

      return (
        <View style={{ alignItems: "center", zIndex: 10 }}>
          {isCompleted ? (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#22c55e",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "#ffffff",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 1,
                elevation: 1,
              }}
            >
              <Check color="#ffffff" size={13} strokeWidth={3} />
            </View>
          ) : (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#cbd5e1",
                backgroundColor: "#ffffff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check color="#94a3b8" size={13} />
            </View>
          )}
          <Text
            style={{
              fontSize: 11,
              fontFamily: "Plus Jakarta Sans",
              marginTop: 8,
              fontWeight: "700",
              color: isCompleted ? "#22c55e" : "#5b5e66",
            }}
          >
            Arrived
          </Text>
          <Text
            style={{
              fontSize: 10,
              color: "#5b5e66",
              fontWeight: "500",
              fontFamily: "Plus Jakarta Sans",
              marginTop: 2,
            }}
          >
            {isCompleted ? "Ready" : "-"}
          </Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9ff" }} edges={["top", "bottom"]}>
      {/* Top Header Row */}
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
          onPress={() => {
            cancelBooking();
            router.replace("/(rider)/home");
          }}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: "#ffffff",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(197, 197, 216, 0.15)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <ArrowLeft color="#0B1C30" size={20} />
        </Pressable>

        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#0b1c30",
            fontFamily: "Plus Jakarta Sans",
          }}
        >
          Live Tracking
        </Text>

        <Pressable
          onPress={() => router.push("/sos")}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: "#ffffff",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(197, 197, 216, 0.15)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <ShieldAlert color="#ba1a1a" size={18} />
            <Text
              style={{
                fontSize: 8,
                fontWeight: "800",
                color: "#ba1a1a",
                fontFamily: "Plus Jakarta Sans",
                letterSpacing: -0.2,
                marginTop: 2,
              }}
            >
              SOS
            </Text>
          </View>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Map Area */}
        <View
          style={{
            height: 300,
            position: "relative",
            width: "100%",
            overflow: "hidden",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(197, 197, 216, 0.15)",
          }}
        >
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhChECydpDyPgt27hlQrat9Rk2U89C00BRo9HxQfDmpSr4MRrxjAG1pGL6iwr1A__rTa5hkvxx5VNhyBHIwUrgEL1XAzRh3vdUsCbmpnjEWdd5tXIJyvuoNbsf17_pEryhtId0Y6snYs2mm-iQfYuoPK3Zrsg2EAG-XD5-Bq8QCQpcEyE5GcSDWhm7yhm20vy7oBcRqJFt0hbOoiU-LdxjqFg6qiW_P7A1aJmd6buI9IlGZRklUN8jk7Fl9tud8gafRai7G4XXH9hL",
            }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />

          {/* Floating Map Overlays */}
          {/* 1. Arriving in (top-left) */}
          <View
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              backgroundColor: "#ffffff",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#e5eeff",
              padding: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Text
              style={{
                color: "#5b5e66",
                fontSize: 10,
                fontWeight: "500",
                fontFamily: "Plus Jakarta Sans",
                lineHeight: 10,
              }}
            >
              Arriving in
            </Text>
            <Text
              style={{
                color: "#001caa",
                fontSize: 15,
                fontWeight: "800",
                fontFamily: "Plus Jakarta Sans",
                marginTop: 4,
                lineHeight: 15,
              }}
            >
              3:45 min
            </Text>
          </View>

          {/* 2. Pickup address (top-right) */}
          <View
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              backgroundColor: "#ffffff",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#e5eeff",
              padding: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              maxWidth: 180,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                backgroundColor: "#001caa",
                borderRadius: 3,
                marginTop: 2,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#5b5e66",
                  fontSize: 9,
                  fontWeight: "500",
                  fontFamily: "Plus Jakarta Sans",
                  lineHeight: 9,
                }}
              >
                Pickup
              </Text>
              <Text
                style={{
                  color: "#0b1c30",
                  fontSize: 11,
                  fontWeight: "700",
                  fontFamily: "Plus Jakarta Sans",
                  marginTop: 4,
                  lineHeight: 11,
                }}
                numberOfLines={1}
              >
                {activeTrip.pickup || "Parañaque City Hall"}
              </Text>
            </View>
          </View>

          {/* 3. Your location (bottom-left) */}
          <View
            style={{
              position: "absolute",
              bottom: 16,
              left: 16,
              backgroundColor: "#ffffff",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#e5eeff",
              paddingHorizontal: 10,
              paddingVertical: 6,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Text
              style={{
                color: "#0b1c30",
                fontSize: 10,
                fontWeight: "700",
                fontFamily: "Plus Jakarta Sans",
              }}
            >
              Your location
            </Text>
          </View>

          {/* Pulsing Driver vehicle Marker */}
          {driverState !== "arrived" && (
            <View
              style={{
                position: "absolute",
                top: "42%",
                left: "49%",
                marginTop: -24,
                marginLeft: -24,
                backgroundColor: "#ffffff",
                borderRadius: 16,
                padding: 8,
                borderWidth: 1,
                borderColor: "rgba(197, 197, 216, 0.15)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <KekeIcon size={28} color="#001caa" />
            </View>
          )}

          {/* Pulsing User/Pickup Location Marker */}
          <View
            style={{
              position: "absolute",
              top: "52%",
              left: "45%",
              marginTop: -12,
              marginLeft: -12,
              width: 24,
              height: 24,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                position: "absolute",
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "rgba(0, 28, 170, 0.2)",
              }}
            />
            <View
              style={{
                width: 14,
                height: 14,
                backgroundColor: "#001caa",
                borderRadius: 7,
                borderWidth: 2,
                borderColor: "#ffffff",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 1,
                elevation: 1,
              }}
            />
          </View>
        </View>

        {/* Details & Status Section below Map */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 24, gap: 20 }}>
          {/* Driver Profile Card */}
          <View
            style={{
              backgroundColor: "#ffffff",
              padding: 18,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "#e5eeff",
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14, flex: 1 }}>
              <View style={{ position: "relative" }}>
                <Image
                  source={{
                    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjFSCFMbV7btYNBq5Z_NmptfAr1-8my1GvNRPgRRaOLLPEtqioVZ_2mjlIyJLLQ-ioQ4du4wFmsS6KnXMp2aSQZLLeQDRfId6gfO90HKV18JnRFc14-vwUWfgVzqp_O9q2fTdD4xoCrWVFrt24XLi9lmTNUKrlnSTxrGFEP9Neh75LbWKZStV1fz0IhdzbgCsD7BEvcl2HqdEwOMjtsiS4w1MHWeE2VzoZ4dv5ECAAb8wYva0TgLQY9k_FVIDFN-dv7uCj9XMJdlV7",
                  }}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.2)",
                  }}
                />
                <View
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor: "#22c55e",
                    borderWidth: 2,
                    borderColor: "#ffffff",
                    borderRadius: 8,
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                  }}
                />
              </View>

              <View style={{ flex: 1, justifyContent: "center" }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#0b1c30",
                    fontFamily: "Plus Jakarta Sans",
                    lineHeight: 15,
                  }}
                >
                  Usman Abubakar
                </Text>
                <Text
                  style={{
                    color: "#001caa",
                    fontWeight: "700",
                    fontSize: 12,
                    fontFamily: "Plus Jakarta Sans",
                    marginTop: 6,
                    lineHeight: 12,
                  }}
                >
                  ABC 123 XY
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
                  <KekeIcon size={12} color="#5b5e66" />
                  <Text
                    style={{
                      color: "#5b5e66",
                      fontSize: 11,
                      fontWeight: "500",
                      fontFamily: "Plus Jakarta Sans",
                      lineHeight: 11,
                    }}
                  >
                    Blue Keke
                  </Text>
                  <View style={{ width: 4, height: 4, backgroundColor: "#cbd5e1", borderRadius: 2 }} />
                  <Star color="#f59e0b" fill="#f59e0b" size={11} />
                  <Text
                    style={{
                      color: "#5b5e66",
                      fontSize: 11,
                      fontWeight: "500",
                      fontFamily: "Plus Jakarta Sans",
                      lineHeight: 11,
                    }}
                  >
                    4.8 (120 trips)
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={() => Alert.alert("Call", "Calling driver Usman...")}
              style={({ pressed }) => ({
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: "#eff3ff",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#e5eeff",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 1,
                elevation: 1,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Phone color="#001caa" size={18} />
            </Pressable>
          </View>

          {/* Stepper Progress Timeline */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 24,
              paddingVertical: 8,
              position: "relative",
            }}
          >
            <View
              style={{
                position: "absolute",
                left: 54,
                right: 54,
                top: 22,
                height: 1.5,
                borderStyle: "dashed",
                borderWidth: 1,
                borderColor: "#cbd5e1",
              }}
            />
            {driverState !== "assigned" && (
              <View
                style={{
                  position: "absolute",
                  left: 54,
                  top: 22,
                  height: 1.5,
                  backgroundColor: "#001caa",
                  width: driverState === "arriving" ? "42%" : "84%",
                }}
              />
            )}

            {renderStepNode(1)}
            {renderStepNode(2)}
            {renderStepNode(3)}
          </View>

          {/* Conditional Scan QR / Boarding Instruction Card */}
          {driverState === "arrived" ? (
            <View
              style={{
                backgroundColor: "rgba(0, 28, 170, 0.03)",
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(0, 28, 170, 0.08)",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
              }}
            >
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#0b1c30",
                    fontFamily: "Plus Jakarta Sans",
                  }}
                >
                  Ready to board?
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#5b5e66",
                    fontFamily: "Plus Jakarta Sans",
                    marginTop: 4,
                    textAlign: "center",
                    paddingHorizontal: 8,
                    lineHeight: 16,
                  }}
                >
                  Scan the driver's QR code to verify your ride and start the trip.
                </Text>
              </View>
              <Pressable
                onPress={handleVerifyComplete}
                style={({ pressed }) => ({
                  width: "100%",
                  backgroundColor: "#001caa",
                  height: 56,
                  borderRadius: 28,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 3,
                  elevation: 2,
                  opacity: pressed ? 0.95 : 1,
                })}
              >
                <Maximize color="#ffffff" size={18} />
                <Text
                  style={{
                    color: "#ffffff",
                    fontWeight: "700",
                    fontSize: 15,
                    fontFamily: "Plus Jakarta Sans",
                  }}
                >
                  Scan QR Code
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: "#eff3ff",
                borderWidth: 1,
                borderColor: "#dce9ff",
                padding: 18,
                borderRadius: 24,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 16,
                  backgroundColor: "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#e5eeff",
                }}
              >
                <Info color="#001caa" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#0b1c30",
                    fontSize: 12,
                    fontWeight: "700",
                    fontFamily: "Plus Jakarta Sans",
                  }}
                >
                  Your driver is on the way.
                </Text>
                <Text
                  style={{
                    color: "#5b5e66",
                    fontSize: 11,
                    fontWeight: "500",
                    fontFamily: "Plus Jakarta Sans",
                    marginTop: 2,
                    lineHeight: 16,
                  }}
                >
                  Please be ready at the pickup point.
                </Text>
              </View>
            </View>
          )}

          {/* Cancel button at bottom */}
          <Pressable
            onPress={handleCancel}
            style={({ pressed }) => ({
              width: "100%",
              height: 56,
              borderWidth: 1,
              borderColor: "#ffe0e0",
              borderRadius: 28,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 1,
              elevation: 1,
              backgroundColor: pressed ? "#fff5f5" : "#ffffff",
            })}
          >
            <XCircle color="#ba1a1a" size={18} />
            <Text
              style={{
                color: "#ba1a1a",
                fontWeight: "800",
                fontSize: 15,
                fontFamily: "Plus Jakarta Sans",
              }}
            >
              Cancel Ride
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
