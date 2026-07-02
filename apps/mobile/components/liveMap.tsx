import React, { useState } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { Platform } from "react-native";

export default function LiveMapScreen() {
  const [mapRegion] = useState({
    latitude: 5.3900,   // FUTO Center
    longitude: 7.0010,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  });

  return (
    <View style={styles.container}>
      <MapView
        // Only use GOOGLE on Android for now. iOS will fall back to beautiful Apple Maps instantly.
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  map: { width: Dimensions.get("window").width, height: Dimensions.get("window").height },
});