import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import polyline from "@mapbox/polyline";
import { colors } from "../../theme/colors";

interface TripMapPreviewProps {
  routePolyline?: string | null;
  originLat?: number | null;
  originLng?: number | null;
  destLat?: number | null;
  destLng?: number | null;
  height?: number;
}

export function TripMapPreview({
  routePolyline,
  originLat,
  originLng,
  destLat,
  destLng,
  height = 150,
}: TripMapPreviewProps) {
  // Decode polyline if available
  const routeCoordinates = routePolyline
    ? polyline.decode(routePolyline).map(([lat, lng]) => ({
        latitude: lat,
        longitude: lng,
      }))
    : [];

  // Calculate region to fit the route
  const getRegion = () => {
    if (routeCoordinates.length > 0) {
      const lats = routeCoordinates.map((c) => c.latitude);
      const lngs = routeCoordinates.map((c) => c.longitude);

      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      const midLat = (minLat + maxLat) / 2;
      const midLng = (minLng + maxLng) / 2;

      // Add padding to the delta
      const latDelta = (maxLat - minLat) * 1.5 || 0.01;
      const lngDelta = (maxLng - minLng) * 1.5 || 0.01;

      return {
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: Math.max(latDelta, 0.01),
        longitudeDelta: Math.max(lngDelta, 0.01),
      };
    }

    // Fallback to origin/dest coordinates
    if (originLat && originLng && destLat && destLng) {
      const midLat = (originLat + destLat) / 2;
      const midLng = (originLng + destLng) / 2;
      const latDelta = Math.abs(originLat - destLat) * 1.5 || 0.01;
      const lngDelta = Math.abs(originLng - destLng) * 1.5 || 0.01;

      return {
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: Math.max(latDelta, 0.01),
        longitudeDelta: Math.max(lngDelta, 0.01),
      };
    }

    // Default region (NYC)
    return {
      latitude: 40.7128,
      longitude: -74.006,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  };

  const hasRoute = routeCoordinates.length > 0;
  const hasMarkers = originLat && originLng && destLat && destLng;

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={getRegion()}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {hasRoute && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.primary}
            strokeWidth={3}
          />
        )}

        {hasMarkers && (
          <>
            <Marker
              coordinate={{ latitude: originLat, longitude: originLng }}
              pinColor={colors.success}
            />
            <Marker
              coordinate={{ latitude: destLat, longitude: destLng }}
              pinColor={colors.error}
            />
          </>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: "hidden",
    marginVertical: 8,
  },
  map: {
    flex: 1,
  },
});
