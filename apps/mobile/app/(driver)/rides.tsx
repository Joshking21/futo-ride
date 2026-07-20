import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight, Clock, Filter, X } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SectionList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiRequest } from "../../config/apiHelper";
import { useApp } from "../../context/AppContext";

interface Trip {
  rideId: string;
  fromStop: string;
  toStop: string;
  status: string;
  seats: number;
  riderId: string;
  createdAt: number;
  fare: number;
}

interface HistoryResponse {
  rides: Trip[];
  nextCursor: number | null;
}

const MOCK_HISTORY_RIDES: Trip[] = Array.from({ length: 100 }, (_, index) => {
  const stops = ["seet", "gate", "library", "hostel3", "science", "engineering"];
  const fromStop = stops[index % stops.length];
  const toStop = stops[(index + 2) % stops.length];
  return {
    rideId: `mock-trip-${index + 1}`,
    fromStop,
    toStop,
    status: index % 5 === 0 ? "cancelled" : "completed",
    seats: (index % 3) + 1,
    riderId: `rider-${index}`,
    createdAt: Date.now() - index * 30 * 60 * 1000, // spaced 30 mins apart
    fare: 10000 + (index % 10) * 5000, // ₦100 to ₦150
  };
});

export default function DriverRides() {
  const router = useRouter();
  const { getStopName } = useApp();
  const [activeTab, setActiveTab] = useState<
    "Today" | "This Week" | "This Month" | "Custom"
  >("Today");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [rides, setRides] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);

  const fetchRidesHistory = useCallback(
    async (cursorVal: number | null = null, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (cursorVal) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const url = `/drivers/me/rides/history?limit=10${cursorVal ? `&cursor=${cursorVal}` : ""}`;
        const data = await apiRequest<HistoryResponse>(url);

        if (data.rides && data.rides.length > 0) {
          if (isRefresh || !cursorVal) {
            setRides(data.rides);
          } else {
            setRides((prev) => [...prev, ...data.rides]);
          }
          setNextCursor(data.nextCursor);
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        } else {
          throw new Error("No real backend rides, trigger mock fallback");
        }
      } catch (err) {
        console.log("No backend data, using simulated paginated mock data fallback.");

        // Simulate pagination using MOCK_HISTORY_RIDES
        setTimeout(() => {
          const sortedMock = [...MOCK_HISTORY_RIDES].sort((a, b) => b.createdAt - a.createdAt);

          let startIndex = 0;
          if (cursorVal) {
            startIndex = sortedMock.findIndex(r => r.createdAt === cursorVal) + 1;
          }

          if (startIndex < 0 || startIndex >= sortedMock.length) {
            if (isRefresh || !cursorVal) setRides([]);
            setNextCursor(null);
          } else {
            const pageItems = sortedMock.slice(startIndex, startIndex + 10);
            if (isRefresh || !cursorVal) {
              setRides(pageItems);
            } else {
              setRides((prev) => [...prev, ...pageItems]);
            }
            const lastItem = pageItems[pageItems.length - 1];
            const hasMore = startIndex + 10 < sortedMock.length;
            setNextCursor(hasMore ? lastItem.createdAt : null);
          }
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }, 800); // add delay so you can watch it load in real time
      }
    },
    [],
  );

  useEffect(() => {
    fetchRidesHistory();
  }, [fetchRidesHistory]);

  const handleRefresh = () => {
    fetchRidesHistory(null, true);
  };

  const handleScrollEndDrag = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    // Check if the user is at the bottom of the list when releasing their drag
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 10;
    if (isAtBottom && nextCursor && !loadingMore && !refreshing) {
      fetchRidesHistory(nextCursor);
    }
  };

  const getSectionTitle = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const getSections = () => {
    const groups: { [key: string]: Trip[] } = {};
    rides.forEach((ride) => {
      const title = getSectionTitle(ride.createdAt);
      if (!groups[title]) {
        groups[title] = [];
      }
      groups[title].push(ride);
    });
    return Object.keys(groups).map((title) => ({
      title,
      data: groups[title],
    }));
  };

  function formatCurrency(amount: number): string {
    // API returns fare in kobo (e.g. 15000 kobo = 150 Naira)
    const nairaAmount = amount / 100;
    return new Intl.NumberFormat("ng-NG", {
      style: "currency",
      currency: "NGN",
    }).format(nairaAmount);
  }

  const renderRideItem = ({ item }: { item: Trip }) => {
    const timeString = new Date(item.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <Pressable
        onPress={() => setSelectedTrip(item)}
        className="bg-white p-4 rounded-3xl border border-outline-variant/10 shadow-xs flex-row items-center justify-between active:scale-[0.99] active:opacity-95 mb-3"
      >
        <View className="flex-row items-center flex-1 mr-2">
          {/* Route Indicator pill */}
          <View className="bg-[#f0fcf4] border border-[#dcfce7] w-8 h-[64px] rounded-2xl items-center justify-between py-2.5">
            <View className="w-2 h-2 rounded-full bg-success" />
            <View className="w-[1px] border-l border-dashed border-slate-300 flex-1 my-1" />
            <View className="w-2 h-2 rounded-full bg-[#059669]" />
          </View>

          {/* Texts */}
          <View className="ml-3.5 flex-1">
            <Text
              className="text-[12px] font-bold text-on-surface font-jakarta"
              numberOfLines={1}
            >
              {getStopName(item.fromStop)}
            </Text>
            <Text
              className="text-[10px] text-secondary font-medium font-jakarta mt-0.5"
              numberOfLines={1}
            >
              to {getStopName(item.toStop)}
            </Text>
            <View className="flex-row items-center mt-1.5">
              <Clock color="#5b5e66" size={12} />
              <Text className="text-secondary font-medium text-[11px] font-jakarta ml-1">
                {timeString}
              </Text>
            </View>
          </View>
        </View>

        {/* Right pricing & chevron */}
        <View className="flex-row items-center gap-2">
          <View className="items-end mr-1">
            <Text className="text-success font-extrabold text-[12px] font-jakarta">
              {formatCurrency(item.fare)}
            </Text>
            <View
              className={`px-2 py-0.5 rounded-md mt-1 ${
                item.status === "completed" ? "bg-[#e6f9ed]" : "bg-red-50"
              }`}
            >
              <Text
                className={`font-bold text-[10px] font-jakarta capitalize ${
                  item.status === "completed" ? "text-success" : "text-red-500"
                }`}
              >
                {item.status}
              </Text>
            </View>
          </View>
          <ChevronRight color="#c5c5d8" size={16} />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      className="flex-1 bg-surface-bright"
      style={{ paddingHorizontal: 20 }}
    >
      <View className="flex-row items-center justify-between pt-4 pb-2 z-20">
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
              backgroundColor: "#059669",
            }}
          />
        </Pressable>
      </View>

      {/* Header Subtitle */}
      <Text className="text-center text-[#757687] text-[12px] font-jakarta mb-4">
        View your past rides and trip details.
      </Text>

      {loading && rides.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <SectionList
          sections={getSections()}
          keyExtractor={(item) => item.rideId}
          renderItem={renderRideItem}
          renderSectionHeader={({ section: { title } }) => (
            <View className="bg-surface-bright py-2 mt-2">
              <Text className="text-secondary text-[11px] font-bold font-jakarta uppercase tracking-wider">
                {title}
              </Text>
            </View>
          )}
          stickySectionHeadersEnabled={true}
          showsVerticalScrollIndicator={false}
          className="flex-1 mt-2"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#059669"]}
            />
          }
          onScrollEndDrag={handleScrollEndDrag}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#059669" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-secondary font-medium font-jakarta text-sm">
                No past rides found.
              </Text>
            </View>
          }
        />
      )}

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
                    <View className="w-3.5 h-3.5 rounded-full border-2 border-[#059669] bg-white items-center justify-center">
                      <View className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                    </View>
                  </View>

                  {/* Route text */}
                  <View className="flex-1 gap-4">
                    <View>
                      <Text className="text-[10px] text-secondary font-bold uppercase tracking-wider font-jakarta">
                        Pickup Location
                      </Text>
                      <Text className="text-body-md font-bold text-on-surface font-jakarta mt-0.5">
                        {getStopName(selectedTrip.fromStop)}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-[10px] text-secondary font-bold uppercase tracking-wider font-jakarta">
                        Dropoff Location
                      </Text>
                      <Text className="text-body-md font-bold text-on-surface font-jakarta mt-0.5">
                        {getStopName(selectedTrip.toStop)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Metrics Grid */}
                <View className="flex-row gap-3">
                  {/* Fare */}
                  <View
                    className="flex-1 bg-[#eff3ff] p-4 rounded-2xl border-[#eff3ff]/20"
                    style={{ elevation: 1 }}
                  >
                    <Text className="text-secondary text-[11px] font-bold font-jakarta">
                      FARE
                    </Text>
                    <Text className="text-[#059669] text-headline-sm font-extrabold font-jakarta mt-1.5">
                      {formatCurrency(selectedTrip.fare)}
                    </Text>
                  </View>

                  {/* Seats */}
                  <View
                    className="flex-1 bg-surface-bright border-outline-variant/10 p-4 rounded-2xl"
                    style={{ elevation: 1 }}
                  >
                    <Text className="text-secondary text-[11px] font-bold font-jakarta">
                      SEATS
                    </Text>
                    <Text className="text-on-surface text-headline-sm font-extrabold font-jakarta mt-1.5">
                      {selectedTrip.seats}
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
                      {selectedTrip.rideId.toUpperCase()}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-secondary text-body-sm font-medium font-jakarta">
                      Time
                    </Text>
                    <View className="flex-row items-center gap-1.5">
                      <Clock color="#5b5e66" size={14} />
                      <Text className="text-on-surface text-body-sm font-bold font-jakarta">
                        {new Date(selectedTrip.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-secondary text-body-sm font-medium font-jakarta">
                      Payment Status
                    </Text>
                    <View
                      className={`px-3 py-1 rounded-full ${
                        selectedTrip.status === "completed" ? "bg-[#e6f9ed]" : "bg-red-50"
                      }`}
                      style={{ elevation: 1 }}
                    >
                      <Text
                        className={`text-[11px] font-bold font-jakarta capitalize ${
                          selectedTrip.status === "completed" ? "text-success" : "text-red-500"
                        }`}
                      >
                        {selectedTrip.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
