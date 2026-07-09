import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight, Info, User, Zap } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KekeIcon from "../../components/KekeIcon";
import { useApp } from "../../context/AppContext";
import { apiRequest } from "../../config/apiHelper";

export default function ConfirmRide() {
  const router = useRouter();
  const { activeTrip, confirmBooking } = useApp();
  const [isPriority, setIsPriority] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"naira" | "cngn">("naira");
  const [seats, setSeats] = useState(1);
  const [isSurgeActive, setIsSurgeActive] = useState(false);

  useEffect(() => {
    const checkSurge = async () => {
      const getStopId = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes("gate")) return "gate";
        if (lower.includes("library")) return "library";
        if (lower.includes("seet")) return "seet";
        if (lower.includes("town")) return "town";
        return "seet";
      };
      const zone = getStopId(activeTrip.pickup);
      try {
        const res = await apiRequest<{ zone: string; surge: "on" | "off" }>(`/surge/${zone}`);
        setIsSurgeActive(res.surge === "on");
      } catch (e) {
        console.error("Surge query failed:", e);
      }
    };
    checkSurge();
  }, [activeTrip.pickup]);

  const basePrice = activeTrip.rideType === "keke" ? (seats * 150) : 150;
  const serviceFee = activeTrip.rideType === "keke" ? 50 : 20;
  const priorityFee = 100;
  const totalPrice = basePrice + serviceFee + (isPriority && isSurgeActive ? priorityFee : 0);

  const handleConfirm = async () => {
    await confirmBooking(isPriority && isSurgeActive, paymentMethod, seats);
    router.replace("/(rider)/tracking");
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
        {/* Map Preview */}
        <View
          style={{
            width: "100%",
            height: 192,
            backgroundColor: "#ffffff",
            borderRadius: 28,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "rgba(197, 197, 216, 0.15)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
            position: "relative",
          }}
        >
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhChECydpDyPgt27hlQrat9Rk2U89C00BRo9HxQfDmpSr4MRrxjAG1pGL6iwr1A__rTa5hkvxx5VNhyBHIwUrgEL1XAzRh3vdUsCbmpnjEWdd5tXIJyvuoNbsf17_pEryhtId0Y6snYs2mm-iQfYuoPK3Zrsg2EAG-XD5-Bq8QCQpcEyE5GcSDWhm7yhm20vy7oBcRqJFt0hbOoiU-LdxjqFg6qiW_P7A1aJmd6buI9IlGZRklUN8jk7Fl9tud8gafRai7G4XXH9hL",
            }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          {/* Simulated route overlay icons */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
            }}
            pointerEvents="none"
          >
            <View
              style={{
                position: "absolute",
                top: "40%",
                left: "30%",
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#001caa",
                borderWidth: 2,
                borderColor: "#ffffff",
              }}
            />
            <View
              style={{
                position: "absolute",
                top: "50%",
                left: "60%",
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: "#001caa",
                borderWidth: 2,
                borderColor: "#ffffff",
              }}
            />
            <View
              style={{
                position: "absolute",
                top: "45%",
                left: "35%",
                width: "45%",
                height: 4,
                backgroundColor: "rgba(0, 28, 170, 0.8)",
                transform: [{ rotate: "18deg" }],
              }}
            />
            <View
              style={{
                position: "absolute",
                top: "38%",
                left: "48%",
                backgroundColor: "#ffffff",
                padding: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "rgba(197, 197, 216, 0.15)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <KekeIcon size={20} color="#001caa" />
            </View>
          </View>
        </View>

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
              gap: 16,
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
              <KekeIcon size={38} color="#001caa" />
            </View>
            <View style={{ flex: 1 }}>
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
                  color: "#5b5e66",
                  fontSize: 12,
                  fontFamily: "Plus Jakarta Sans",
                  marginTop: 4,
                }}
              >
                5 min away • 1.6 km
              </Text>
              {/* Interactive Seats selector (Keke only) */}
              {activeTrip.rideType === "keke" ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    marginTop: 8,
                  }}
                >
                  <Pressable
                    onPress={() => setSeats((s) => Math.max(1, s - 1))}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: "#eff3ff",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#001caa", fontWeight: "900", fontSize: 16 }}>-</Text>
                  </Pressable>
                  <Text style={{ fontFamily: "Plus Jakarta Sans", fontSize: 13, fontWeight: "700", color: "#0b1c30" }}>
                    {seats} seat{seats > 1 ? "s" : ""}
                  </Text>
                  <Pressable
                    onPress={() => setSeats((s) => Math.min(4, s + 1))}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: "#eff3ff",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#001caa", fontWeight: "900", fontSize: 16 }}>+</Text>
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

          <View style={{ alignItems: "flex-end" }}>
            <Text
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
            </View>
          </View>
        </View>

        {/* Priority Banner Card — only shown during active surge on keke rides */}
        {activeTrip.rideType === "keke" && isSurgeActive && (
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
                <Zap color="#001caa" size={18} fill="#001caa" />
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
        )}

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
        <View style={{ gap: 14 }}>
          {/* Option 1: Naira */}
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
              borderColor: paymentMethod === "naira" ? "#001caa" : "#e5eeff",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
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

          {/* Option 2: cNGN */}
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
              borderColor: paymentMethod === "cngn" ? "#001caa" : "#e5eeff",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
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
                  borderColor: paymentMethod === "cngn" ? "#001caa" : "#cbd5e1",
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

              {/* Currency Logo */}
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
        </View>

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

          <View
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

      {/* Fixed bottom action button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          // backgroundColor: "#ffffff",
          // borderTopWidth: 1,
          // borderTopColor: "rgba(197, 197, 216, 0.2)",
          padding: 20,
          zIndex: 40,
        }}
      >
        {/* <View style={{ maxWidth: 600, alignSelf: "center", width: "100%" }}> */}
        <Pressable
          onPress={handleConfirm}
          className="bg-primary text-white active:bg-primary/80  rounded-3xl w-fit mx-auto px-12 py-4"
          style={({ pressed }) => ({
            // width: "100%",
            height: 56,

            // backgroundColor: "#000000",
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text
            style={{
              // color: "#ffffff",
              fontSize: 16,
              fontWeight: "700",
              fontFamily: "Plus Jakarta Sans",
            }}
            className="text-white"
          >
            Confirm Ride
          </Text>
        </Pressable>
        {/* </View> */}
      </View>
    </SafeAreaView>
  );
}
