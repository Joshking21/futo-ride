import React from "react";
import { View, Text, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../context/AppContext";
import { Compass, CheckCircle2, XCircle, ArrowRight, MapPin } from "lucide-react-native";

export default function RideHistory() {
  const { rideHistory } = useApp();

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Header */}
      <View className="px-margin-mobile py-4 border-b border-outline-variant/30 bg-surface-container-lowest flex-row items-center justify-between">
        <Text className="text-headline-md font-bold text-on-surface font-jakarta">Ride History</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="flex-1 px-margin-mobile py-6">
        <View className="flex flex-col gap-4">
          
          {rideHistory.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Text className="text-body-md text-secondary">No ride history found</Text>
            </View>
          ) : (
            rideHistory.map((ride) => {
              const isCompleted = ride.status === "completed";
              
              return (
                <View
                  key={ride.id}
                  className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 shadow-sm relative overflow-hidden"
                >
                  {/* Left Status Accent Bar */}
                  <View className={`absolute left-0 top-0 bottom-0 w-1 ${isCompleted ? "bg-primary" : "bg-error"}`} />

                  {/* Header: Date & Status */}
                  <View className="flex-row justify-between items-center mb-4 pl-1">
                    <Text className="text-body-sm text-secondary font-medium">{ride.date}</Text>
                    <View className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-full ${
                      isCompleted ? "bg-primary-container/10" : "bg-error-container"
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 color={isCompleted ? "#001caa" : "#ba1a1a"} size={13} />
                      ) : (
                        <XCircle color="#ba1a1a" size={13} />
                      )}
                      <Text className={`text-label-sm font-bold uppercase ${
                        isCompleted ? "text-primary" : "text-error"
                      }`}>
                        {ride.status}
                      </Text>
                    </View>
                  </View>

                  {/* Route Setup */}
                  <View className="flex-row items-start gap-3 mb-4 pl-1">
                    {/* Visual Route indicator path */}
                    <View className="items-center mt-1 w-5">
                      <View className="w-2.5 h-2.5 rounded-full bg-outline-variant/80 border border-white" />
                      <View className="w-[1px] h-8 bg-outline-variant/30 my-1" />
                      <MapPin color="#001caa" size={16} />
                    </View>
                    <View className="flex-col gap-3 flex-1">
                      <View>
                        <Text className="text-[10px] text-secondary uppercase font-bold">Pickup</Text>
                        <Text className="text-body-sm font-semibold text-on-surface">{ride.pickup}</Text>
                      </View>
                      <View>
                        <Text className="text-[10px] text-secondary uppercase font-bold">Drop-off</Text>
                        <Text className="text-body-sm font-semibold text-on-surface">{ride.destination}</Text>
                      </View>
                    </View>
                  </View>

                  <View className="h-[1px] bg-outline-variant/10 w-full mb-4" />

                  {/* Footer: Driver & Price */}
                  <View className="flex-row justify-between items-center pl-1">
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 rounded-full overflow-hidden bg-surface-container border border-outline-variant/20">
                        <Image
                          source={{
                            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgChKZHasGdwnuecPCL5z4HRuvaLDkZUUckKM2ebyUe-ApB7cqZNIf9KWH2hLaYdst3EJ8KR_YYbiniXwZzWaKB_rKE6pSeYerY_7Cd6vz7PNIy1Q2cOIbHlEv02fO09UxEgO5KDwOcEjWXpheWissKDutWf3fFXLQAU9HgWACkJXcH4j2ZG1cXbmXPDnS1lduq7v5oMhoB06PA3uiy_32gd8rJloh7RfepU4yvZcOT_HUcc8sKqhd4adG61gyTy-UDkUeEinj8iSG",
                          }}
                          className="w-full h-full object-cover"
                        />
                      </View>
                      <View>
                        <Text className="text-[10px] text-secondary font-medium">Driver</Text>
                        <Text className="text-body-md font-bold text-on-surface">{ride.driverName}</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-[10px] text-secondary font-medium">Fare</Text>
                      <Text className="text-body-lg font-black text-primary">₦ {ride.price}</Text>
                    </View>
                  </View>

                </View>
              );
            })
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
