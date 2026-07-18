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
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KekeIcon from "../../components/KekeIcon";
import { useApp } from "../../context/AppContext";

export default function LiveTracking() {
  const router = useRouter();
  const { activeTrip, setActiveTrip, cancelBooking, completeTrip } = useApp();
  const [showScanner, setShowScanner] = useState(false);
  const [scanStatus, setScanStatus] = useState("Align QR code within the frame...");
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [verifyingPin, setVerifyingPin] = useState(false);

  const handlePinSubmit = async () => {
    if (!pinInput.trim()) return;
    setVerifyingPin(true);
    try {
      await completeTrip({ pin: pinInput.trim() });
      setShowPinModal(false);
      router.replace("/(rider)/receipt");
    } catch (err: any) {
      Alert.alert("Verification Failed", err.message || "Invalid PIN. Please try again.");
    } finally {
      setVerifyingPin(false);
    }
  };

  const driverState = activeTrip.status === "confirmed" ? "assigned"
    : activeTrip.status === "tracking" ? "arriving"
    : activeTrip.status === "arrived" ? "arrived"
    : "assigned";

  // Simulate scanning when modal opens
  useEffect(() => {
    let t1: any, t2: any;
    if (showScanner) {
      setScanStatus("Focusing camera...");
      t1 = setTimeout(() => {
        setScanStatus("QR code detected! Verifying with backend...");
      }, 1200);

      t2 = setTimeout(async () => {
        try {
          await completeTrip(); // automatically uses activeTrip.qrToken from context
          setShowScanner(false);
          router.replace("/(rider)/receipt");
        } catch (err: any) {
          setScanStatus(`Verification failed: ${err.message}`);
          setTimeout(() => setShowScanner(false), 2000);
        }
      }, 2500);
    }
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [showScanner]);

  const handleCancel = () => {
    Alert.alert(
      "Cancel Ride",
      "Are you sure you want to cancel your ride?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelBooking();
              router.replace("/(rider)/home");
            } catch (error: any) {
              Alert.alert(
                "Cancellation Failed",
                error.message || "Failed to cancel ride.",
              );
            }
          },
        },
      ]
    );
  };

  const handleVerifyComplete = () => {
    setShowScanner(true);
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
        {/* <Pressable
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
        </Pressable> */}
        <Pressable
          onPress={() => {
            setActiveTrip((prev) => {
              let nextStatus: typeof prev.status = "confirmed";
              if (prev.status === "confirmed" || prev.status === "idle" || prev.status === "searching") {
                nextStatus = "tracking";
              } else if (prev.status === "tracking") {
                nextStatus = "arrived";
              } else if (prev.status === "arrived") {
                nextStatus = "confirmed";
              }
              return { ...prev, status: nextStatus };
            });
          }}
          style={({ pressed }) => ({
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 12,
            backgroundColor: "#eff4ff",
            borderWidth: 1,
            borderColor: "#001caa",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text
            style={{
              color: "#001caa",
              fontSize: 11,
              fontWeight: "700",
              fontFamily: "Plus Jakarta Sans",
            }}
          >
            Simulate
          </Text>
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
                  Scan the driver's QR code after the ride to pay for the trip
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
                className="flex justify-center items-center"
              >
                <Maximize color="#000c61" size={35} className=""/>
                <Text
                  style={{
                    color: "#000c61",
                    fontWeight: "700",
                    fontSize: 15,
                    fontFamily: "Plus Jakarta Sans",
                  }}
                >
                  Scan QR Code
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setShowPinModal(true)}
                style={({ pressed }) => ({
                  width: "100%",
                  borderWidth: 1.5,
                  borderColor: "#001caa",
                  height: 56,
                  borderRadius: 28,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: pressed ? 0.8 : 1,
                  marginTop: 4,
                })}
              >
                <Text
                  style={{
                    color: "#001caa",
                    fontWeight: "700",
                    fontSize: 15,
                    fontFamily: "Plus Jakarta Sans",
                  }}
                >
                  Enter PIN Instead
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
          className="flex self-center mx-auto p-4 rounded-3xl px-14 border bg-error-container border-error-container flex-row gap-4 items-center justify-center"
            onPress={handleCancel}
            style={({ pressed }) => ({
              width: "100%",
              height: 56,
              borderWidth: 1,
              // borderColor: "#ffe0e0",
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
            <XCircle color="#ba1a1a" size={22} />
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

      {/* Dynamic simulated scanner modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowScanner(false)}
      >
        <SafeAreaView className="flex-1 bg-[#0b1c30] justify-between p-6">
          <View className="flex-row justify-between items-center h-16">
            <Pressable
              onPress={() => setShowScanner(false)}
              className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center active:bg-white/20"
            >
              <ArrowLeft color="#ffffff" size={24} />
            </Pressable>
            <Text className="text-white text-lg font-bold font-jakarta">Scan Verification QR</Text>
            <View className="w-12" />
          </View>

          {/* Scanner UI frame */}
          <View className="align-center items-center justify-center flex-1 my-6">
            <View className="w-64 h-64 border-2 border-primary rounded-3xl relative items-center justify-center p-4 bg-white/5">
              <View className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <View className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <View className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <View className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              <ActivityIndicator size="large" color="#001caa" />
            </View>
            <Text className="text-white/80 font-bold text-center mt-8 px-8 font-jakarta leading-5 text-sm">
              {scanStatus}
            </Text>
          </View>

          <View className="items-center pb-8">
            <Text className="text-white/40 text-xs font-jakarta">
              Verify scanning on FUTO-Ride backend API
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
      {/* PIN Input Modal */}
      <Modal
        visible={showPinModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPinModal(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center p-6">
          <View className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-xl items-center">
            <Text className="text-[18px] font-bold text-on-surface font-jakarta text-center">
              Enter Ride PIN
            </Text>
            <Text className="text-secondary text-center text-xs font-jakarta mt-2 px-2 leading-4">
              Ask your driver for the trip completion PIN and enter it below to confirm boarding and pay.
            </Text>

            <TextInput
              value={pinInput}
              onChangeText={setPinInput}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="e.g. 1234"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 text-center text-[18px] font-bold mt-6 font-jakarta"
              placeholderTextColor="#94a3b8"
              autoFocus={true}
              style={{ letterSpacing: 8 }}
            />

            <View className="flex-row gap-3 w-full mt-6">
              <Pressable
                onPress={() => {
                  setShowPinModal(false);
                  setPinInput("");
                }}
                className="flex-1 border border-outline/20 rounded-2xl h-12 items-center justify-center active:bg-slate-50"
              >
                <Text className="text-secondary font-bold text-[14px] font-jakarta">
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handlePinSubmit}
                disabled={verifyingPin}
                className="flex-1 bg-primary rounded-2xl h-12 items-center justify-center active:opacity-90"
              >
                {verifyingPin ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-[14px] font-jakarta">
                    Submit
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
