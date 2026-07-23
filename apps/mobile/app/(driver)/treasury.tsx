import { apiRequest } from "@/config/apiHelper";
import {
  BookOpen,
  ChevronRight,
  Coins,
  ExternalLink,
  Info,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface TreasuryState {
  configured: boolean;
  balanceBaseUnits?: string;
  totalIn?: string;
  totalOut?: string;
  maxPayout?: string;
  usdcMint?: string;
  authority?: string;
  programId?: string;
  vaultTokenAccount?: string;
}

export default function DriverTreasury() {
  const [vaultState, setVaultState] = useState<TreasuryState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTreasury = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await apiRequest<TreasuryState>("/treasury/balance");
      setVaultState(res);
    } catch (e: any) {
      console.warn("Failed to fetch treasury balance:", e);
      Alert.alert("Connection Error", "Could not load latest welfare fund details.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTreasury();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTreasury(true);
  };

  const handleOpenSolanaExplorer = (address: string) => {
    const url = `https://explorer.solana.com/address/${address}?cluster=devnet`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open Solana Explorer link.");
    });
  };

  // Convert USDC base units (6 decimals) to string representation
  const formatUsdc = (baseUnits?: string) => {
    if (!baseUnits) return "0.00";
    const amt = parseFloat(baseUnits) / 1000000;
    return amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9ff" }} edges={["top"]}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-margin-mobile h-[72px] bg-transparent">
        <Text className="text-[20px] font-jakarta font-extrablack text-on-surface">
          Welfare <Text className="text-primary">Treasury</Text>
        </Text>
        <Pressable
          onPress={() => fetchTreasury(false)}
          disabled={isLoading || isRefreshing}
          className="w-11 h-11 bg-white border border-outline-variant/10 rounded-2xl items-center justify-center active:bg-slate-100 shadow-xs"
        >
          {isLoading || isRefreshing ? (
            <ActivityIndicator color="#059669" size="small" />
          ) : (
            <RefreshCw color="#059669" size={18} />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}
        style={{ flexGrow: 1, marginTop: 8 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={["#059669"]} />
        }
      >
        {isLoading && !isRefreshing ? (
          <View className="flex-1 py-16 justify-center items-center">
            <ActivityIndicator color="#059669" size="large" />
            <Text className="text-secondary text-body-sm font-jakarta mt-3">
              Reading live balance...
            </Text>
          </View>
        ) : (
          <>
            {/* On-Chain Solana Vault Dashboard */}
            {vaultState?.configured ? (
              <>
                {/* Balance Card */}
                <View className="bg-gradient-to-br from-emerald-600 to-emerald-800 bg-[#047857] rounded-3xl p-6 border border-emerald-500/10 shadow-md">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-white/80 text-xs font-bold font-jakarta uppercase tracking-wider">
                      Solana Welfare Vault
                    </Text>
                    <View className="bg-emerald-500/30 px-2.5 py-0.5 rounded-full border border-emerald-400/20">
                      <Text className="text-white font-bold text-[9px] uppercase font-jakarta">
                        SOL Devnet
                      </Text>
                    </View>
                  </View>

                  <Text className="text-white text-headline-xl font-bold font-jakarta mt-4">
                    ${formatUsdc(vaultState.balanceBaseUnits)} <Text className="text-xs font-semibold text-white/70">USDC</Text>
                  </Text>
                  
                  <Text className="text-white/60 text-2xs font-jakarta mt-2 leading-4">
                    Fully transparent welfare reserve verified in real-time. Securely locked in a PDA Program Account.
                  </Text>
                </View>

                {/* Statistics Grid */}
                <View className="flex-row gap-3">
                  {/* Total In */}
                  <View className="flex-1 bg-white border border-outline-variant/10 p-4.5 rounded-2xl shadow-xs">
                    <View className="w-9 h-9 rounded-xl bg-emerald-50 items-center justify-center mb-3">
                      <TrendingUp color="#059669" size={16} />
                    </View>
                    <Text className="text-secondary text-2xs font-medium font-jakarta uppercase">
                      Total Contributed
                    </Text>
                    <Text className="text-on-surface font-extrabold font-jakarta text-[15px] mt-1.5">
                      ${formatUsdc(vaultState.totalIn)}
                    </Text>
                  </View>

                  {/* Total Out */}
                  <View className="flex-1 bg-white border border-outline-variant/10 p-4.5 rounded-2xl shadow-xs">
                    <View className="w-9 h-9 rounded-xl bg-red-50 items-center justify-center mb-3">
                      <Wallet color="#ba1a1a" size={16} />
                    </View>
                    <Text className="text-secondary text-2xs font-medium font-jakarta uppercase">
                      Total Disbursed
                    </Text>
                    <Text className="text-on-surface font-extrabold font-jakarta text-[15px] mt-1.5">
                      ${formatUsdc(vaultState.totalOut)}
                    </Text>
                  </View>
                </View>

                {/* Claim Limits */}
                <View className="bg-white border border-outline-variant/10 rounded-2xl p-4 flex-row items-center justify-between shadow-xs">
                  <View className="flex-row items-center gap-3">
                    <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
                      <ShieldCheck color="#3B82F6" size={18} />
                    </View>
                    <View>
                      <Text className="text-on-surface font-bold text-xs font-jakarta">
                        Maximum Claim Payout Limit
                      </Text>
                      <Text className="text-secondary text-2xs font-jakarta mt-0.5">
                        Cap per single approved insurance payout
                      </Text>
                    </View>
                  </View>
                  <Text className="text-on-surface font-bold text-sm font-jakarta">
                    ${formatUsdc(vaultState.maxPayout)}
                  </Text>
                </View>

                {/* Solana Contract Ledger Details */}
                <View className="bg-white border border-outline-variant/10 rounded-3xl p-5 shadow-xs gap-4">
                  <View className="flex-row items-center gap-2">
                    <Coins color="#059669" size={18} />
                    <Text className="text-on-surface font-bold text-[14px] font-jakarta">
                      On-Chain Registry Verification
                    </Text>
                  </View>

                  <View className="h-[1px] bg-slate-100" />

                  {/* Program ID */}
                  {vaultState.programId && (
                    <Pressable
                      onPress={() => handleOpenSolanaExplorer(vaultState.programId!)}
                      className="flex-row items-center justify-between py-1.5 active:bg-slate-50 rounded"
                    >
                      <View className="flex-1 mr-2">
                        <Text className="text-secondary text-2xs font-jakarta uppercase">
                          Anchor Program ID
                        </Text>
                        <Text className="text-on-surface font-bold text-[11px] font-jakarta mt-0.5" numberOfLines={1}>
                          {vaultState.programId}
                        </Text>
                      </View>
                      <ExternalLink color="#059669" size={14} />
                    </Pressable>
                  )}

                  {/* Vault Token Account */}
                  {vaultState.vaultTokenAccount && (
                    <Pressable
                      onPress={() => handleOpenSolanaExplorer(vaultState.vaultTokenAccount!)}
                      className="flex-row items-center justify-between py-1.5 active:bg-slate-50 rounded"
                    >
                      <View className="flex-1 mr-2">
                        <Text className="text-secondary text-2xs font-jakarta uppercase">
                          USDC Vault Token ATA
                        </Text>
                        <Text className="text-on-surface font-bold text-[11px] font-jakarta mt-0.5" numberOfLines={1}>
                          {vaultState.vaultTokenAccount}
                        </Text>
                      </View>
                      <ExternalLink color="#059669" size={14} />
                    </Pressable>
                  )}
                </View>
              </>
            ) : (
              <>
                {/* Fallback Naira Welfare Cooperative Ledger */}
                <View className="bg-[#eff3ff] rounded-3xl p-6 border border-slate-200 shadow-xs">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-secondary text-xs font-bold font-jakarta uppercase tracking-wider">
                      Welfare Reserve Fund
                    </Text>
                    <View className="bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                      <Text className="text-primary font-bold text-[9px] uppercase font-jakarta">
                        Naira Ledger
                      </Text>
                    </View>
                  </View>

                  <Text className="text-[#0B1C30] text-headline-xl font-bold font-jakarta mt-4">
                    ₦1,250,000.00
                  </Text>
                  
                  <Text className="text-secondary text-2xs font-jakarta mt-2 leading-4">
                    Cooperative welfare reserve fund managed off-chain. Contributions and payouts are logged to local NGN bank registers.
                  </Text>
                </View>

                {/* Naira Grid */}
                <View className="flex-row gap-3">
                  {/* Total In */}
                  <View className="flex-1 bg-white border border-outline-variant/10 p-4.5 rounded-2xl shadow-xs">
                    <View className="w-9 h-9 rounded-xl bg-emerald-50 items-center justify-center mb-3">
                      <TrendingUp color="#059669" size={16} />
                    </View>
                    <Text className="text-secondary text-2xs font-medium font-jakarta uppercase">
                      Total Contributed
                    </Text>
                    <Text className="text-on-surface font-extrabold font-jakarta text-[15px] mt-1.5">
                      ₦4,500,000.00
                    </Text>
                  </View>

                  {/* Total Out */}
                  <View className="flex-1 bg-white border border-outline-variant/10 p-4.5 rounded-2xl shadow-xs">
                    <View className="w-9 h-9 rounded-xl bg-red-50 items-center justify-center mb-3">
                      <Wallet color="#ba1a1a" size={16} />
                    </View>
                    <Text className="text-secondary text-2xs font-medium font-jakarta uppercase">
                      Total Paid Out
                    </Text>
                    <Text className="text-on-surface font-extrabold font-jakarta text-[15px] mt-1.5">
                      ₦3,250,000.00
                    </Text>
                  </View>
                </View>

                {/* Claim Limits Naira */}
                <View className="bg-white border border-outline-variant/10 rounded-2xl p-4 flex-row items-center justify-between shadow-xs">
                  <View className="flex-row items-center gap-3">
                    <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
                      <ShieldCheck color="#3B82F6" size={18} />
                    </View>
                    <View>
                      <Text className="text-on-surface font-bold text-xs font-jakarta">
                        Maximum Claim Payout Limit
                      </Text>
                      <Text className="text-secondary text-2xs font-jakarta mt-0.5">
                        Cap per single approved off-chain claim
                      </Text>
                    </View>
                  </View>
                  <Text className="text-on-surface font-bold text-sm font-jakarta">
                    ₦150,000.00
                  </Text>
                </View>

                {/* Info Note */}
                <View className="bg-white border border-outline-variant/10 rounded-3xl p-5 shadow-xs flex-row items-start gap-3">
                  <Info color="#059669" size={18} style={{ marginTop: 2 }} />
                  <View className="flex-1">
                    <Text className="text-on-surface font-bold text-xs font-jakarta">
                      Cooperative Off-Chain Protocol
                    </Text>
                    <Text className="text-secondary text-2xs font-jakarta mt-1 leading-4">
                      The Solana welfare program is optional and currently deactivated. All cooperative insurance benefits and accident claims are settled in Naira directly via the Treasury Office.
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* Educational Guidelines */}
            <View className="bg-white border border-outline-variant/10 rounded-3xl p-5 shadow-xs gap-4.5">
              <View className="flex-row items-center gap-2">
                <BookOpen color="#059669" size={18} />
                <Text className="text-on-surface font-bold text-[14px] font-jakarta">
                  Cooperative Welfare Guild
                </Text>
              </View>

              <View className="h-[1px] bg-slate-100" />

              {/* Guide 1 */}
              <View className="gap-1">
                <Text className="text-on-surface font-bold text-xs font-jakarta">
                  1. How are funds collected?
                </Text>
                <Text className="text-secondary text-2xs font-jakarta leading-4">
                  A small contribution (1%) is automatically deducted from passenger booking fares. This serves as your premium, funding mutual assistance reserves.
                </Text>
              </View>

              {/* Guide 2 */}
              <View className="gap-1">
                <Text className="text-on-surface font-bold text-xs font-jakarta">
                  2. Who is eligible to claim?
                </Text>
                <Text className="text-secondary text-2xs font-jakarta leading-4">
                  All active registered driver partners in good standing. You must maintain an active location profile and have successfully completed at least 15 rides in the last 30 days.
                </Text>
              </View>

              {/* Guide 3 */}
              <View className="gap-1">
                <Text className="text-on-surface font-bold text-xs font-jakarta">
                  3. What claims are supported?
                </Text>
                <Text className="text-secondary text-2xs font-jakarta leading-4">
                  Accident medical expense subsidies, vehicle damage/accident recovery assistance, and emergency roadside breakdown maintenance credits.
                </Text>
              </View>

              {/* Claim Request trigger */}
              <Pressable
                onPress={() =>
                  Alert.alert(
                    "Submit Welfare Claim",
                    "To submit an accident or damage claim, please bring your police/medical report and contact the cooperative treasury representative directly."
                  )
                }
                className="bg-primary/10 border border-primary/20 py-3.5 rounded-2xl flex-row items-center justify-center gap-1.5 active:bg-primary/20 mt-2"
              >
                <Text className="text-primary font-bold text-body-sm font-jakarta">
                  Request Cooperative Assistance
                </Text>
                <ChevronRight color="#059669" size={16} />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
