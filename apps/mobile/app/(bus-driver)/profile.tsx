import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "@/config/firebaseConfig";
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  Copy,
  Landmark,
  LogOut,
  Send,
  Shield,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Clipboard,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BusDriverProfile() {
  const router = useRouter();
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const driverName = auth.currentUser?.displayName || "Abubakar Usman";
  const driverEmail = auth.currentUser?.email || "abubakar.usman@gmail.com";

  const handleLogout = () => {
    setIsLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await AsyncStorage.clear();
      await signOut(auth);
      setIsLogoutModalVisible(false);
      router.replace("/");
    } catch (error) {
      console.error("Error during bus driver logout:", error);
      setIsLogoutModalVisible(false);
      router.replace("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCopyAccountNumber = () => {
    Clipboard.setString("0123456789");
    Alert.alert("Copied", "Account number copied to clipboard!");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-margin-mobile h-[72px] bg-transparent">
        <View className="w-12" />
        <Text className="text-lg font-bold text-on-surface font-jakarta">
          Profile Settings
        </Text>
        <View className="w-12" />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Info Card */}
        <View className="bg-[#eff3ff] p-5 rounded-xl flex-row items-center gap-4 mt-4 shadow-sm">
          <View className="relative">
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjFSCFMbV7btYNBq5Z_NmptfAr1-8my1GvNRPgRRaOLLPEtqioVZ_2mjlIyJLLQ-ioQ4du4wFmsS6KnXMp2aSQZLLeQDRfId6gfO90HKV18JnRFc14-vwUWfgVzqp_O9q2fTdD4xoCrWVFrt24XLi9lmTNUKrlnSTxrGFEP9Neh75LbWKZStV1fz0IhdzbgCsD7BEvcl2HqdEwOMjtsiS4w1MHWeE2VzoZ4dv5ECAAb8wYva0TgLQY9k_FVIDFN-dv7uCj9XMJdlV7",
              }}
              className="w-20 h-20 rounded-full border border-white/20"
            />
            <View className="w-5 h-5 bg-[#22c55e] border-[3px] border-white rounded-full absolute bottom-0 right-0" />
          </View>

          <View className="flex-1 justify-center">
            <Text className="text-[18px] font-extrabold text-[#0B1C30] font-jakarta leading-tight">
              {driverName}
            </Text>
            <Text
              className="text-secondary text-xs font-jakarta mt-1"
              numberOfLines={1}
            >
              {driverEmail}
            </Text>
            <View className="bg-[#e2ebff] px-2.5 py-0.5 rounded-md mt-2.5 self-start">
              <Text className="text-[#059669] text-[10px] font-bold font-jakarta uppercase tracking-wider">
                Bus Driver Partner
              </Text>
            </View>
          </View>
        </View>

        {/* Account & Settings Label */}
        <Text className="text-[13px] font-bold text-secondary font-jakarta mt-6 mb-3">
          Account & Settings
        </Text>

        {/* Payment Preference Card */}
        <View className="bg-white rounded-3xl shadow-xs p-4">
          <View className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-11 h-11 rounded-2xl bg-[#eff3ff] items-center justify-center">
                <Landmark color="#059669" size={18} />
              </View>
              <View className="ml-3.5 flex-1">
                <Text className="text-[14px] font-bold text-on-surface font-jakarta">
                  Payment Preference
                </Text>
                <Text className="text-secondary text-xs font-jakarta mt-0.5">
                  Manage your bank account details
                </Text>
              </View>
            </View>
            <ChevronRight color="#c5c5d8" size={16} />
          </View>

          <View className="h-[1px] bg-slate-100 mx-4.5" />

          {/* Bank details */}
          <View className="px-4 pb-2 pt-2 gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-secondary text-[13px] font-medium font-jakarta">
                Bank
              </Text>
              <Text className="text-[#059669] font-bold text-[13px] font-jakarta">
                Access Bank
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-secondary text-[13px] font-medium font-jakarta">
                Account Number
              </Text>
              <View className="flex-row items-center">
                <Text className="text-on-surface font-bold text-[13px] font-jakarta mr-2">
                  0123456789
                </Text>
                <Pressable
                  onPress={handleCopyAccountNumber}
                  className="w-7 h-7 rounded-lg items-center justify-center active:bg-slate-100"
                >
                  <Copy color="#5b5e66" size={13} />
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Telegram Connection Card */}
        <Pressable
          onPress={() =>
            Alert.alert("Telegram", "Open Telegram bot integration settings.")
          }
          className="bg-white p-2.5 rounded-2xl shadow-xs flex-row items-center justify-between mt-3.5 active:bg-slate-50 border border-outline-variant/5"
        >
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-11 h-11 rounded-full bg-[#24A1DE] items-center justify-center">
              <View className="rotate-[-25deg] mr-0.5">
                <Send color="#ffffff" size={15} fill="#ffffff" />
              </View>
            </View>
            <View className="ml-3.5 flex-1">
              <Text className="text-[14px] font-bold text-on-surface font-jakarta">
                Telegram Connection
              </Text>
              <Text className="text-secondary text-xs font-jakarta mt-0.5">
                Stay connected for route alerts
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-1.5">
            <View className="bg-[#e6f9ed] px-2.5 py-0.5 rounded-full">
              <Text className="text-[#22c55e] font-bold text-[10px] font-jakarta">
                Connected
              </Text>
            </View>
            <ChevronRight color="#c5c5d8" size={16} />
          </View>
        </Pressable>

        {/* Notification Preferences Card */}
        <Pressable
          onPress={() =>
            Alert.alert("Notifications", "Open notification configuration.")
          }
          className="bg-white p-2.5 rounded-2xl shadow-xs flex-row items-center justify-between mt-3.5 active:bg-slate-50 border border-outline-variant/5"
        >
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-11 h-11 rounded-2xl bg-[#eff3ff] items-center justify-center">
              <Bell color="#059669" size={18} />
            </View>
            <View className="ml-3.5 flex-1">
              <Text className="text-[14px] font-bold text-on-surface font-jakarta">
                Notification Preferences
              </Text>
              <Text className="text-secondary text-xs font-jakarta mt-0.5">
                Manage how you receive alerts
              </Text>
            </View>
          </View>
          <ChevronRight color="#c5c5d8" size={16} />
        </Pressable>

        {/* Account & Security Card */}
        <Pressable
          onPress={() =>
            Alert.alert(
              "Security",
              "Open password configurations.",
            )
          }
          className="bg-white p-2.5 rounded-2xl shadow-xs flex-row items-center justify-between mt-3.5 active:bg-slate-50 border border-outline-variant/5"
        >
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-11 h-11 rounded-2xl bg-[#eff3ff] items-center justify-center">
              <Shield color="#059669" size={18} />
            </View>
            <View className="ml-3.5 flex-1">
              <Text className="text-[14px] font-bold text-on-surface font-jakarta">
                Account & Security
              </Text>
              <Text className="text-secondary text-xs font-jakarta mt-0.5">
                Security settings and verification credentials
              </Text>
            </View>
          </View>
          <ChevronRight color="#c5c5d8" size={16} />
        </Pressable>

        {/* Log Out Bento Card */}
        <Pressable
          onPress={handleLogout}
          className="bg-[#fff2f2] rounded-2xl p-5 items-center justify-center mt-6 mb-8 active:scale-[0.99] shadow-xs"
        >
          <View className="flex-row items-center gap-2">
            <LogOut color="#ba1a1a" size={18} />
            <Text className="text-[#ba1a1a] font-bold text-[15px] font-jakarta">
              Log out
            </Text>
          </View>
          <Text className="text-secondary text-[11px] font-medium font-jakarta mt-1.5">
            You will be logged out from this device
          </Text>
        </Pressable>
      </ScrollView>

      {/* Custom Logout Modal */}
      <Modal
        visible={isLogoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-white w-full max-w-sm rounded-[32px] p-6 items-center shadow-2xl border border-outline-variant/10">
            <View className="w-16 h-16 rounded-full bg-red-50 justify-center items-center mb-4">
              <LogOut color="#ba1a1a" size={28} />
            </View>

            <Text className="text-headline-sm font-extrabold text-[#0B1C30] font-jakarta text-center">
              Log Out
            </Text>

            <Text className="text-secondary text-[14px] font-medium leading-5 text-center mt-2 mb-6 font-jakarta px-2">
              Are you sure you want to log out? You will be signed out of your account on this device.
            </Text>

            <View className="flex-row gap-3 w-full">
              <Pressable
                onPress={() => setIsLogoutModalVisible(false)}
                disabled={isLoggingOut}
                className="flex-1 border border-outline-variant/15 py-3.5 rounded-2xl items-center justify-center bg-white active:bg-slate-50"
              >
                <Text className="text-on-surface font-bold text-body-md font-jakarta">
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={confirmLogout}
                disabled={isLoggingOut}
                className="flex-1 bg-[#ba1a1a] py-3.5 rounded-2xl items-center justify-center active:opacity-90 shadow-sm"
              >
                <Text className="text-white font-bold text-body-md font-jakarta">
                  {isLoggingOut ? "Logging out..." : "Log Out"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
