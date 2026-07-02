import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { auth } from "@/config/firebaseConfig";
import { signOut } from "firebase/auth";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Edit2,
  FileText,
  HelpCircle,
  LogOut,
  Send,
  Settings,
  Shield,
  Wallet,
} from "lucide-react-native";
import React from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KekeIcon from "../../components/KekeIcon";

export default function RiderAccount() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // 1. Wipe out all locally cached keys (tokens, user profile data, state flags)
      await AsyncStorage.clear();
      // 2. Sign out from Firebase Auth to terminate the session
      await signOut(auth);

      console.log("AsyncStorage and Firebase Auth cleared successfully!");

      // 3. Redirect the user back to the auth or login screen wrapper
      router.replace("/");
    } catch (error) {
      console.error("Error during logout:", error);
      Alert.alert(
        "Logout Error",
        "Something went wrong while logging out. Please try again.",
      );
    }
  };

  const handleFeatureNotImplemented = (featureName: string) => {
    Alert.alert(
      "Feature Coming Soon",
      `The ${featureName} settings page will be available in the next release.`,
      [{ text: "OK" }],
    );
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
          Profile
        </Text>
        <Pressable
          onPress={() => handleFeatureNotImplemented("Profile Settings")}
          className="w-12 h-12 rounded-2xl bg-white items-center justify-center border border-outline-variant/10 active:opacity-70 shadow-sm relative"
        >
          <Settings color="#0B1C30" size={20} />
          <View className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary border border-white" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
          gap: 16,
        }}
        className="flex-grow mt-2"
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card */}
        <View className="flex-row items-center gap-5 bg-white rounded-[28px] p-5 border border-outline-variant/5 shadow-sm">
          <View className="relative w-20 h-20">
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKv18St18L7X2vZAAMPrAWpe_RTK8EptXVp0FFMqsUDuP_GgeffQiG2BXUbeBK5fAppU3V1r1xiIbGeVUoaoTLduIBmWdC2WEHiVaf2hilbRU54kKuZ7O6ukr9iC-soO0wPXucYYRHL1OQTZr0q7bDRr1TZqfKpkpL290p2tVDrufDqbY7kxXIdHRNxOex755J1_4AtLe8z7qbpg1umUVPxW4tt5r_i6df9PbNJdOf5PFxcsnG6bDlUgGoGZnLt0vZSzW4H3KHhOMD",
              }}
              className="w-full h-full object-cover rounded-full border border-outline-variant/10"
            />
            <Pressable
              onPress={() => handleFeatureNotImplemented("Edit Profile Photo")}
              className="absolute bottom-0 right-0 bg-primary w-7 h-7 rounded-full flex items-center justify-center shadow-md border-2 border-white active:opacity-90"
            >
              <Edit2 color="#ffffff" size={12} />
            </Pressable>
          </View>
          <View className="flex-1">
            <Text className="text-[17px] font-bold text-on-surface font-jakarta">
              Emeka Okafor
            </Text>
            <Text className="text-[11px] text-secondary font-jakarta mt-0.5">
              emeka.okafor@school.edu.ng
            </Text>
            <View className="flex-row items-center gap-1.5 mt-1.5">
              <KekeIcon size={18} color="#5b5e66" />
              <Text className="font-jakarta text-[13px] font-bold text-primary">
                Rider
              </Text>
            </View>
          </View>
        </View>

        {/* Account Section Label */}
        <Text className="text-secondary font-jakarta text-body-sm font-semibold tracking-wide px-1 mt-4">
          Account
        </Text>

        {/* Menu Cards */}
        <View className="gap-3">
          {/* Payment Methods */}
          <Pressable
            onPress={() => router.push("/(rider)/payment")}
            className="bg-white rounded-2xl p-4 border border-outline-variant/5 shadow-sm flex-row items-center gap-4 active:opacity-90"
          >
            <View className="w-12 h-12 rounded-2xl bg-[#eff4ff] items-center justify-center shrink-0">
              <Wallet color="#001caa" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-on-surface font-jakarta">
                Payment Methods
              </Text>
              <Text className="text-[12px] text-secondary font-jakarta mt-0.5">
                Manage your cards and wallets
              </Text>
            </View>
            <ChevronRight color="#757687" size={16} />
          </Pressable>

          {/* Telegram */}
          <Pressable
            onPress={() => router.push("/(rider)/alerts")}
            className="bg-white rounded-2xl p-4 border border-outline-variant/5 shadow-sm flex-row items-center gap-4 active:opacity-90"
          >
            <View className="w-12 h-12 rounded-2xl bg-green-50 items-center justify-center shrink-0">
              <Send
                color="#22c55e"
                size={20}
                style={{ transform: [{ rotate: "-30deg" }] }}
              />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-on-surface font-jakarta">
                Telegram
              </Text>
              <Text className="text-[12px] text-secondary font-jakarta mt-0.5">
                Connected as @emeka_okafor
              </Text>
            </View>
            <View className="bg-green-50 border border-green-200/50 px-2.5 py-1 rounded-full mr-1">
              <Text className="text-green-600 text-[11px] font-bold font-jakarta">
                Connected
              </Text>
            </View>
            <ChevronRight color="#757687" size={16} />
          </Pressable>

          {/* Notification Preferences */}
          <Pressable
            onPress={() => router.push("/(rider)/alerts")}
            className="bg-white rounded-2xl p-4 border border-outline-variant/5 shadow-sm flex-row items-center gap-4 active:opacity-90"
          >
            <View className="w-12 h-12 rounded-2xl bg-[#fef9c3] items-center justify-center shrink-0">
              <Bell color="#eab308" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-on-surface font-jakarta">
                Notification Preferences
              </Text>
              <Text className="text-[12px] text-secondary font-jakarta mt-0.5">
                Manage your alerts and updates
              </Text>
            </View>
            <ChevronRight color="#757687" size={16} />
          </Pressable>

          {/* Privacy & Security */}
          <Pressable
            onPress={() => handleFeatureNotImplemented("Privacy & Security")}
            className="bg-white rounded-2xl p-4 border border-outline-variant/5 shadow-sm flex-row items-center gap-4 active:opacity-90"
          >
            <View className="w-12 h-12 rounded-2xl bg-purple-50 items-center justify-center shrink-0">
              <Shield color="#8b5cf6" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-on-surface font-jakarta">
                Privacy & Security
              </Text>
              <Text className="text-[12px] text-secondary font-jakarta mt-0.5">
                Control your data and security
              </Text>
            </View>
            <ChevronRight color="#757687" size={16} />
          </Pressable>

          {/* Help & Support */}
          <Pressable
            onPress={() => handleFeatureNotImplemented("Help & Support")}
            className="bg-white rounded-2xl p-4 border border-outline-variant/5 shadow-sm flex-row items-center gap-4 active:opacity-90"
          >
            <View className="w-12 h-12 rounded-2xl bg-sky-50 items-center justify-center shrink-0">
              <HelpCircle color="#0ea5e9" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-on-surface font-jakarta">
                Help & Support
              </Text>
              <Text className="text-[12px] text-secondary font-jakarta mt-0.5">
                FAQs, guides and contact us
              </Text>
            </View>
            <ChevronRight color="#757687" size={16} />
          </Pressable>

          {/* About KekeGo */}
          <Pressable
            onPress={() => handleFeatureNotImplemented("About KekeGo")}
            className="bg-white rounded-2xl p-4 border border-outline-variant/5 shadow-sm flex-row items-center gap-4 active:opacity-90"
          >
            <View className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center shrink-0">
              <FileText color="#5b5e66" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-on-surface font-jakarta">
                About KekeGo
              </Text>
              <Text className="text-[12px] text-secondary font-jakarta mt-0.5">
                Version 1.4.0
              </Text>
            </View>
            <ChevronRight color="#757687" size={16} />
          </Pressable>
        </View>

        {/* Log Out Button */}
        <Pressable
          onPress={handleLogout}
          className="bg-white rounded-[20px] border border-outline-variant/5 shadow-sm p-4 flex-row items-center justify-center gap-2 mt-4 active:opacity-90"
        >
          <LogOut color="#EF4444" size={20} />
          <Text className="text-[#EF4444] font-jakarta font-semibold text-[15px]">
            Log out
          </Text>
        </Pressable>

        <Text className="text-[11px] text-secondary font-medium font-jakarta opacity-80 mt-1.5 text-center">
          You'll be logged out of this device.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
