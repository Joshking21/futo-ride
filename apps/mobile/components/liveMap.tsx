import React, { useEffect, useState } from "react";
import { StyleSheet, View, Dimensions, Platform } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import KekeIcon from "./KekeIcon";
import { db } from "../config/firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface DriverLoc {
  id: string;
  name?: string;
  currentLat: number;
  currentLng: number;
}

export default function LiveMapScreen() {
  const [drivers, setDrivers] = useState<DriverLoc[]>([]);
  const [mapRegion] = useState({
    latitude: 5.3900,   // FUTO Center
    longitude: 7.0010,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  });

  useEffect(() => {
    const q = query(collection(db, "drivers"), where("online", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      const list: DriverLoc[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        if (typeof data.currentLat === "number" && typeof data.currentLng === "number") {
          list.push({
            id: doc.id,
            name: data.name,
            currentLat: data.currentLat,
            currentLng: data.currentLng,
          });
        }
      });
      setDrivers(list);
    });
    return () => unsub();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        // Only use GOOGLE on Android for now. iOS will fall back to beautiful Apple Maps instantly.
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {drivers.map((driver) => (
          <Marker
            key={driver.id}
            coordinate={{
              latitude: driver.currentLat,
              longitude: driver.currentLng,
            }}
            title={driver.name || "Keke"}
            description="Available Keke"
          >
            <View style={styles.kekeContainer}>
              <KekeIcon size={26} color="#001caa" />
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  map: { width: Dimensions.get("window").width, height: Dimensions.get("window").height },
  kekeContainer: {
    backgroundColor: "#ffffff",
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 28, 170, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
    justifyContent: "center",
  },
});