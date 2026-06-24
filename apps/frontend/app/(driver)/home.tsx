import { useRouter } from "expo-router";
import {
  Bell,
  Clock,
  MapPin,
  Menu,
  Navigation,
  Radar,
  Star,
  WifiOff,
} from "lucide-react-native";
import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../context/AppContext";

export default function DriverHome() {
  const router = useRouter();
  const {
    isOnline,
    setOnline,
    activeTrip,
    triggerMockIncomingRequest,
    confirmBooking,
  } = useApp();

  const handleToggleOnline = () => {
    setOnline(!isOnline);
  };

  const handleAcceptRequest = () => {
    confirmBooking();
    router.push("/(driver)/active");
  };

  const isRequestPending =
    activeTrip.status === "searching" && activeTrip.pickup === "SOES Building";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Top Header Overlay */}
      <View style={styles.header}>
        <Pressable style={styles.iconButton}>
          <Menu color="#001caa" size={20} />
        </Pressable>

        {/* Online Status Pill */}
        <Pressable
          onPress={handleToggleOnline}
          style={isOnline ? styles.pillOnline : styles.pillOffline}
        >
          <View style={styles.dotContainer}>
            <View
              style={isOnline ? styles.pingDotOnline : styles.pingDotOffline}
            />
            <View
              style={
                isOnline ? styles.statusDotOnline : styles.statusDotOffline
              }
            />
          </View>
          <Text style={isOnline ? styles.labelOnline : styles.labelOffline}>
            {isOnline ? "Online" : "Offline"}
          </Text>
        </Pressable>

        <Pressable style={styles.bellButton}>
          <Bell color="#001caa" size={20} />
          <View style={styles.bellBadge} />
        </Pressable>
      </View>

      {/* Main Content Area */}
      <View style={styles.mapContainer}>
        {/* Interactive Map Background */}
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuD0okzKR0KPq91lUrgoEl5fyfMy1B5eqVhArkpdos9nGZDnDI-ks7j4edISnFdnY4EKDclvfu-tXw48XWwCwLTHkiWgUdTJPzw0-Wbjb64syVe-qicEEPGdmkI1X7mJoq5k_B3J8K-Wlt3yAZ33Dzy6Q9HBEh9IjQITFz8IxurvIKiiZPmecWT2IRE_rFhmA4LK39TpJEwR6einizhW-wxyX5mP-M4C_rzF5V9nyd4VRIX-5fdOl05wnH6PWCU_MI8wXXgOBBcGS5kv",
          }}
          style={styles.mapImage}
        />

        {/* Floating location marker in map */}
        <View style={styles.marker}>
          <Text style={styles.markerText}>🛺</Text>
        </View>

        {/* Bottom Sheet / Stats Container */}
        <ScrollView style={styles.bottomSheet}>
          <View style={styles.handleBar} />

          {/* Today's Earnings Header */}
          <View style={styles.earningsHeader}>
            <View>
              <Text style={styles.earningsLabel}>Today's Earnings</Text>
              <Text style={styles.earningsValue}>₦12,500</Text>
            </View>
            <Pressable
              onPress={() => router.push("/(driver)/earnings")}
              style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
            >
              <Text style={styles.detailsText}>Details ➔</Text>
            </Pressable>
          </View>

          {/* Bento Stats Grid */}
          <View style={styles.statsGrid}>
            {/* Trips Card */}
            <View style={styles.statsCard}>
              <View style={styles.statsIconWrapper}>
                <Navigation color="#001caa" size={20} />
              </View>
              <View>
                <Text style={styles.statsValue}>14</Text>
                <Text style={styles.statsLabel}>Trips</Text>
              </View>
            </View>

            {/* Online Time Card */}
            <View style={styles.statsCard}>
              <View style={styles.statsIconWrapper}>
                <Clock color="#001caa" size={20} />
              </View>
              <View>
                <Text style={styles.statsValue}>4h 20m</Text>
                <Text style={styles.statsLabel}>Online</Text>
              </View>
            </View>
          </View>

          {/* Incoming Request OR Search Panel */}
          <View style={styles.requestPanel}>
            {!isOnline ? (
              <View style={styles.offlinePanel}>
                <WifiOff color="#ba1a1a" size={32} />
                <Text style={styles.offlineTitle}>
                  You are currently offline
                </Text>
                <Text style={styles.offlineSubtitle}>
                  Go online to start receiving ride requests across campus.
                </Text>
              </View>
            ) : isRequestPending ? (
              /* Request Card Alert */
              <View style={styles.requestCard}>
                <View style={styles.requestCardHeader}>
                  <Text style={styles.requestCardTitle}>Incoming Ride</Text>
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceText}>₦300</Text>
                  </View>
                </View>

                {/* Passenger Info */}
                <View style={styles.passengerInfo}>
                  <Image
                    source={{
                      uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKv18St18L7X2vZAAMPrAWpe_RTK8EptXVp0FFMqsUDuP_GgeffQiG2BXUbeBK5fAppU3V1r1xiIbGeVUoaoTLduIBmWdC2WEHiVaf2hilbRU54kKuZ7O6ukr9iC-soO0wPXucYYRHL1OQTZr0q7bDRr1TZqfKpkpL290p2tVDrufDqbY7kxXIdHRNxOex755J1_4AtLe8z7qbpg1umUVPxW4tt5r_i6df9PbNJdOf5PFxcsnG6bDlUgGoGZnLt0vZSzW4H3KHhOMD",
                    }}
                    style={styles.passengerImage}
                  />
                  <View>
                    <Text style={styles.passengerName}>Alex</Text>
                    <View style={styles.passengerRatingRow}>
                      <Star color="#eab308" fill="#eab308" size={13} />
                      <Text style={styles.passengerSubtext}>4.9 • Student</Text>
                    </View>
                  </View>
                </View>

                {/* Route details */}
                <View style={styles.routeDetails}>
                  <View style={styles.routeRow}>
                    <MapPin color="#001caa" size={14} />
                    <Text style={styles.routeText}>
                      <Text style={styles.routeLabel}>From:</Text> SOES Building
                    </Text>
                  </View>
                  <View style={styles.routeRow}>
                    <MapPin color="#ba1a1a" size={14} />
                    <Text style={styles.routeText}>
                      <Text style={styles.routeLabel}>To:</Text> Senate Building
                    </Text>
                  </View>
                </View>

                {/* Accept Button */}
                <Pressable
                  onPress={handleAcceptRequest}
                  style={styles.acceptButton}
                >
                  <Text style={styles.acceptButtonText}>Accept Request</Text>
                </Pressable>
              </View>
            ) : (
              /* Finding Rides Panel */
              <View style={styles.findingCard}>
                <View style={styles.findingIconWrapper}>
                  <Radar color="#001caa" size={32} />
                </View>
                <Text style={styles.findingTitle}>Finding rides...</Text>
                <Text style={styles.findingSubtitle}>
                  Stay near high-demand areas like SEET Head, Hall C or FUTO
                  Gate.
                </Text>

                {/* Simulator Trigger */}
                <Pressable
                  onPress={triggerMockIncomingRequest}
                  style={styles.triggerButton}
                >
                  <Text style={styles.triggerButtonText}>
                    Trigger Simulated Request
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 64,
    backgroundColor: "#f8f9ff",
    borderBottomWidth: 1,
    borderBottomColor: "#c5c5d8",
    zIndex: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#c5c5d8",
    alignItems: "center",
    justifyContent: "center",
  },
  bellButton: {
    width: 40,
    height: 40,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#c5c5d8",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    backgroundColor: "#ba1a1a",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  pillOnline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#001caa",
    backgroundColor: "rgba(29, 53, 209, 0.1)",
  },
  pillOffline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#c5c5d8",
    backgroundColor: "#e5eeff",
  },
  dotContainer: {
    position: "relative",
    width: 8,
    height: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pingDotOnline: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    opacity: 0.75,
  },
  pingDotOffline: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#5b5e66",
    opacity: 0.75,
  },
  statusDotOnline: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },
  statusDotOffline: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#5b5e66",
  },
  labelOnline: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Plus Jakarta Sans",
    color: "#001caa",
  },
  labelOffline: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Plus Jakarta Sans",
    color: "#5b5e66",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
    zIndex: 0,
  },
  mapImage: {
    width: "100%",
    height: 280,
    resizeMode: "cover",
  },
  marker: {
    position: "absolute",
    top: 120,
    left: "50%",
    marginTop: -16,
    marginLeft: -16,
    width: 32,
    height: 32,
    backgroundColor: "#001caa",
    borderRadius: 16,
    borderWidth: 4,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  markerText: {
    fontSize: 12,
    color: "#ffffff",
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: "#f8f9ff",
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: "#c5c5d8",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    marginTop: -24,
  },
  handleBar: {
    width: 48,
    height: 4,
    backgroundColor: "#c5c5d8",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  earningsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  earningsLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5b5e66",
    textTransform: "uppercase",
    fontFamily: "Plus Jakarta Sans",
  },
  earningsValue: {
    fontSize: 40,
    fontWeight: "700",
    color: "#0b1c30",
    fontFamily: "Plus Jakarta Sans",
  },
  detailsText: {
    color: "#001caa",
    fontWeight: "700",
    fontSize: 14,
    fontFamily: "Plus Jakarta Sans",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    backgroundColor: "#e5eeff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c5c5d8",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statsIconWrapper: {
    width: 40,
    height: 40,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: "600",
    color: "#0b1c30",
    fontFamily: "Plus Jakarta Sans",
  },
  statsLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#5b5e66",
    fontFamily: "Plus Jakarta Sans",
  },
  requestPanel: {
    paddingBottom: 64,
  },
  offlinePanel: {
    borderWidth: 1,
    borderColor: "#c5c5d8",
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  offlineTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0b1c30",
    marginTop: 12,
    fontFamily: "Plus Jakarta Sans",
  },
  offlineSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#5b5e66",
    textAlign: "center",
    marginTop: 4,
    fontFamily: "Plus Jakarta Sans",
  },
  requestCard: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#001caa",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    gap: 16,
  },
  requestCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  requestCardTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#001caa",
    fontFamily: "Plus Jakarta Sans",
  },
  priceBadge: {
    backgroundColor: "rgba(0, 28, 170, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "rgba(0, 28, 170, 0.2)",
  },
  priceText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#001caa",
    fontFamily: "Plus Jakarta Sans",
  },
  passengerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  passengerImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    resizeMode: "cover",
  },
  passengerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0b1c30",
    fontFamily: "Plus Jakarta Sans",
  },
  passengerRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  passengerSubtext: {
    fontSize: 14,
    color: "#5b5e66",
    fontFamily: "Plus Jakarta Sans",
  },
  routeDetails: {
    backgroundColor: "#eff4ff",
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  routeText: {
    fontSize: 14,
    color: "#0b1c30",
    fontFamily: "Plus Jakarta Sans",
  },
  routeLabel: {
    fontWeight: "700",
    color: "#001caa",
  },
  acceptButton: {
    width: "100%",
    backgroundColor: "#001caa",
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  acceptButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Plus Jakarta Sans",
  },
  findingCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#c5c5d8",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  findingIconWrapper: {
    width: 64,
    height: 64,
    backgroundColor: "rgba(0, 28, 170, 0.1)",
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  findingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0b1c30",
    fontFamily: "Plus Jakarta Sans",
  },
  findingSubtitle: {
    fontSize: 14,
    color: "#5b5e66",
    textAlign: "center",
    marginTop: 4,
    maxWidth: 240,
    fontFamily: "Plus Jakarta Sans",
  },
  triggerButton: {
    marginTop: 24,
    backgroundColor: "#f8f9ff",
    borderWidth: 1,
    borderColor: "#c5c5d8",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  triggerButtonText: {
    fontSize: 11,
    color: "#001caa",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    fontFamily: "Plus Jakarta Sans",
  },
});
