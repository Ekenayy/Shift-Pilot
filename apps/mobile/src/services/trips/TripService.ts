import polyline from "@mapbox/polyline";
import { supabase } from "../supabaseClient";
import { locationService } from "../location";
import { deductionService } from "./DeductionService";
import type { LocationUpdate } from "../location/types";
import type {
  Trip,
  TripInsert,
  TripUpdate,
  TripPurpose,
  ClassificationStatus,
} from "../../types/database";

export interface CreateTripParams {
  locations: LocationUpdate[];
  purpose?: TripPurpose;
  source?: string;
  notes?: string;
}

export interface TripFilters {
  classificationStatus?: ClassificationStatus | "all";
  purpose?: TripPurpose | "all";
  isFavorite?: boolean;
  startDate?: Date;
  endDate?: Date;
}

class TripService {
  private static instance: TripService;

  private constructor() {}

  static getInstance(): TripService {
    if (!TripService.instance) {
      TripService.instance = new TripService();
    }
    return TripService.instance;
  }

  // Calculate total distance from locations using Haversine formula
  calculateTotalDistance(locations: LocationUpdate[]): number {
    if (locations.length < 2) return 0;

    let totalMeters = 0;
    for (let i = 1; i < locations.length; i++) {
      totalMeters += this.haversineDistance(
        locations[i - 1].coords.latitude,
        locations[i - 1].coords.longitude,
        locations[i].coords.latitude,
        locations[i].coords.longitude
      );
    }

    return totalMeters;
  }

  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Encode locations to polyline string
  encodePolyline(locations: LocationUpdate[]): string {
    const points = locations.map((loc) => [
      loc.coords.latitude,
      loc.coords.longitude,
    ]);
    return polyline.encode(points as [number, number][]);
  }

  // Decode polyline to coordinates
  decodePolyline(encoded: string): [number, number][] {
    return polyline.decode(encoded);
  }

  // Create a new trip from recorded locations
  async createTrip(params: CreateTripParams): Promise<Trip> {
    const { locations, purpose = "unknown", source = "manual", notes } = params;

    if (locations.length < 2) {
      throw new Error("Trip must have at least 2 locations");
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Calculate metrics
    const distanceMeters = this.calculateTotalDistance(locations);
    const distanceMiles = distanceMeters / 1609.34;
    const distanceKm = distanceMeters / 1000;

    const startTime = locations[0].timestamp;
    const endTime = locations[locations.length - 1].timestamp;
    const durationSeconds = Math.floor((endTime - startTime) / 1000);

    // Calculate deduction
    const deduction = await deductionService.calculateDeduction(
      distanceMiles,
      purpose
    );

    // Get addresses
    const [originAddress, destAddress] = await Promise.all([
      locationService.reverseGeocode(
        locations[0].coords.latitude,
        locations[0].coords.longitude
      ),
      locationService.reverseGeocode(
        locations[locations.length - 1].coords.latitude,
        locations[locations.length - 1].coords.longitude
      ),
    ]);

    // Encode route
    const routePolyline = this.encodePolyline(locations);

    const tripData: TripInsert = {
      user_id: user.id,
      started_at: new Date(startTime).toISOString(),
      ended_at: new Date(endTime).toISOString(),
      duration_seconds: durationSeconds,
      distance_miles: Number(distanceMiles.toFixed(2)),
      distance_km: Number(distanceKm.toFixed(2)),
      purpose,
      deduction_rate: deduction.rate,
      deduction_value: deduction.value,
      origin_lat: locations[0].coords.latitude,
      origin_lng: locations[0].coords.longitude,
      dest_lat: locations[locations.length - 1].coords.latitude,
      dest_lng: locations[locations.length - 1].coords.longitude,
      origin_address: originAddress,
      dest_address: destAddress,
      route_polyline: routePolyline,
      source,
      notes,
      classification_status:
        purpose === "unknown" ? "unclassified" : "auto_classified",
    };

    const { data, error } = await supabase
      .from("trips")
      .insert(tripData as any)
      .select()
      .single();

    if (error) {
      console.error("[TripService] Error creating trip:", error);
      throw error;
    }

    console.log(`[TripService] Created trip: ${(data as Trip).id}`);
    return data as Trip;
  }

  // Fetch trips with optional filters
  async getTrips(filters: TripFilters = {}): Promise<Trip[]> {
    let query = supabase.from("trips").select("*").order("started_at", {
      ascending: false,
    });

    if (
      filters.classificationStatus &&
      filters.classificationStatus !== "all"
    ) {
      query = query.eq("classification_status", filters.classificationStatus);
    }

    if (filters.purpose && filters.purpose !== "all") {
      query = query.eq("purpose", filters.purpose);
    }

    if (filters.isFavorite !== undefined) {
      query = query.eq("is_favorite", filters.isFavorite);
    }

    if (filters.startDate) {
      query = query.gte("started_at", filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte("started_at", filters.endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("[TripService] Error fetching trips:", error);
      throw error;
    }

    return data as Trip[];
  }

  // Get a single trip by ID
  async getTrip(tripId: string): Promise<Trip | null> {
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single();

    if (error) {
      console.error("[TripService] Error fetching trip:", error);
      return null;
    }

    return data as Trip;
  }

  // Classify a trip
  async classifyTrip(tripId: string, purpose: TripPurpose): Promise<Trip> {
    // Recalculate deduction based on new purpose
    const trip = await this.getTrip(tripId);
    if (!trip) throw new Error("Trip not found");

    const deduction = await deductionService.calculateDeduction(
      trip.distance_miles || 0,
      purpose
    );

    const updateData: TripUpdate = {
      purpose,
      deduction_rate: deduction.rate,
      deduction_value: deduction.value,
      classification_status: "manually_classified",
    };

    const { data, error } = await supabase
      .from("trips")
      .update(updateData as any)
      .eq("id", tripId)
      .select()
      .single();

    if (error) {
      console.error("[TripService] Error classifying trip:", error);
      throw error;
    }

    console.log(`[TripService] Classified trip ${tripId} as ${purpose}`);
    return data as Trip;
  }

  // Toggle favorite
  async toggleFavorite(tripId: string): Promise<Trip> {
    const trip = await this.getTrip(tripId);
    if (!trip) throw new Error("Trip not found");

    const { data, error } = await supabase
      .from("trips")
      .update({ is_favorite: !trip.is_favorite } as any)
      .eq("id", tripId)
      .select()
      .single();

    if (error) {
      console.error("[TripService] Error toggling favorite:", error);
      throw error;
    }

    return data as Trip;
  }

  // Update trip notes
  async updateNotes(tripId: string, notes: string): Promise<Trip> {
    const { data, error } = await supabase
      .from("trips")
      .update({ notes } as any)
      .eq("id", tripId)
      .select()
      .single();

    if (error) {
      console.error("[TripService] Error updating notes:", error);
      throw error;
    }

    return data as Trip;
  }

  // Delete trip
  async deleteTrip(tripId: string): Promise<void> {
    const { error } = await supabase.from("trips").delete().eq("id", tripId);

    if (error) {
      console.error("[TripService] Error deleting trip:", error);
      throw error;
    }

    console.log(`[TripService] Deleted trip: ${tripId}`);
  }

  // Get aggregated stats
  async getTripStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalTrips: number;
    totalMiles: number;
    totalDeductions: number;
    unclassifiedCount: number;
  }> {
    let query = supabase.from("trips").select("*");

    if (startDate) {
      query = query.gte("started_at", startDate.toISOString());
    }
    if (endDate) {
      query = query.lte("started_at", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("[TripService] Error fetching stats:", error);
      throw error;
    }

    const trips = data as Trip[];
    const workTrips = trips.filter(
      (t) =>
        t.purpose === "work" ||
        t.purpose === "charity" ||
        t.purpose === "medical" ||
        t.purpose === "military"
    );

    return {
      totalTrips: trips.length,
      totalMiles: workTrips.reduce((sum, t) => sum + (t.distance_miles || 0), 0),
      totalDeductions: workTrips.reduce(
        (sum, t) => sum + (t.deduction_value || 0),
        0
      ),
      unclassifiedCount: trips.filter(
        (t) => t.classification_status === "unclassified"
      ).length,
    };
  }
}

export const tripService = TripService.getInstance();
