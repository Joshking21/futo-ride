import { useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import {
  ArrowLeft,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Gift,
  Lock,
  Megaphone,
  Send,
  Settings,
  ShieldAlert,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KekeIcon from "../../components/KekeIcon";
import { apiRequest } from "../../config/apiHelper";
import { auth, db } from "../../config/firebaseConfig";
import { useApp } from "../../context/AppContext";

const CAMPUS_LOCATIONS = [
  { name: "FUTO Main Gate", desc: "Campus main entrance shuttle park" },
  {
    name: "Senate Building",
    desc: "University admin & vice chancellor office",
  },
  { name: "SEET Head", desc: "School of Engineering & Tech Complex" },
  { name: "SOES Building", desc: "School of Environmental Sciences" },
  { name: "Hall C Hostel", desc: "Student housing residential area" },
  { name: "PGS Complex", desc: "Post Graduate School building" },
  { name: "Health Centre", desc: "Campus medical clinic and emergency" },
];

export default function AlertsScreen() {
  const router = useRouter();
  const { notifications: globalNotifications, addNotification } = useApp();

  const [notificationsList, setNotificationsList] =
    useState(globalNotifications);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  // Sync with global notifications when added
  useEffect(() => {
    setNotificationsList(globalNotifications);
  }, [globalNotifications]);

  // Listen to the Firestore user profile for real-time Telegram link state
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.chatId) {
            setConnected((prevConnected) => {
              if (!prevConnected) {
                // Add a dynamic notification to the context list!
                addNotification(
                  "Telegram Alert Active",
                  `Proximity alerts enabled. You will receive alerts on Telegram.`,
                  "proximity",
                  "ride_arriving",
                );

                Alert.alert(
                  "Connected!",
                  `Proximity alerts have been successfully linked to Telegram.`,
                  [{ text: "Great!" }],
                );
              }
              return true;
            });
          } else {
            setConnected(false);
          }
        }
      },
      (err) => console.error("Error reading profile for Telegram link:", err),
    );

    return () => unsub();
  }, [addNotification]);

  // Pulse animation for the concentric circles in Proximity alert card
  const pulseValue1 = useRef(new Animated.Value(1)).current;
  const pulseValue2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Outer circle pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue1, {
          toValue: 1.25,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue1, {
          toValue: 1.0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Inner circle pulse (staggered slightly)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue2, {
          toValue: 1.15,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue2, {
          toValue: 1.0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseValue1, pulseValue2]);

  const handleMarkAsRead = (id: string) => {
    setNotificationsList((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
    );
  };

  const handleConnectTelegram = async () => {
    // if (!selectedBuilding) {
    //   Alert.alert(
    //     "Select Building",
    //     "Please select a campus building to enable proximity alerts.",
    //     [{ text: "OK" }],
    //   );
    //   return;
    // }

    if (connected) return;

    setConnecting(true);
    try {
      const res = await apiRequest<{
        url: string;
        nonce: string;
        expiresAt: number;
      }>("/me/telegram-link", "POST", undefined);
      console.log(res);

      // Open the Telegram deep link
      await Linking.openURL(res.url);
    } catch (error: any) {
      Alert.alert(
        "Connection Failed",
        error.message || "Failed to generate Telegram connection link.",
        error.status,
      );
      console.log(error.status);
    } finally {
      setConnecting(false);
    }
  };

  const renderNotificationIcon = (category: string | undefined) => {
    const size = 20;
    switch (category) {
      case "ride_arriving":
        return (
          <View className="w-12 h-12 rounded-2xl bg-[#ecfdf5] items-center justify-center shrink-0">
            <KekeIcon size={24} color="#059669" />
          </View>
        );
      case "trip_complete":
        return (
          <View className="w-12 h-12 rounded-2xl bg-green-50 items-center justify-center shrink-0">
            <CheckCircle2 color="#22c55e" size={size} />
          </View>
        );
      case "queue_update":
        return (
          <View className="w-12 h-12 rounded-2xl bg-[#fef9c3] items-center justify-center shrink-0">
            <Bell color="#eab308" size={size} />
          </View>
        );
      case "security_alert":
        return (
          <View className="w-12 h-12 rounded-2xl bg-purple-50 items-center justify-center shrink-0">
            <ShieldAlert color="#8b5cf6" size={size} />
          </View>
        );
      case "reward":
        return (
          <View className="w-12 h-12 rounded-2xl bg-red-50 items-center justify-center shrink-0">
            <Gift color="#ef4444" size={size} />
          </View>
        );
      case "service_update":
        return (
          <View className="w-12 h-12 rounded-2xl bg-sky-50 items-center justify-center shrink-0">
            <Megaphone color="#0ea5e9" size={size} />
          </View>
        );
      default:
        return (
          <View className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center shrink-0">
            <Bell color="#5b5e66" size={size} />
          </View>
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-margin-mobile h-[72px] bg-transparent">
        <Pressable
          onPress={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-white items-center justify-center border border-outline-variant/10 active:opacity-70 shadow-sm"
        >
          <ArrowLeft color="#0B1C30" size={24} />
        </Pressable>
        <Text className="text-headline-sm font-bold text-on-surface font-jakarta">
          Notifications
        </Text>
        <Pressable className="w-12 h-12 rounded-2xl bg-white items-center justify-center border border-outline-variant/10 active:opacity-70 shadow-sm relative">
          <Settings color="#0B1C30" size={20} />
          <View className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary border border-white" />
        </Pressable>
      </View>
      <View className="flex bg-transparent p-5 pb-0">
        <View className="bg-[#EEF2FF] rounded-[32px] p-6 border border-outline-variant/5 relative overflow-hidden">
          <View className="flex-row items-start gap-4">
            {/* Pulsing Bell Icon */}
            <View className="w-14 h-14 items-center justify-center shrink-0 relative mr-2">
              {/* Outer pulsing ring */}
              <Animated.View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: "rgba(5, 150, 105, 0.1)",
                  position: "absolute",
                  transform: [{ scale: pulseValue1 }],
                  opacity: pulseValue1.interpolate({
                    inputRange: [1, 1.25],
                    outputRange: [0.6, 0],
                  }),
                }}
              />
              {/* Inner pulsing ring */}
              <Animated.View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "rgba(5, 150, 105, 0.1)",
                  position: "absolute",
                  transform: [{ scale: pulseValue2 }],
                  opacity: pulseValue2.interpolate({
                    inputRange: [1, 1.15],
                    outputRange: [0.8, 0],
                  }),
                }}
              />
              {/* Static White Center */}
              <View className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm z-10">
                <Bell color="#059669" size={20} />
              </View>
            </View>

            {/* Dynamic Banner Text */}
            <View className="flex-grow flex-wrap">
              <Text className="font-jakarta text-[15px] font-bold text-on-surface leading-[22px]">
                Notify me when a{"\n"}keke or bus is{" "}
                <Text className="text-primary">
                  {selectedBuilding
                    ? `near ${selectedBuilding}`
                    : "near [building]"}
                </Text>
              </Text>
              <Text className="font-jakarta text-[12px] text-secondary/90 leading-4">
                Get a Telegram alert when vehicles{"\n"}are near your selected
                building.
              </Text>
            </View>
          </View>

          {/* Select Building Dropdown Selector */}

          <Pressable
            onPress={() => setShowDropdown(true)}
            className="bg-white border border-outline-variant/5 rounded-2xl p-4 flex-row items-center justify-between mt-5 active:bg-slate-50"
          >
            <View className="flex-row items-center gap-3">
              <Building2 color="#5b5e66" size={20} />
              <Text
                className={`font-jakarta text-[14px] font-semibold ${
                  selectedBuilding ? "text-on-surface" : "text-secondary"
                }`}
              >
                {selectedBuilding || "Select building"}
              </Text>
            </View>
            <ChevronDown color="#5b5e66" size={20} />
          </Pressable>

          {/* Connect Telegram Primary Button */}
          <Pressable
            onPress={handleConnectTelegram}
            disabled={connecting}
            className={`flex-row items-center justify-center gap-2 rounded-2xl h-14 mt-4 shadow-sm active:opacity-90 ${
              connected ? "bg-green-600" : "bg-primary"
            }`}
          >
            {connecting ? (
              <ActivityIndicator color="white" />
            ) : connected ? (
              <>
                <Check color="white" size={18} />
                <Text className="text-white font-jakarta font-semibold text-[15px]">
                  Connected to Telegram
                </Text>
              </>
            ) : (
              <>
                <Send
                  color="white"
                  size={18}
                  style={{ transform: [{ rotate: "250deg" }] }}
                />
                <Text className="text-white font-jakarta font-semibold text-[15px]">
                  Connect Telegram
                </Text>
              </>
            )}
          </Pressable>

          {/* Footer privacy text */}
          <View className="flex-row items-center justify-center gap-1.5 mt-5">
            <Lock color="#5b5e66" size={12} style={{ opacity: 0.6 }} />
            <Text className="text-[11px] text-secondary font-medium font-jakarta opacity-80">
              We respect your privacy. No spam, ever.
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 24,
          gap: 16,
        }}
        className="flex-grow mt-2"
        showsVerticalScrollIndicator={false}
      >
        {/* Today Header */}
        <Text className="text-secondary font-jakarta text-body-sm font-semibold tracking-wide px-1">
          Today
        </Text>

        {/* Notifications List */}
        <View className="gap-3">
          {notificationsList.map((notif) => (
            <Pressable
              key={notif.id}
              onPress={() => handleMarkAsRead(notif.id)}
              className="bg-white rounded-[24px] p-4 border border-outline-variant/5 shadow-sm flex-row items-center gap-4 relative active:opacity-90"
            >
              {/* Left visual icon badge */}
              {renderNotificationIcon(notif.category)}

              {/* Title & Body */}
              <View className="flex-1 pr-6">
                <Text className="text-[15px] font-bold text-on-surface font-jakarta">
                  {notif.title}
                </Text>
                <Text className="text-[13px] text-secondary font-jakarta leading-4 mt-0.5">
                  {notif.body}
                </Text>
              </View>

              {/* Right time & unread indicator */}
              <View className="items-end justify-between h-10 shrink-0">
                <Text className="text-[11px] text-secondary/70 font-semibold font-jakarta">
                  {notif.timestamp}
                </Text>
                {!notif.read && (
                  <View className="w-2 h-2 rounded-full bg-primary" />
                )}
              </View>
            </Pressable>
          ))}
        </View>

        {/* Proximity Alerts Dynamic Section */}
      </ScrollView>

      {/* Campus Locations Select Modal (Bottom Sheet styling) */}
      <Modal
        visible={showDropdown}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDropdown(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-[32px] p-6 max-h-[70%] shadow-lg">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between border-b border-outline-variant/10 pb-4 mb-4">
              <Text className="text-[18px] font-bold text-on-surface font-jakarta">
                Select Campus Building
              </Text>
              <Pressable
                onPress={() => setShowDropdown(false)}
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center active:bg-slate-200"
              >
                <Text className="font-bold text-secondary font-jakarta text-[14px]">
                  X
                </Text>
              </Pressable>
            </View>

            {/* List of locations */}
            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              {CAMPUS_LOCATIONS.map((loc) => (
                <Pressable
                  key={loc.name}
                  onPress={() => {
                    setSelectedBuilding(loc.name);
                    setShowDropdown(false);
                  }}
                  className={`p-4 border-b border-outline-variant/5 rounded-2xl flex-row items-center justify-between active:bg-slate-50 ${
                    selectedBuilding === loc.name ? "bg-primary/5" : ""
                  }`}
                >
                  <View className="flex-1 pr-4">
                    <Text className="text-[15px] font-bold text-on-surface font-jakarta">
                      {loc.name}
                    </Text>
                    <Text className="text-[12px] text-secondary font-jakarta leading-4 mt-0.5">
                      {loc.desc}
                    </Text>
                  </View>
                  {selectedBuilding === loc.name && (
                    <CheckCircle2 color="#059669" size={20} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
