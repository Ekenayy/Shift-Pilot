import { supabase } from "../supabaseClient";
import type { DeductionRate, TripPurpose } from "../../types/database";

export interface DeductionResult {
  rate: number;
  value: number;
  purpose: TripPurpose;
  displayName: string;
}

class DeductionService {
  private static instance: DeductionService;
  private cachedRates: DeductionRate[] | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 3600000; // 1 hour

  private constructor() {}

  static getInstance(): DeductionService {
    if (!DeductionService.instance) {
      DeductionService.instance = new DeductionService();
    }
    return DeductionService.instance;
  }

  async getDeductionRates(): Promise<DeductionRate[]> {
    // Return cached rates if still valid
    if (this.cachedRates && Date.now() < this.cacheExpiry) {
      return this.cachedRates;
    }

    const { data, error } = await supabase
      .from("deduction_rates")
      .select("*")
      .eq("is_active", true)
      .lte("effective_from", new Date().toISOString().split("T")[0])
      .order("purpose");

    if (error) {
      console.error("[DeductionService] Error fetching rates:", error);
      // Return cached rates if available, even if expired
      if (this.cachedRates) {
        return this.cachedRates;
      }
      throw error;
    }

    this.cachedRates = data;
    this.cacheExpiry = Date.now() + this.CACHE_DURATION;
    return data;
  }

  async getRateForPurpose(purpose: TripPurpose): Promise<DeductionRate | null> {
    const rates = await this.getDeductionRates();
    return rates.find((r) => r.purpose === purpose) || null;
  }

  async calculateDeduction(
    miles: number,
    purpose: TripPurpose
  ): Promise<DeductionResult> {
    const rate = await this.getRateForPurpose(purpose);

    if (!rate) {
      // Default to 0 if no rate found (e.g., personal trips)
      return {
        rate: 0,
        value: 0,
        purpose,
        displayName: "Unknown",
      };
    }

    return {
      rate: rate.rate_per_mile,
      value: Number((miles * rate.rate_per_mile).toFixed(2)),
      purpose,
      displayName: rate.display_name,
    };
  }

  // Clear cache (useful for testing or forcing refresh)
  clearCache(): void {
    this.cachedRates = null;
    this.cacheExpiry = 0;
  }
}

export const deductionService = DeductionService.getInstance();
