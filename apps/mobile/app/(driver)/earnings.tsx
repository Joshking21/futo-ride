import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Clock,
  HelpCircle,
  Info,
  Landmark,
  Menu,
  Send,
  Shield,
  Wallet,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Trip {
  id: string;
  time: string;
  pickup: string;
  destination: string;
  distance: string;
  price: number;
  status: string;
}

const COMPLETED_TRIPS_MOCK: Trip[] = [
  {
    id: "trip-1",
    time: "10:24 AM",
    pickup: "New Hall",
    destination: "Main Gate",
    distance: "1.2 km",
    price: 150.0,
    status: "Paid",
  },
  {
    id: "trip-2",
    time: "9:18 AM",
    pickup: "Library",
    destination: "Faculty of Science",
    distance: "0.8 km",
    price: 100.0,
    status: "Paid",
  },
  {
    id: "trip-3",
    time: "8:30 AM",
    pickup: "Sports Complex",
    destination: "New Hall",
    distance: "1.0 km",
    price: 120.0,
    status: "Paid",
  },
  {
    id: "trip-4",
    time: "7:05 AM",
    pickup: "Main Gate",
    destination: "Library",
    distance: "0.7 km",
    price: 90.0,
    status: "Paid",
  },
  {
    id: "trip-5",
    time: "6:20 AM",
    pickup: "Faculty of Engineering",
    destination: "Main Gate",
    distance: "1.1 km",
    price: 140.0,
    status: "Paid",
  },
  {
    id: "trip-6",
    time: "5:10 AM",
    pickup: "Hostel 3",
    destination: "Sports Complex",
    distance: "0.9 km",
    price: 110.0,
    status: "Paid",
  },
];

export default function DriverEarnings() {
  const router = useRouter();
  const [balance, setBalance] = useState(12750.0);
  const [showCashout, setShowCashout] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "Today" | "This Week" | "This Month" | "Custom"
  >("Today");
  const [payoutMethod, setPayoutMethod] = useState<"bank" | "wallet">("bank");
  const [withdrawAmount, setWithdrawAmount] = useState("12750.00");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Format helper for currency display
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const parsedWithdrawAmount =
    parseFloat(withdrawAmount.replace(/,/g, "")) || 0;

  const handleUseAll = () => {
    setWithdrawAmount(balance.toFixed(2));
  };

  const handleWithdraw = () => {
    if (parsedWithdrawAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount to withdraw.");
      return;
    }
    if (parsedWithdrawAmount > balance) {
      Alert.alert(
        "Insufficient Funds",
        "The withdraw amount cannot exceed your available balance.",
      );
      return;
    }
    if (parsedWithdrawAmount < 1000) {
      Alert.alert("Minimum Limit", "The minimum cashout amount is ₦1,000.00.");
      return;
    }

    setIsWithdrawing(true);

    setTimeout(() => {
      setIsWithdrawing(false);
      const targetText =
        payoutMethod === "bank"
          ? "GTBank account ending in 4567"
          : "CNGN Wallet address 0x8F3a...4B7c";

      Alert.alert(
        "Cashout Successful",
        `Your payout of ${formatCurrency(parsedWithdrawAmount)} has been successfully transferred to your ${targetText}.`,
        [
          {
            text: "OK",
            onPress: () => {
              setBalance((prev) => Math.max(0, prev - parsedWithdrawAmount));
              setWithdrawAmount("0.00");
              setShowCashout(false);
            },
          },
        ],
      );
    }, 1500);
  };

  // Main Earnings View
  const renderEarningsView = () => (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      className="flex-1"
      showsVerticalScrollIndicator={false}
    >
      {/* Available Balance Card */}
      <View className="bg-[#eff3ff] p-6 rounded-[28px]  mt-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center gap-1.5">
              <Text className="text-secondary text-sm font-medium font-jakarta leading-none">
                Available Balance
              </Text>
              <Info color="#5b5e66" size={13} />
            </View>
            <Text className="text-[#001caa] text-[34px] font-extrabold font-jakarta mt-1 tracking-tight">
              {formatCurrency(balance)}
            </Text>
          </View>

          <View className="w-12 h-12 rounded-2xl bg-white items-center justify-center border border-[#e5eeff] shadow-xs">
            <Wallet color="#001caa" size={20} />
          </View>
        </View>

        <View className="flex-row items-end justify-between mt-6">
          <View>
            <Text className="text-secondary text-xs font-jakarta">
              Total earnings this week
            </Text>
            <Text className="text-on-surface text-[17px] font-bold font-jakarta mt-1">
              ₦28,450.00
            </Text>
          </View>

          <Pressable
            onPress={() => {
              setWithdrawAmount(balance > 0 ? balance.toFixed(2) : "0.00");
              setShowCashout(true);
            }}
            className="bg-[#001caa] px-5 py-2.5 rounded-2xl flex-row items-center gap-1 active:scale-[0.98] shadow-sm"
          >
            <Text className="text-white text-xs font-bold font-jakarta">
              Cashout
            </Text>
            <ChevronRight color="#ffffff" size={14} />
          </Pressable>
        </View>
      </View>

      {/* Tabs Selector */}
      <View className="bg-[#f0f2f5] p-1 rounded-2xl border-4 border-white flex-row items-center mt-6">
        {(["Today", "This Week", "This Month", "Custom"] as const).map(
          (tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-xl items-center justify-center ${
                  isActive ? "bg-white shadow-xs" : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-xs font-jakarta ${
                    isActive
                      ? "text-[#001caa] font-bold"
                      : "text-secondary font-medium"
                  }`}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          },
        )}
      </View>

      {/* Header List */}
      <View className="flex-row items-center justify-between mt-6 mb-3">
        <Text className="text-[15px] font-extrabold text-on-surface font-jakarta">
          Today, May 16
        </Text>
        <Text className="text-[15px] font-extrabold text-success font-jakarta">
          Total: ₦6,350.00
        </Text>
      </View>

      {/* Trips list */}
      <View className="gap-3">
        {COMPLETED_TRIPS_MOCK.map((trip) => (
          <View
            key={trip.id}
            className="bg-white p-4 rounded-3xl border border-outline-variant/10 shadow-xs flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1 mr-2">
              {/* Route Indicator pill */}
              <View className="bg-[#f0fcf4] border border-[#dcfce7] w-8 h-[64px] rounded-2xl items-center justify-between py-2.5">
                <View className="w-2 h-2 rounded-full bg-success" />
                <View className="w-[1px] border-l border-dashed border-slate-300 flex-1 my-1" />
                <View className="w-2 h-2 rounded-full bg-[#001caa]" />
              </View>

              {/* Texts */}
              <View className="ml-3.5 flex-1">
                <Text
                  className="text-[12px] font-bold text-on-surface font-jakarta"
                  numberOfLines={1}
                >
                  {trip.pickup}
                </Text>
                <Text
                  className="text-[10px] text-secondary font-medium font-jakarta mt-0.5"
                  numberOfLines={1}
                >
                  to {trip.destination}
                </Text>
                <View className="flex-row items-center mt-1.5">
                  <Clock color="#5b5e66" size={12} />
                  <Text className="text-secondary font-medium text-[11px] font-jakarta ml-1">
                    {trip.time}
                  </Text>
                </View>
              </View>
            </View>

            {/* Right pricing & chevron */}
            <View className="flex-row items-center gap-2">
              <View className="items-end mr-1">
                <Text className="text-success font-extrabold text-[15px] font-jakarta">
                  {formatCurrency(trip.price)}
                </Text>
                <View className="bg-[#e6f9ed] px-2 py-0.5 rounded-md mt-1">
                  <Text className="text-success font-bold text-[10px] font-jakarta">
                    Paid
                  </Text>
                </View>
              </View>
              <ChevronRight color="#c5c5d8" size={16} />
            </View>
          </View>
        ))}
      </View>

      {/* Transfer Information Card */}
      <View className="bg-[#f0f4ff] border border-[#dce9ff] p-4 rounded-3xl flex-row items-center gap-3.5 mt-6 shadow-xs">
        <View className="w-10 h-10 rounded-2xl bg-white items-center justify-center border border-[#e5eeff]">
          <Shield color="#001caa" size={18} />
        </View>
        <View className="flex-1">
          <Text className="text-on-surface text-xs font-bold font-jakarta">
            Earnings are transferred to your balance.
          </Text>
          <Text className="text-secondary text-[11px] font-medium font-jakarta mt-0.5">
            Cash out anytime you want.
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  // Cashout Flow View
  const renderCashoutView = () => (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      className="flex-1"
      showsVerticalScrollIndicator={false}
    >
      {/* Available Balance Card */}
      <View className="bg-[#eff3ff] p-6 rounded-[28px] border border-[#e2e8f0] mt-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center gap-1.5">
              <Text className="text-secondary text-sm font-medium font-jakarta leading-none">
                Available Balance
              </Text>
            </View>
            <Text className="text-[#001caa] text-[34px] font-extrabold font-jakarta mt-1 tracking-tight">
              {formatCurrency(balance)}
            </Text>

            <View className="flex-row items-center gap-1.5 mt-4">
              <Text className="text-secondary text-xs font-medium font-jakarta">
                Withdrawable Amount
              </Text>
              <Info color="#5b5e66" size={12} />
            </View>
            <Text className="text-on-surface text-sm font-bold font-jakarta mt-0.5">
              {formatCurrency(balance)}
            </Text>
          </View>

          <View className="w-12 h-12 rounded-2xl bg-white items-center justify-center border border-[#e5eeff] shadow-xs">
            <Wallet color="#001caa" size={20} />
          </View>
        </View>
      </View>

      {/* Selector Label */}
      <Text className="text-[13px] font-bold text-secondary font-jakarta mt-6 mb-3">
        Select Payout Method
      </Text>

      {/* Payout tabs */}
      <View className="flex-row items-center gap-3">
        {/* Bank tab */}
        <Pressable
          onPress={() => setPayoutMethod("bank")}
          className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-2xl border ${
            payoutMethod === "bank"
              ? "bg-[#eff3ff] border-[#bcc2ff]"
              : "bg-white border-[#e5eeff]"
          }`}
        >
          <Landmark
            color={payoutMethod === "bank" ? "#001caa" : "#5b5e66"}
            size={16}
          />
          <Text
            className={`text-[13px] font-jakarta ${
              payoutMethod === "bank"
                ? "text-[#001caa] font-bold"
                : "text-secondary font-medium"
            }`}
          >
            Bank Account
          </Text>
        </Pressable>

        {/* e-Wallet tab */}
        <Pressable
          onPress={() => setPayoutMethod("wallet")}
          className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-2xl border ${
            payoutMethod === "wallet"
              ? "bg-[#eff3ff] border-[#bcc2ff]"
              : "bg-white border-[#e5eeff]"
          }`}
        >
          <Wallet
            color={payoutMethod === "wallet" ? "#001caa" : "#5b5e66"}
            size={16}
          />
          <Text
            className={`text-[13px] font-jakarta ${
              payoutMethod === "wallet"
                ? "text-[#001caa] font-bold"
                : "text-secondary font-medium"
            }`}
          >
            e-Wallet
          </Text>
        </Pressable>
      </View>

      {/* Payout target information card */}
      {payoutMethod === "bank" ? (
        <View
          className="bg-white p-4.5 rounded-lg p-2 shadow-xs flex-row items-center justify-between mt-4"
          style={{ elevation: 1 }}
        >
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-12 h-12 rounded-2xl bg-[#eff3ff] items-center justify-center">
              <Landmark color="#001caa" size={20} />
            </View>
            <View className="ml-3.5 flex-1">
              <Text className="text-[14px] font-bold text-on-surface font-jakarta">
                GTBank •••• 4567
              </Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-secondary font-medium text-xs font-jakarta">
                  Chinedu O.
                </Text>
                <View className="bg-[#e6f9ed] px-2 py-0.5 rounded-md ml-2">
                  <Text className="text-[#22c55e] font-bold text-[9px] font-jakarta">
                    Verified
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <Pressable
            onPress={() =>
              Alert.alert(
                "Change Bank",
                "Change bank feature is under construction.",
              )
            }
            className="active:opacity-75"
          >
            <Text className="text-[#001caa] font-bold text-[13px] font-jakarta">
              Change &gt;
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="bg-white rounded-lg  shadow-xs p-3 pb-0 mt-4"style={{elevation:1}}>
          <View className="p-4.5 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-12 h-12 rounded-full bg-[#eff3ff] items-center justify-center border border-[#bcc2ff]">
                <Text className="text-[#001caa] font-extrabold text-lg font-jakarta">
                  C
                </Text>
              </View>
              <View className="ml-3.5 flex-1">
                <Text className="text-[14px] font-bold text-on-surface font-jakarta">
                  CNGN Wallet
                </Text>
                <View className="flex-row items-center mt-1">
                  <Text className="text-secondary font-medium text-xs font-jakarta">
                    0x8F3a...4B7c
                  </Text>
                  <View className="bg-[#e6f9ed] px-2 py-0.5 rounded-md ml-2">
                    <Text className="text-[#22c55e] font-bold text-[9px] font-jakarta">
                      Verified ✓
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="flex-row items-center gap-1.5">
              <View className="items-end">
                <Text className="text-secondary text-[10px] font-medium font-jakarta">
                  Balance
                </Text>
                <Text className="text-on-surface font-bold text-[13px] font-jakarta mt-0.5">
                  {formatCurrency(balance)}
                </Text>
              </View>
              <ChevronRight color="#94a3b8" size={15} />
            </View>
          </View>

          <View className="h-[1px] bg-slate-100 mx-4.5" />

          <Pressable
            onPress={() =>
              Alert.alert(
                "Change e-Wallet",
                "Change e-wallet feature is under construction.",
              )
            }
            className="px-4.5 py-3.5  flex-row items-center justify-between active:bg-slate-50"
          >
            <Text className="text-[#001caa] font-bold text-[13px] font-jakarta">
              Change e-wallet
            </Text>
            <ChevronRight color="#001caa" size={14} />
          </Pressable>
        </View>
      )}

      {/* Amount input */}
      <Text className="text-[13px] font-bold text-secondary font-jakarta mt-6 mb-3">
        Amount to withdraw
      </Text>

      <View className="bg-white rounded-lg border border-[#e5eeff] shadow-xs p-2 py-0 flex-row items-center justify-between pl-4.5">
        <View className="flex-row items-center flex-1 mr-2">
          <Text className="text-lg font-bold text-on-surface font-jakarta">
            ₦
          </Text>
          <TextInput
            className="flex-1 text-[16px] font-bold text-on-surface font-jakarta py-3.5 ml-1"
            value={withdrawAmount}
            onChangeText={(text) =>
              setWithdrawAmount(text.replace(/[^0-9.]/g, ""))
            }
            keyboardType="numeric"
            placeholder="0.00"
          />
        </View>
        <Pressable
          onPress={handleUseAll}
          className="bg-[#eff3ff] px-4 py-2 rounded-2xl mr-1.5 active:scale-95"
        >
          <Text className="text-[#001caa] font-bold text-xs font-jakarta">
            Use all
          </Text>
        </Pressable>
      </View>
      <Text className="text-secondary font-medium text-[11px] font-jakarta mt-2.5 ml-1.5">
        Minimum cashout is ₦1,000.00
      </Text>

      {/* Cashout Summary */}
      <View className="bg-white p-5 rounded-[28px] border border-[#e5eeff] shadow-xs mt-6">
        <Text className="text-[14px] font-bold text-on-surface font-jakarta mb-4">
          Cashout Summary
        </Text>

        <View className="flex-row items-center justify-between py-1.5">
          <Text className="text-secondary font-medium text-[13px] font-jakarta">
            Available Balance
          </Text>
          <Text className="text-on-surface font-bold text-[13px] font-jakarta">
            {formatCurrency(balance)}
          </Text>
        </View>

        <View className="flex-row items-center justify-between py-1.5">
          <Text className="text-secondary font-medium text-[13px] font-jakarta">
            Cashout Amount
          </Text>
          <Text className="text-on-surface font-bold text-[13px] font-jakarta">
            -{formatCurrency(parsedWithdrawAmount)}
          </Text>
        </View>

        <View className="h-[1px] bg-slate-100 my-2" />

        <View className="flex-row items-center justify-between py-1.5">
          <Text className="text-on-surface font-bold text-[13px] font-jakarta">
            You will receive
          </Text>
          <Text className="text-[#22c55e] font-extrabold text-[15px] font-jakarta">
            {formatCurrency(parsedWithdrawAmount)}
          </Text>
        </View>
      </View>

      {/* Secure card */}
      <View className="bg-[#f0f4ff] border border-[#dce9ff] p-4 rounded-3xl flex-row items-center gap-3.5 mt-6 shadow-xs">
        <View className="w-10 h-10 rounded-2xl bg-white items-center justify-center border border-[#e5eeff]">
          <Shield color="#001caa" size={18} />
        </View>
        <View className="flex-1">
          <Text className="text-on-surface text-xs font-bold font-jakarta">
            Secure & Fast
          </Text>
          <Text className="text-secondary text-[11px] font-medium font-jakarta mt-0.5">
            {payoutMethod === "bank"
              ? "Your cashout will be processed securely and sent to your account."
              : "Your cashout will be processed securely and sent to your e-wallet instantly."}
          </Text>
        </View>
      </View>

      {/* Cashout button */}
      <View className="mt-6 mb-8">
        <Pressable
          onPress={handleWithdraw}
          disabled={isWithdrawing || parsedWithdrawAmount <= 0}
          className={`w-full h-14 rounded-full flex-row items-center justify-center gap-2 shadow-sm ${
            isWithdrawing || parsedWithdrawAmount <= 0
              ? "bg-slate-300"
              : "bg-[#001caa] active:scale-[0.98]"
          }`}
        >
          {isWithdrawing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              {payoutMethod === "wallet" && (
                <View className="rotate-[-25deg] mr-0.5">
                  <Send color="#ffffff" size={15} fill="#ffffff" />
                </View>
              )}
              <Text className="text-white font-bold text-[16px] font-jakarta">
                Cashout Now
              </Text>
            </>
          )}
        </Pressable>

        <View className="flex-row items-center justify-center gap-1.5 mt-3.5">
          <Info color="#5b5e66" size={12} />
          <Text className="text-secondary font-medium text-[11px] font-jakarta">
            Cashouts are processed within minutes.
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Top Header */}
        {!showCashout ? (
          <View className="flex-row items-center justify-between px-margin-mobile h-[72px] bg-transparent">
            <Pressable
              onPress={() => Alert.alert("Menu", "Driver settings menu.")}
              className="w-12 h-12 rounded-2xl bg-white items-center justify-center border border-outline-variant/10 shadow-xs active:bg-slate-100"
            >
              <Menu color="#0B1C30" size={22} />
            </Pressable>

            <Text className="text-lg font-bold text-on-surface font-jakarta">
              Earnings
            </Text>

            <Pressable
              onPress={() =>
                Alert.alert("Notifications", "You have no new notifications.")
              }
              className="w-12 h-12 rounded-2xl bg-white items-center justify-center border border-outline-variant/10 shadow-xs active:bg-slate-100 relative"
            >
              <Bell color="#0B1C30" size={22} />
              {/* Blue notification badge matching mockup */}
              <View className="w-2.5 h-2.5 rounded-full bg-[#001caa] absolute top-3.5 right-3.5 border-2 border-white" />
            </Pressable>
          </View>
        ) : (
          <View className="flex-row items-center justify-between px-margin-mobile h-[72px] bg-transparent">
            <Pressable
              onPress={() => setShowCashout(false)}
              className="w-12 h-12 rounded-2xl bg-white items-center justify-center border border-outline-variant/10 shadow-xs active:bg-slate-100"
            >
              <ArrowLeft color="#0B1C30" size={20} />
            </Pressable>

            <Text className="text-lg font-bold text-on-surface font-jakarta">
              Cashout
            </Text>

            <Pressable
              onPress={() =>
                Alert.alert(
                  "Help",
                  "Contact support if you experience cashout delays.",
                )
              }
              className="w-12 h-12 rounded-2xl bg-white items-center justify-center border border-outline-variant/10 shadow-xs active:bg-slate-100"
            >
              <HelpCircle color="#0B1C30" size={20} />
            </Pressable>
          </View>
        )}

        {/* Dynamic content rendering based on showCashout state */}
        {!showCashout ? renderEarningsView() : renderCashoutView()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
