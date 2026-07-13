import { Modal, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight, Clock, Filter, X } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable } from "react-native";

interface Trip {
  rideId: string;
  fromStop: string;
  toStop: string;
  status: string;
  seats: number;
  riderId: string;
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

export default function DriverRides() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "Today" | "This Week" | "This Month" | "Custom"
  >("Today");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [activeRides, setActiveRides] = useState<Trip[]>([]);
  

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("ng-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  }



  return (
    <SafeAreaView
      className="flex-1 bg-surface-bright"
      style={{ paddingHorizontal: 20 }}
    >
      <View className="flex-row items-center justify-between  pt-4 pb-2 z-20">
        <Pressable
          onPress={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-white items-center justify-center active:bg-surface-container"
          style={{ elevation: 1 }}
        >
          <ArrowLeft color="#0B1C30" size={15} />
        </Pressable>

        <Text className="text-body-md font-bold text-on-surface font-jakarta">
          Ride History
        </Text>

        <Pressable
          className="w-12 h-12 rounded-2xl bg-white items-center justify-center active:bg-surface-container relative"
          style={{ elevation: 1 }}
        >
          <Filter color="#0B1C30" size={15} />
          {/* Small blue dot notification */}
          <View
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "#001caa",
            }}
          />
        </Pressable>
      </View>

      {/* Header Subtitle */}
      <Text className="text-center text-[#757687] text-[12px] font-jakarta">
        View your past rides and trip details.
      </Text>
      {/* Tabs Selector */}
      <View className="bg-[#f0f2f5] p-1 rounded-2xl border-4 border-white flex-row items-center mt-2">
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

      <ScrollView
        // contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Trips list */}
        <View className="gap-3">
          {COMPLETED_TRIPS_MOCK.map((trip) => (
            <Pressable
              key={trip.id}
              onPress={() => setSelectedTrip(trip)}
              className="bg-white p-4 rounded-3xl border border-outline-variant/10 shadow-xs flex-row items-center justify-between active:scale-[0.99] active:opacity-95"
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
                  <Text className="text-success font-extrabold text-[12px] font-jakarta">
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
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Trip Details Bottom Sheet Modal */}
      <Modal
        visible={selectedTrip !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedTrip(null)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          {/* Backdrop Dismiss area */}
          <Pressable
            className="absolute inset-0"
            onPress={() => setSelectedTrip(null)}
          />

          {/* Bottom Sheet Card */}
          <View className="bg-white rounded-t-[32px] p-6 pb-12 shadow-2xl z-10 border-t border-outline-variant/10">
            {/* Pull Handle */}
            <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mb-6" />

            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-headline-sm font-extrabold text-[#0B1C30] font-jakarta">
                Trip Details
              </Text>
              <Pressable
                onPress={() => setSelectedTrip(null)}
                className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center active:bg-slate-200"
              >
                <X color="#5b5e66" size={20} />
              </Pressable>
            </View>

            {selectedTrip && (
              <View className="gap-6">
                {/* Route Section */}
                <View className="bg-[#f8f9ff] p-5 rounded-3xl border border-outline-variant/5 flex-row gap-4">
                  {/* Visual Route indicator */}
                  <View className="items-center py-1">
                    <View className="w-3.5 h-3.5 rounded-full border-2 border-success bg-white items-center justify-center">
                      <View className="w-1.5 h-1.5 rounded-full bg-success" />
                    </View>
                    <View className="w-[1px] border-l border-dashed border-slate-300 flex-1 my-1.5" />
                    <View className="w-3.5 h-3.5 rounded-full border-2 border-[#001caa] bg-white items-center justify-center">
                      <View className="w-1.5 h-1.5 rounded-full bg-[#001caa]" />
                    </View>
                  </View>

                  {/* Route text */}
                  <View className="flex-1 gap-4">
                    <View>
                      <Text className="text-[10px] text-secondary font-bold uppercase tracking-wider font-jakarta">
                        Pickup Location
                      </Text>
                      <Text className="text-body-md font-bold text-on-surface font-jakarta mt-0.5">
                        {selectedTrip.pickup}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-[10px] text-secondary font-bold uppercase tracking-wider font-jakarta">
                        Dropoff Location
                      </Text>
                      <Text className="text-body-md font-bold text-on-surface font-jakarta mt-0.5">
                        {selectedTrip.destination}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Metrics Grid */}
                <View className="flex-row gap-3">
                  {/* Fare */}
                  <View
                    className="flex-1 bg-[#eff3ff] p-4 rounded-2xl  border-[#eff3ff]/20"
                    style={{ elevation: 1 }}
                  >
                    <Text className="text-secondary text-[11px] font-bold font-jakarta">
                      FARE
                    </Text>
                    <Text className="text-[#001caa] text-headline-sm font-extrabold font-jakarta mt-1.5">
                      {formatCurrency(selectedTrip.price)}
                    </Text>
                  </View>

                  {/* Distance */}
                  <View
                    className="flex-1 bg-surface-bright  border-outline-variant/10 p-4 rounded-2xl"
                    style={{ elevation: 1 }}
                  >
                    <Text className="text-secondary text-[11px] font-bold font-jakarta">
                      DISTANCE
                    </Text>
                    <Text className="text-on-surface text-headline-sm font-extrabold font-jakarta mt-1.5">
                      {selectedTrip.distance}
                    </Text>
                  </View>
                </View>

                {/* Info List */}
                <View className="border-t border-b border-outline-variant/10 py-4 gap-3.5">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-secondary text-body-sm font-medium font-jakarta">
                      Trip ID
                    </Text>
                    <Text className="text-on-surface text-body-sm font-bold font-jakarta">
                      {selectedTrip.id.toUpperCase()}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-secondary text-body-sm font-medium font-jakarta">
                      Time
                    </Text>
                    <View className="flex-row items-center gap-1.5">
                      <Clock color="#5b5e66" size={14} />
                      <Text className="text-on-surface text-body-sm font-bold font-jakarta">
                        {selectedTrip.time}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-secondary text-body-sm font-medium font-jakarta">
                      Payment Status
                    </Text>
                    <View
                      className="bg-[#e6f9ed] px-3 py-1 rounded-full "
                      style={{ elevation: 1 }}
                    >
                      <Text className="text-success text-[11px] font-bold font-jakarta">
                        {selectedTrip.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Close Button */}
                {/* <Pressable
                  onPress={() => setSelectedTrip(null)}
                  className="bg-[#001caa] h-14 rounded-2xl items-center justify-center shadow-sm active:opacity-90"
                >
                  <Text className="text-white font-bold text-action-lg font-jakarta">
                    Close Details
                  </Text>
                </Pressable> */}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
