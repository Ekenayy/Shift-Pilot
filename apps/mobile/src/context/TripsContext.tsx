import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  tripService,
  deductionService,
  type TripFilters,
  type CreateManualTripParams,
} from "../services/trips";
import type {
  Trip,
  DeductionRate,
  TripPurpose,
  ClassificationStatus,
} from "../types/database";
import { useAuth } from "./AuthContext";

export type ViewMode = "trips" | "daily" | "weekly" | "monthly";

interface TripsContextType {
  // Data
  trips: Trip[];
  deductionRates: DeductionRate[];

  // Aggregations
  totalMiles: number;
  totalDeductions: number;
  unclassifiedCount: number;

  // Filters
  filters: TripFilters;
  setFilters: (filters: TripFilters) => void;

  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // CRUD operations
  refreshTrips: () => Promise<void>;
  addTrip: (params: CreateManualTripParams) => Promise<Trip>;
  classifyTrip: (tripId: string, purpose: TripPurpose) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<void>;
  toggleFavorite: (tripId: string) => Promise<void>;
  updateNotes: (tripId: string, notes: string) => Promise<void>;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
}

const TripsContext = createContext<TripsContextType | null>(null);

export function TripsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();

  // Data state
  const [trips, setTrips] = useState<Trip[]>([]);
  const [deductionRates, setDeductionRates] = useState<DeductionRate[]>([]);

  // Filter state
  const [filters, setFilters] = useState<TripFilters>({});
  const [viewMode, setViewMode] = useState<ViewMode>("trips");

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Calculate aggregations
  const workTrips = trips.filter(
    (t) =>
      t.purpose === "work" ||
      t.purpose === "charity" ||
      t.purpose === "medical" ||
      t.purpose === "military"
  );

  const totalMiles = workTrips.reduce(
    (sum, t) => sum + (t.distance_miles || 0),
    0
  );

  const totalDeductions = workTrips.reduce(
    (sum, t) => sum + (t.deduction_value || 0),
    0
  );

  const unclassifiedCount = trips.filter(
    (t) => t.classification_status === "unclassified"
  ).length;

  // Fetch trips
  const fetchTrips = useCallback(async () => {
    if (!session) return;

    try {
      const data = await tripService.getTrips(filters);
      setTrips(data);
      setError(null);
    } catch (err) {
      console.error("[TripsContext] Error fetching trips:", err);
      setError(err as Error);
    }
  }, [session, filters]);

  // Fetch deduction rates
  const fetchRates = useCallback(async () => {
    try {
      const rates = await deductionService.getDeductionRates();
      setDeductionRates(rates);
    } catch (err) {
      console.error("[TripsContext] Error fetching rates:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!session) {
      setTrips([]);
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTrips(), fetchRates()]);
      setIsLoading(false);
    };

    loadData();
  }, [session, fetchTrips, fetchRates]);

  // Refresh handler (for pull-to-refresh)
  const refreshTrips = useCallback(async () => {
    setIsRefreshing(true);
    await fetchTrips();
    setIsRefreshing(false);
  }, [fetchTrips]);

  // Add a new manual trip
  const addTrip = useCallback(
    async (params: CreateManualTripParams): Promise<Trip> => {
      try {
        const newTrip = await tripService.createManualTrip(params);
        // Add to beginning of list (most recent first)
        setTrips((prev) => [newTrip, ...prev]);
        return newTrip;
      } catch (err) {
        console.error("[TripsContext] Error adding trip:", err);
        throw err;
      }
    },
    []
  );

  // Classify trip
  const classifyTrip = useCallback(
    async (tripId: string, purpose: TripPurpose) => {
      try {
        const updatedTrip = await tripService.classifyTrip(tripId, purpose);
        setTrips((prev) =>
          prev.map((t) => (t.id === tripId ? updatedTrip : t))
        );
      } catch (err) {
        console.error("[TripsContext] Error classifying trip:", err);
        throw err;
      }
    },
    []
  );

  // Delete trip
  const deleteTrip = useCallback(async (tripId: string) => {
    try {
      await tripService.deleteTrip(tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (err) {
      console.error("[TripsContext] Error deleting trip:", err);
      throw err;
    }
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback(async (tripId: string) => {
    try {
      const updatedTrip = await tripService.toggleFavorite(tripId);
      setTrips((prev) =>
        prev.map((t) => (t.id === tripId ? updatedTrip : t))
      );
    } catch (err) {
      console.error("[TripsContext] Error toggling favorite:", err);
      throw err;
    }
  }, []);

  // Update notes
  const updateNotes = useCallback(async (tripId: string, notes: string) => {
    try {
      const updatedTrip = await tripService.updateNotes(tripId, notes);
      setTrips((prev) =>
        prev.map((t) => (t.id === tripId ? updatedTrip : t))
      );
    } catch (err) {
      console.error("[TripsContext] Error updating notes:", err);
      throw err;
    }
  }, []);

  const value: TripsContextType = {
    trips,
    deductionRates,
    totalMiles,
    totalDeductions,
    unclassifiedCount,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    refreshTrips,
    addTrip,
    classifyTrip,
    deleteTrip,
    toggleFavorite,
    updateNotes,
    isLoading,
    isRefreshing,
    error,
  };

  return (
    <TripsContext.Provider value={value}>{children}</TripsContext.Provider>
  );
}

export function useTrips(): TripsContextType {
  const context = useContext(TripsContext);
  if (!context) {
    throw new Error("useTrips must be used within a TripsProvider");
  }
  return context;
}
