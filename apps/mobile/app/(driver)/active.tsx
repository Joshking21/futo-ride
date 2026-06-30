import { useRouter } from "expo-router";
import {
  ArrowLeft,
  CornerUpRight,
  MessageSquare,
  Phone,
  ShieldAlert,
  Star,
} from "lucide-react-native";
import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KekeIcon from "../../components/KekeIcon";
import { useApp } from "../../context/AppContext";

export default function DriverActiveTrip() {
  const router = useRouter();
  const { activeTrip, progressDriverTrip } = useApp();
  const [tripState, setTripState] = useState<
    "arrived" | "start" | "dropoff" | "complete"
  >("arrived");

  const handleTripAction = () => {
    progressDriverTrip();
    if (tripState === "arrived") {
      setTripState("start");
    } else if (tripState === "start") {
      setTripState("dropoff");
    } else if (tripState === "dropoff") {
      setTripState("complete");
    } else {
      router.push("/(driver)/qr");
    }
  };

  const getButtonText = () => {
    if (tripState === "arrived") return "Arrived at Pickup";
    if (tripState === "start") return "Start Trip";
    if (tripState === "dropoff") return "At Dropoff Location";
    return "Complete Trip (Show QR)";
  };

  const getStatusTitle = () => {
    if (tripState === "arrived") return "Navigate to pickup";
    if (tripState === "start") return "Passenger Boarding";
    if (tripState === "dropoff") return "Navigate to destination";
    return "Arrived at destination";
  };

  const getStatusSubtitle = () => {
    if (tripState === "arrived") return "Alex is waiting at SOES Building";
    if (tripState === "start") return "Alex is boarding your Keke";
    if (tripState === "dropoff") return "Drop off Alex at Senate Building";
    return "Complete the trip and generate payment QR";
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f1f5f9" }}
      edges={["top", "bottom"]}
    >
      {/* Top Navigation Row */}
      <View
        style={{
          position: "absolute",
          top: 16,
          left: 20,
          right: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 30,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: "#ffffff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 2,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(197, 197, 216, 0.1)",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <ArrowLeft color="#0B1C30" size={24} />
        </Pressable>
        <View
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(197, 197, 216, 0.1)",
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#22c55e",
            }}
          />
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: "#0b1c30",
              fontFamily: "Plus Jakarta Sans",
            }}
          >
            Navigating
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/sos")}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: "#ba1a1a",
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
          <ShieldAlert color="#ffffff" size={24} />
        </Pressable>
      </View>

      {/* Main Map Area */}
      <View style={{ flex: 1, position: "relative", zIndex: 0 }}>
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhChECydpDyPgt27hlQrat9Rk2U89C00BRo9HxQfDmpSr4MRrxjAG1pGL6iwr1A__rTa5hkvxx5VNhyBHIwUrgEL1XAzRh3vdUsCbmpnjEWdd5tXIJyvuoNbsf17_pEryhtId0Y6snYs2mm-iQfYuoPK3Zrsg2EAG-XD5-Bq8QCQpcEyE5GcSDWhm7yhm20vy7oBcRqJFt0hbOoiU-LdxjqFg6qiW_P7A1aJmd6buI9IlGZRklUN8jk7Fl9tud8gafRai7G4XXH9hL",
          }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />

        {/* Turn-by-Turn Instruction Card Overlay */}
        <View
          style={{
            position: "absolute",
            top: 80,
            left: 16,
            right: 16,
            zIndex: 40,
          }}
        >
          <View
            style={{
              backgroundColor: "#001caa",
              borderRadius: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 2,
              padding: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              borderWidth: 1,
              borderColor: "rgba(197, 197, 216, 0.1)",
            }}
          >
            <CornerUpRight color="#ffffff" size={28} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  color: "#ffffff",
                  fontFamily: "Plus Jakarta Sans",
                }}
              >
                200m
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "rgba(255, 255, 255, 0.9)",
                  fontFamily: "Plus Jakarta Sans",
                  marginTop: 2,
                }}
              >
                Turn right onto Senate Drive
              </Text>
            </View>
          </View>
        </View>

        {/* Map Location markers */}
        <View
          style={{
            position: "absolute",
            top: "52%",
            left: "48%",
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
              transform: [{ scale: 1.25 }],
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
        <View
          style={{
            position: "absolute",
            top: "42%",
            left: "32%",
            marginTop: -24,
            marginLeft: -24,
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderColor: "rgba(197, 197, 216, 0.1)",
            width: 48,
            height: 48,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          <KekeIcon size={28} color="#001caa" />
        </View>
      </View>

      {/* Bottom Sheet Passenger Info & Controls */}
      <View
        style={{
          backgroundColor: "#ffffff",
          borderTopLeftRadius: 36,
          borderTopRightRadius: 36,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 5,
          borderTopWidth: 1,
          borderTopColor: "rgba(197, 197, 216, 0.1)",
          padding: 24,
          gap: 20,
          zIndex: 10,
        }}
      >
        <View
          style={{
            width: 48,
            height: 6,
            backgroundColor: "rgba(197, 197, 216, 0.2)",
            borderRadius: 3,
            alignSelf: "center",
          }}
        />

        {/* Trip State Info Header */}
        <View style={{ gap: 4, paddingBottom: 4 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: "#0b1c30",
              fontFamily: "Plus Jakarta Sans",
            }}
          >
            {getStatusTitle()}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#5b5e66",
              fontFamily: "Plus Jakarta Sans",
            }}
          >
            {getStatusSubtitle()}
          </Text>
        </View>

        {/* Passenger Profile Row */}
        <View
          style={{
            backgroundColor: "#f8f9ff",
            borderRadius: 24,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderWidth: 1,
            borderColor: "rgba(197, 197, 216, 0.1)",
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
                width: 48,
                height: 48,
                borderRadius: 24,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "rgba(197, 197, 216, 0.1)",
                backgroundColor: "#ffffff",
              }}
            >
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKv18St18L7X2vZAAMPrAWpe_RTK8EptXVp0FFMqsUDuP_GgeffQiG2BXUbeBK5fAppU3V1r1xiIbGeVUoaoTLduIBmWdC2WEHiVaf2hilbRU54kKuZ7O6ukr9iC-soO0wPXucYYRHL1OQTZr0q7bDRr1TZqfKpkpL290p2tVDrufDqbY7kxXIdHRNxOex755J1_4AtLe8z7qbpg1umUVPxW4tt5r_i6df9PbNJdOf5PFxcsnG6bDlUgGoGZnLt0vZSzW4H3KHhOMD",
                }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#0b1c30",
                  fontFamily: "Plus Jakarta Sans",
                }}
              >
                Alex
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 2,
                }}
              >
                <Star color="#eab308" fill="#eab308" size={13} />
                <Text
                  style={{
                    fontSize: 14,
                    color: "#5b5e66",
                    fontFamily: "Plus Jakarta Sans",
                    fontWeight: "600",
                  }}
                >
                  4.9 • Student
                </Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              style={({ pressed }) => ({
                backgroundColor: "#ffffff",
                width: 44,
                height: 44,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(197, 197, 216, 0.15)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <MessageSquare color="#0B1C30" size={18} />
            </Pressable>
            <Pressable
              style={({ pressed }) => ({
                backgroundColor: "#ffffff",
                width: 44,
                height: 44,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(197, 197, 216, 0.15)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Phone color="#0B1C30" size={18} />
            </Pressable>
          </View>
        </View>

        {/* Route Details Connector Timeline */}
        <View
          style={{
            backgroundColor: "#f8f9ff",
            borderRadius: 24,
            padding: 16,
            borderWidth: 1,
            borderColor: "rgba(197, 197, 216, 0.1)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
            position: "relative",
          }}
        >
          <View
            style={{
              position: "absolute",
              left: 25,
              top: 26,
              bottom: 26,
              width: 1,
              borderLeftWidth: 1,
              borderStyle: "dashed",
              borderColor: "rgba(197, 197, 216, 0.3)",
            }}
          />

          {/* Pickup */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              marginBottom: 14,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "rgba(0, 28, 170, 0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#001caa",
                }}
              />
            </View>
            <View>
              <Text
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  fontWeight: "700",
                  color: "#5b5e66",
                  fontFamily: "Plus Jakarta Sans",
                }}
              >
                Pickup Location
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#0b1c30",
                  fontFamily: "Plus Jakarta Sans",
                  marginTop: 2,
                }}
              >
                {activeTrip.pickup || "SOES Building"}
              </Text>
            </View>
          </View>

          {/* Dropoff */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "rgba(0, 28, 170, 0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#001caa",
                  borderWidth: 2,
                  borderColor: "#ffffff",
                }}
              />
            </View>
            <View>
              <Text
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  fontWeight: "700",
                  color: "#5b5e66",
                  fontFamily: "Plus Jakarta Sans",
                }}
              >
                Destination
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#0b1c30",
                  fontFamily: "Plus Jakarta Sans",
                  marginTop: 2,
                }}
              >
                {activeTrip.destination || "Senate Building"}
              </Text>
            </View>
          </View>
        </View>

        {/* Boarding instruction detail for state start */}
        {tripState === "start" && (
          <View
            style={{
              backgroundColor: "rgba(0, 28, 170, 0.05)",
              borderWidth: 1,
              borderColor: "rgba(0, 28, 170, 0.1)",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: "#5b5e66",
                fontFamily: "Plus Jakarta Sans",
                textAlign: "center",
              }}
            >
              Verify boarding by checking payment option or scanning QR code.
            </Text>
          </View>
        )}

        {/* Action Button */}
        <Pressable
          onPress={handleTripAction}
          style={({ pressed }) => ({
            width: "100%",
            height: 56,
            backgroundColor: "#0b1c30",
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 16,
              fontWeight: "700",
              fontFamily: "Plus Jakarta Sans",
            }}
          >
            {getButtonText()}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
