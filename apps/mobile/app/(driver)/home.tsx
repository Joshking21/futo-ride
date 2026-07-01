import { useRouter } from "expo-router";
import {
  Bell,
  Check,
  ChevronRight,
  Compass,
  Radar,
  ShieldAlert,
  TrendingUp,
  Wallet,
  WifiOff,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KekeIcon from "../../components/KekeIcon";
import { useApp } from "../../context/AppContext";

export default function DriverHome() {
  const router = useRouter();
  const {
    isOnline,
    setOnline,
    activeTrip,
    triggerMockIncomingRequest,
    confirmBooking,
    clearActiveTrip,
    earnings,
  } = useApp();

  const [countdown, setCountdown] = useState(30);

  const isRequestPending = activeTrip.status === "searching";

  // Real-time countdown timer for pending requests
  useEffect(() => {
    let interval: any;
    if (isOnline && isRequestPending) {
      setCountdown(30);
      interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            // Auto-decline request when countdown reaches 0
            clearActiveTrip();
            Alert.alert(
              "Request Expired",
              "The incoming ride request has expired.",
              [{ text: "OK" }],
            );
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOnline, isRequestPending]);

  const handleToggleOnline = () => {
    setOnline(!isOnline);
  };

  const handleAcceptRequest = () => {
    confirmBooking();
    router.push("/(driver)/active");
  };

  const handleDeclineRequest = () => {
    clearActiveTrip();
  };

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f8f9ff" }}
      edges={["top"]}
    >
      {/* Header Row */}
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
        {/* Left Side Driver Profile Greeting */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKv18St18L7X2vZAAMPrAWpe_RTK8EptXVp0FFMqsUDuP_GgeffQiG2BXUbeBK5fAppU3V1r1xiIbGeVUoaoTLduIBmWdC2WEHiVaf2hilbRU54kKuZ7O6ukr9iC-soO0wPXucYYRHL1OQTZr0q7bDRr1TZqfKpkpL290p2tVDrufDqbY7kxXIdHRNxOex755J1_4AtLe8z7qbpg1umUVPxW4tt5r_i6df9PbNJdOf5PFxcsnG6bDlUgGoGZnLt0vZSzW4H3KHhOMD",
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: "rgba(197, 197, 216, 0.1)",
            }}
          />
          <View>
            <Text
              style={{
                fontFamily: "Plus Jakarta Sans",
                fontSize: 15,
                fontWeight: "700",
                color: "#0b1c30",
                lineHeight: 20,
              }}
            >
              Good morning, Chinedu!
            </Text>
            <Text
              style={{
                fontFamily: "Plus Jakarta Sans",
                fontSize: 11,
                color: "#5b5e66",
                marginTop: 2,
              }}
            >
              KEK-1234 • TVS King
            </Text>
          </View>
        </View>

        {/* Right Side Alerts Bell Button */}
        <Pressable
          style={{
            width: 48,
            height: 48,
            backgroundColor: "#ffffff",
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
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
          <Bell color="#0B1C30" size={20} />
          <View
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#001caa",
              borderWidth: 1,
              borderColor: "#ffffff",
            }}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
          gap: 16,
        }}
        style={{ flexGrow: 1, marginTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* You are Online Card */}
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 24,
            padding: 20,
            borderWidth: 1,
            borderColor: "rgba(197, 197, 216, 0.05)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            // elevation: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text
              style={{
                fontFamily: "Plus Jakarta Sans",
                fontSize: 12,
                color: "#5b5e66",
                fontWeight: "500",
              }}
            >
              You are
            </Text>
            <Text
              style={{
                fontFamily: "Plus Jakarta Sans",
                fontSize: 20,
                fontWeight: "700",
                marginTop: 2,
                color: isOnline ? "#22c55e" : "#5b5e66",
              }}
            >
              {isOnline ? "Online" : "Offline"}
            </Text>
            <Text
              style={{
                fontFamily: "Plus Jakarta Sans",
                fontSize: 12,
                color: "rgba(91, 94, 102, 0.8)",
                lineHeight: 16,
                marginTop: 2,
              }}
            >
              {isOnline
                ? "You're receiving requests"
                : "Go online to receive requests"}
            </Text>
          </View>

          {/* Toggle Switch */}
          <Pressable
            onPress={handleToggleOnline}
            style={{
              width: 54,
              height: 30,
              borderRadius: 15,
              padding: 4,
              justifyContent: "center",
              backgroundColor: isOnline ? "#22c55e" : "#cbd5e1",
              alignItems: isOnline ? "flex-end" : "flex-start",
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
                shadowRadius: 1.5,
                elevation: 1,
              }}
            />
          </Pressable>
        </View>

        {/* Inline Map Card */}
        <View
          style={{
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "rgba(197, 197, 216, 0.05)",
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
            backgroundColor: "#ffffff",
            position: "relative",
            height: 180,
          }}
        >
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuD0okzKR0KPq91lUrgoEl5fyfMy1B5eqVhArkpdos9nGZDnDI-ks7j4edISnFdnY4EKDclvfu-tXw48XWwCwLTHkiWgUdTJPzw0-Wbjb64syVe-qicEEPGdmkI1X7mJoq5k_B3J8K-Wlt3yAZ33Dzy6Q9HBEh9IjQITFz8IxurvIKiiZPmecWT2IRE_rFhmA4LK39TpJEwR6einizhW-wxyX5mP-M4C_rzF5V9nyd4VRIX-5fdOl05wnH6PWCU_MI8wXXgOBBcGS5kv",
            }}
            style={{ width: "100%", height: "100%" }}
          />

          {/* Driver Position Marker */}
          <View
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              marginLeft: -40,
              marginTop: -40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Concentric location rings */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "rgba(0, 28, 170, 0.1)",
                alignItems: "center",
                justifyContent: "center",
                position: "absolute",
              }}
            />
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "rgba(0, 28, 170, 0.2)",
                alignItems: "center",
                justifyContent: "center",
                position: "absolute",
              }}
            />
            {/* Core blue location dot */}
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: "#001caa",
                borderWidth: 1,
                borderColor: "#ffffff",
                position: "absolute",
                zIndex: 10,
              }}
            />
            {/* Yellow vehicle front marker */}
            <View style={{ zIndex: 20, marginTop: -32 }}>
              <KekeIcon size={32} color="#eab308" />
            </View>
          </View>

          {/* Floating Action Buttons */}
          <Pressable
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: "rgba(197, 197, 216, 0.1)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
              alignItems: "center",
              justifyContent: "center",
              position: "absolute",
              bottom: 52,
              right: 16,
            }}
          >
            <Compass color="#001caa" size={18} />
          </Pressable>
          <Pressable
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: "rgba(197, 197, 216, 0.1)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
              alignItems: "center",
              justifyContent: "center",
              position: "absolute",
              bottom: 12,
              right: 16,
            }}
          >
            <ShieldAlert color="#001caa" size={18} />
          </Pressable>
        </View>

        {/* Today's Earnings Card */}
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "rgba(197, 197, 216, 0.05)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            // elevation: 1,
            padding: 20,
          }}
        >
          {/* Card Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  backgroundColor: "#f0fdf4",
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Wallet color="#22c55e" size={20} />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#0b1c30",
                    fontFamily: "Plus Jakarta Sans",
                  }}
                >
                  Today's Earnings
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#5b5e66",
                    fontFamily: "Plus Jakarta Sans",
                    marginTop: 2,
                  }}
                >
                  {formattedDate}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => router.push("/(driver)/earnings")}
              style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: "#001caa",
                  fontFamily: "Plus Jakarta Sans",
                }}
              >
                View details <Text style={{ fontWeight: "600" }}>{">"}</Text>
              </Text>
            </Pressable>
          </View>

          {/* Core Earnings/Trips Stats Grid */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderTopWidth: 1,
              borderTopColor: "rgba(197, 197, 216, 0.05)",
              paddingTop: 16,
              marginTop: 16,
            }}
          >
            {/* Earnings Stat */}
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#22c55e",
                  fontFamily: "Plus Jakarta Sans",
                }}
              >
                ₦{earnings?.daily?.toLocaleString() || "6,350.00"}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: "#5b5e66",
                  fontWeight: "500",
                  fontFamily: "Plus Jakarta Sans",
                  marginTop: 2,
                }}
              >
                Earnings
              </Text>
            </View>

            {/* Vertical Divider */}
            <View
              style={{
                width: 1,
                height: 32,
                backgroundColor: "rgba(197, 197, 216, 0.1)",
              }}
            />

            {/* Trips Stat */}
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#0b1c30",
                  fontFamily: "Plus Jakarta Sans",
                }}
              >
                {earnings?.tripsCount || "14"}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: "#5b5e66",
                  fontWeight: "500",
                  fontFamily: "Plus Jakarta Sans",
                  marginTop: 2,
                }}
              >
                Trips
              </Text>
            </View>

            {/* Vertical Divider */}
            <View
              style={{
                width: 1,
                height: 32,
                backgroundColor: "rgba(197, 197, 216, 0.1)",
              }}
            />

            {/* Online Time Stat */}
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#0b1c30",
                  fontFamily: "Plus Jakarta Sans",
                }}
              >
                {earnings?.onlineTime || "8.6 hrs"}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: "#5b5e66",
                  fontWeight: "500",
                  fontFamily: "Plus Jakarta Sans",
                  marginTop: 2,
                }}
              >
                Online time
              </Text>
            </View>
          </View>

          {/* Success Trend Banner */}
          <View
            style={{
              backgroundColor: "#f0fdf4",
              borderWidth: 1,
              borderColor: "rgba(34, 197, 94, 0.15)",
              borderRadius: 16,
              padding: 12,
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
                flex: 1,
                paddingRight: 8,
              }}
            >
              <TrendingUp color="#22c55e" size={16} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: "#15803d",
                  fontFamily: "Plus Jakarta Sans",
                  marginLeft: 8,
                }}
              >
                Nice work! You're doing great today.
              </Text>
            </View>
            <ChevronRight color="#22c55e" size={16} />
          </View>
        </View>

        {/* Incoming Request OR Search Section */}
        <View style={{ marginTop: 8 }}>
          {!isOnline ? (
            /* Offline Warning Card */
            <View
              style={{
                backgroundColor: "rgba(186, 26, 26, 0.05)",
                borderWidth: 1,
                borderColor: "rgba(186, 26, 26, 0.15)",
                borderRadius: 24,
                padding: 20,
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <WifiOff color="#ba1a1a" size={32} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#ba1a1a",
                  fontFamily: "Plus Jakarta Sans",
                }}
              >
                You are currently offline
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#5b5e66",
                  textAlign: "center",
                  paddingHorizontal: 16,
                  lineHeight: 20,
                  fontFamily: "Plus Jakarta Sans",
                }}
              >
                Go online to start receiving ride requests across campus. Toggle
                the switch above to get started.
              </Text>
            </View>
          ) : isRequestPending ? (
            /* Incoming Request Panel */
            <View style={{ gap: 12 }}>
            <Text
              style={{
                color: "#5b5e66",
                fontFamily: "Plus Jakarta Sans",
                fontSize: 14,
                fontWeight: "800",
                letterSpacing: 0.3,
                paddingHorizontal: 4,
              }}
            >
              Incoming Request
            </Text>

            <View
              style={{
                backgroundColor: "#ffffff",
                borderWidth: 1,
                borderColor: "rgba(197, 197, 216, 0.05)",
                borderRadius: 24,
                padding: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 16,
                }}
              >
                {/* Left Passenger Avatar Placeholder */}
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: "#eff4ff",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    source={{
                      uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKv18St18L7X2vZAAMPrAWpe_RTK8EptXVp0FFMqsUDuP_GgeffQiG2BXUbeBK5fAppU3V1r1xiIbGeVUoaoTLduIBmWdC2WEHiVaf2hilbRU54kKuZ7O6ukr9iC-soO0wPXucYYRHL1OQTZr0q7bDRr1TZqfKpkpL290p2tVDrufDqbY7kxXIdHRNxOex755J1_4AtLe8z7qbpg1umUVPxW4tt5r_i6df9PbNJdOf5PFxcsnG6bDlUgGoGZnLt0vZSzW4H3KHhOMD",
                    }}
                    style={{ width: "100%", height: "100%", borderRadius: 16 }}
                  />
                </View>

                {/* Trip Info */}
                <View style={{ flexGrow: 1, flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "Plus Jakarta Sans",
                      fontSize: 15,
                      fontWeight: "700",
                      color: "#0b1c30",
                    }}
                  >
                    {activeTrip.pickup || "New Hall"}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Plus Jakarta Sans",
                      fontSize: 13,
                      color: "#5b5e66",
                      marginTop: 2,
                    }}
                  >
                    to{" "}
                    <Text style={{ color: "#001caa", fontWeight: "700" }}>
                      {activeTrip.destination || "Main Gate"}
                    </Text>
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Plus Jakarta Sans",
                      fontSize: 10,
                      fontWeight: 600,
                      color: "rgba(91, 94, 102, 0.7)",
                      marginTop: 4,
                    }}
                  >
                    1.2 km away • Est. ₦{activeTrip.price || "150.00"}
                  </Text>
                </View>

                {/* Countdown Progress Ring */}
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    borderWidth: 3,
                    borderColor: "#001caa",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    display: "flex",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: "#0b1c30",
                      fontFamily: "Plus Jakarta Sans",
                      textAlign: "center",
                      lineHeight: 12,
                    }}
                  >
                    {countdown}
                    {"\n"}
                    <Text
                      style={{
                        fontSize: 8,
                        color: "#5b5e66",
                        fontWeight: "500",
                        fontFamily: "Plus Jakarta Sans",
                      }}
                    >
                      sec
                    </Text>
                  </Text>
                </View>
              </View>

              {/* Decline / Accept Buttons */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 20,
                }}
              >
                <Pressable
                  onPress={handleDeclineRequest}
                  className="flex-1 bg-[#EFF2FF] h-12 rounded-2xl flex-row items-center justify-center gap-1.5 active:opacity-75"
                >
                  <X color="#001caa" size={16} />
                  <Text className="font-jakarta font-semibold text-[14px] text-primary">
                    Decline
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleAcceptRequest}
                  className="flex-1 bg-primary h-12 rounded-2xl flex-row items-center justify-center gap-1.5 active:opacity-90 shadow-sm"
                >
                  <Check color="white" size={16} />
                  <Text className="font-jakarta font-semibold text-[14px] text-white">
                    Accept
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Go Offline Link Button */}
            <Pressable
              onPress={handleToggleOnline}
              style={{ paddingVertical: 8 }}
            >
              <Text
                style={{
                  color: "#001caa",
                  fontFamily: "Plus Jakarta Sans",
                  fontWeight: "700",
                  fontSize: 14,
                  textAlign: "center",
                }}
              >
                Go offline
              </Text>
            </Pressable>
          </View>
          ) : (
            /* Finding Rides Radar Panel */
            <View
              style={{
                backgroundColor: "rgba(0, 28, 170, 0.05)",
                borderWidth: 1,
                borderColor: "rgba(0, 28, 170, 0.1)",
                borderRadius: 24,
                padding: 24,
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                // shadowColor: "#000",
                // shadowOffset: { width: 0, height: 1 },
                // shadowOpacity: 0.05,
                // shadowRadius: 2,
                // elevation: 1,
                marginTop: 2,
              }}
            >
              <Radar color="#001caa" size={32} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#001caa",
                  fontFamily: "Plus Jakarta Sans",
                }}
              >
                Finding rides...
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#5b5e66",
                  textAlign: "center",
                  paddingHorizontal: 16,
                  lineHeight: 20,
                  fontFamily: "Plus Jakarta Sans",
                }}
              >
                Stay near high-demand areas like SEET Head, Hall C or FUTO Gate.
              </Text>

              {/* Simulated Request developer button */}
              <Pressable
                onPress={triggerMockIncomingRequest}
                style={({ pressed }) => ({
                  backgroundColor: "#ffffff",
                  borderWidth: 1,
                  borderColor: "rgba(197, 197, 216, 0.15)",
                  width: "100%",
                  height: 48,
                  borderRadius: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 8,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#0b1c30",
                    fontFamily: "Plus Jakarta Sans",
                  }}
                >
                  Trigger Simulated Request
                </Text>
              </Pressable>
            </View>
          )}

    

          
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
