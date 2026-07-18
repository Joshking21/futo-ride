import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, CreditCard, Wallet, ShieldCheck, ChevronRight, Landmark } from "lucide-react-native";

export default function Payment() {
  const router = useRouter();
  const [preferredMethod, setPreferredMethod] = useState<"cngn" | "naira">("cngn");

  return (
    <SafeAreaView className="flex-1 bg-surface-bright" edges={["top", "bottom"]}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-margin-mobile h-[64px] bg-white border-b border-outline-variant/10 z-20">
        <Pressable
          onPress={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-white items-center justify-center border border-outline-variant/10 active:bg-surface-container"
        >
          <ArrowLeft color="#0B1C30" size={24} />
        </Pressable>
        <Text className="text-headline-md font-bold text-on-surface font-jakarta">Payment Methods</Text>
        <View className="w-12" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 60 }} className="flex-1">
        <Text className="text-body-sm text-secondary text-center leading-5 font-jakarta px-4">
          Choose how you want to pay for rides. You can switch or manage your options anytime.
        </Text>

        {/* Preferred Payment Method selector (Side-by-Side) */}
        <View className="gap-2">
          <Text className="text-[11px] font-bold text-secondary uppercase tracking-wider font-jakarta">Preferred Payment Method</Text>
          <View className="flex-row gap-3">
            {/* Option 1: cNGN */}
            <Pressable
              onPress={() => setPreferredMethod("cngn")}
              className={`flex-1 flex-row items-center justify-between p-3.5 border rounded-2xl bg-white ${
                preferredMethod === "cngn" ? "border-primary bg-primary/5" : "border-outline-variant/15"
              }`}
            >
              <View className="flex-row items-center gap-2.5">
                <Wallet color={preferredMethod === "cngn" ? "#059669" : "#5b5e66"} size={20} />
                <Text className="text-body-sm font-bold text-on-surface font-jakarta">cNGN (Crypto)</Text>
              </View>
              <View className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                preferredMethod === "cngn" ? "border-primary" : "border-outline-variant"
              }`}>
                {preferredMethod === "cngn" && <View className="w-2.5 h-2.5 bg-primary rounded-full" />}
              </View>
            </Pressable>

            {/* Option 2: Naira */}
            <Pressable
              onPress={() => setPreferredMethod("naira")}
              className={`flex-1 flex-row items-center justify-between p-3.5 border rounded-2xl bg-white ${
                preferredMethod === "naira" ? "border-primary bg-primary/5" : "border-outline-variant/15"
              }`}
            >
              <View className="flex-row items-center gap-2.5">
                <Text className={`font-bold text-lg font-jakarta ${preferredMethod === "naira" ? "text-primary" : "text-secondary"}`}>₦</Text>
                <Text className="text-body-sm font-bold text-on-surface font-jakarta">Naira (NGN)</Text>
              </View>
              <View className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                preferredMethod === "naira" ? "border-primary" : "border-outline-variant"
              }`}>
                {preferredMethod === "naira" && <View className="w-2.5 h-2.5 bg-primary rounded-full" />}
              </View>
            </Pressable>
          </View>
        </View>

        {/* Crypto Payment Section */}
        <View className="gap-2">
          <Text className="text-[11px] font-bold text-secondary uppercase tracking-wider font-jakarta">Crypto Payment</Text>
          <View className="bg-white rounded-3xl p-5 border border-outline-variant/10 shadow-sm gap-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 bg-primary/10 rounded-2xl items-center justify-center">
                  <Wallet color="#059669" size={24} />
                </View>
                <View>
                  <Text className="text-body-md font-bold text-on-surface font-jakarta">cNGN Wallet</Text>
                  <Text className="text-body-sm text-secondary font-jakarta mt-0.5">0xA3f5...9bC1d</Text>
                  <View className="bg-success/15 px-2 py-0.5 rounded-md self-start mt-1.5">
                    <Text className="text-[10px] text-success font-bold font-jakarta">Connected</Text>
                  </View>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-body-sm text-secondary font-jakarta">Balance</Text>
                <Text className="text-headline-sm font-bold text-primary font-jakarta mt-0.5">1,250.00 cNGN</Text>
                <Text className="text-body-sm text-secondary font-jakarta mt-0.5">≈ ₦1,250.00</Text>
              </View>
            </View>

            <Pressable className="w-full h-11 bg-primary/5 rounded-2xl flex-row items-center justify-center gap-2 active:bg-primary/10">
              <Text className="text-primary font-bold text-body-sm font-jakarta">Manage Wallet</Text>
            </Pressable>
          </View>
        </View>

        {/* Naira Payment Section */}
        <View className="gap-2">
          <Text className="text-[11px] font-bold text-secondary uppercase tracking-wider font-jakarta">Naira (NGN) Payment</Text>
          <View className="bg-white rounded-3xl p-5 border border-outline-variant/10 shadow-sm gap-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 bg-success/10 rounded-2xl items-center justify-center">
                  <Text className="text-success font-bold text-2xl font-jakarta">₦</Text>
                </View>
                <View>
                  <Text className="text-body-md font-bold text-on-surface font-jakarta">Naira Balance</Text>
                  <Text className="text-body-sm text-secondary font-jakarta mt-0.5">Available balance</Text>
                  <View className="bg-success/15 px-2 py-0.5 rounded-md self-start mt-1.5">
                    <Text className="text-[10px] text-success font-bold font-jakarta">Active</Text>
                  </View>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-body-sm text-secondary font-jakarta">Balance</Text>
                <Text className="text-headline-sm font-bold text-success font-jakarta mt-0.5">₦2,750.00</Text>
              </View>
            </View>

            <Pressable className="w-full h-11 bg-success/5 rounded-2xl flex-row items-center justify-center gap-2 active:bg-success/10">
              <Text className="text-success font-bold text-body-sm font-jakarta">+ Add Money</Text>
            </Pressable>
          </View>
        </View>

        {/* Other Payment Options Section */}
        <View className="gap-2">
          <Text className="text-[11px] font-bold text-secondary uppercase tracking-wider font-jakarta">Other Payment Options</Text>
          <View className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden">
            <Pressable className="flex-row items-center justify-between p-4 border-b border-outline-variant/5 active:bg-surface">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-surface rounded-xl items-center justify-center border border-outline-variant/5">
                  <CreditCard color="#059669" size={20} />
                </View>
                <View>
                  <Text className="text-body-md font-bold text-on-surface font-jakarta">Cards</Text>
                  <Text className="text-body-sm text-secondary font-jakarta mt-0.5">Visa •••• 4242</Text>
                </View>
              </View>
              <ChevronRight color="#757687" size={18} />
            </Pressable>

            <Pressable className="flex-row items-center justify-between p-4 active:bg-surface">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-surface rounded-xl items-center justify-center border border-outline-variant/5">
                  <Landmark color="#059669" size={20} />
                </View>
                <View>
                  <Text className="text-body-md font-bold text-on-surface font-jakarta">Bank Transfer</Text>
                  <Text className="text-body-sm text-secondary font-jakarta mt-0.5">Transfer directly from your bank</Text>
                </View>
              </View>
              <ChevronRight color="#757687" size={18} />
            </Pressable>
          </View>
        </View>

        {/* Payment Settings */}
        <View className="gap-2">
          <Text className="text-[11px] font-bold text-secondary uppercase tracking-wider font-jakarta">Payment Settings</Text>
          <View className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm p-4 flex-row items-center justify-between active:bg-surface">
            <View>
              <Text className="text-body-md font-bold text-on-surface font-jakarta">Auto top-up</Text>
              <Text className="text-body-sm text-secondary font-jakarta mt-0.5">Keep your balance topped up automatically</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Text className="text-body-sm text-secondary font-bold font-jakarta">Off</Text>
              <ChevronRight color="#757687" size={18} />
            </View>
          </View>
        </View>

        {/* Security Box */}
        <View className="bg-primary/5 rounded-3xl p-5 border border-primary/10 flex-row items-start gap-4 mt-2">
          <View className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <ShieldCheck color="#059669" size={22} />
          </View>
          <View className="flex-1">
            <Text className="text-body-md font-bold text-on-surface font-jakarta">Secure & Private</Text>
            <Text className="text-body-sm text-secondary font-jakarta leading-5 mt-1">
              Your payment information is encrypted and secure.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
