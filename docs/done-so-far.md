# Shift-Pilot: Implementation Summary

This document provides a comprehensive overview of what has been built so far in the Shift-Pilot mileage tracking app for gig drivers.

---

## Project Structure

```
apps/mobile/          # Expo React Native app
packages/shared/      # Cross-app utilities and types (placeholder)
supabase/            # Database migrations and config
docs/                # Documentation
```

---

## 1. Authentication System

### Features Implemented
- **Email/Password Authentication**: Full signup and login flows
- **OAuth Support**: Google Sign-In (Apple Sign-In scaffolded but currently disabled)
- **Session Management**: Automatic session persistence and refresh via Supabase

### How It Works
- `AuthContext.tsx` wraps the app and provides `session`, `user`, and `loading` state
- Uses Supabase Auth with `AsyncStorage` for token persistence
- `RootNavigator.tsx` conditionally renders `AuthNavigator` or `AppNavigator` based on session state

### Supabase Integration
- Uses `supabase.auth.signInWithPassword()`, `signUp()`, and `signInWithIdToken()` for OAuth
- Session state changes are tracked via `supabase.auth.onAuthStateChange()`
- User tokens are stored in AsyncStorage and auto-refreshed

### Key Files
- `src/services/auth.ts` - Auth service functions
- `src/services/supabaseClient.ts` - Typed Supabase client
- `src/context/AuthContext.tsx` - Auth state provider
- `src/screens/WelcomeScreen.tsx`, `LoginScreen.tsx`, `SignUpScreen.tsx`

---

## 2. Trip Tracking System

### Features Implemented

#### Manual Trip Recording
- Users can manually start a trip via the "+" button → "Start tracking"
- Real-time tracking with distance, duration, and estimated deduction display
- Map preview showing start location
- Stop trip flow with confirmation dialog
- Trip validation (minimum 0.1 miles and 10 seconds)
- Invalid trips are auto-discarded with user notification

#### Automatic Trip Detection
- Background location tracking using `expo-location` and `expo-task-manager`
- State machine-based detection: IDLE → POSSIBLY_MOVING → MOVING → POSSIBLY_STOPPED → IDLE
- Speed-based heuristics:
  - Movement threshold: 3 m/s (~7 mph)
  - Stationary threshold: 1 m/s (~2 mph)
  - Movement confirmation: 5 seconds
  - Stationary timeout: 3 minutes
- Push notifications when trips start/complete (via `expo-notifications`)

#### Trip Classification
- Classification modal appears after stopping a trip
- Supports multiple IRS-recognized purposes: Business, Personal, Charity, Medical, Military
- Deduction rates fetched from Supabase and cached for 24 hours
- Classification status tracked: `unclassified`, `auto_classified`, `manually_classified`

### How It Works

**ActiveTripContext** manages all active trip state:
- Persists active trip to AsyncStorage (survives app restarts)
- Calculates real-time distance using Haversine formula
- Handles both manual and auto-detected trips
- Coordinates with LocationService and TripDetectionService

**TripDetectionService** (for auto-detect):
- Receives background location updates
- Implements state machine for trip detection
- Emits events: `trip_started`, `trip_updated`, `trip_stopped`
- Validates trips before emitting `trip_stopped`

### Supabase Integration
- Trips are saved to `trips` table with full metadata
- RLS ensures users can only access their own trips
- Deduction rates fetched from `deduction_rates` table
- Route encoded as polyline string for efficient storage

### Key Files
- `src/context/ActiveTripContext.tsx` - Active trip state management
- `src/services/location/LocationService.ts` - Foreground/background location
- `src/services/location/TripDetectionService.ts` - Auto-detection state machine
- `src/services/location/BackgroundLocationHandler.ts` - Background task definition
- `src/services/trips/TripService.ts` - Trip CRUD operations
- `src/services/trips/DeductionService.ts` - Deduction rate management
- `src/components/home/ActiveTripCard.tsx` - Active trip UI

---

## 3. Manual Trip Entry

### Features Implemented
- Full-screen drawer for adding trips manually
- Date/time picker for trip date
- Location search with Google Places integration
- Map preview showing route between origin and destination
- Distance calculation using geolib (straight-line distance)
- Classification picker with rates from database
- Deduction value calculated in real-time
- Success modal with option to add another trip

### How It Works
- `AddTripDrawer` component handles the full form
- Uses `LocationSearchModal` for place search
- Distance calculated client-side using `geolib.getDistance()`
- Creates trip via `tripService.createManualTrip()`

### Supabase Integration
- Manual trips saved with `source: 'manual'`
- Deduction calculated using rates from `deduction_rates` table
- Addresses stored for display (reverse geocoding available)

### Key Files
- `src/components/trips/AddTripDrawer.tsx` - Main add trip form
- `src/components/trips/LocationSearchModal.tsx` - Place search
- `src/components/trips/TripMapPreview.tsx` - Route map preview

---

## 4. Trips Management Screen

### Features Implemented
- Segmented tabs: Trips, Daily, Weekly, Monthly (view modes)
- Summary header showing total miles and deductions
- Filters: Classification status, trip purpose, favorites
- Trip cards with:
  - Date, distance, deduction value
  - Map preview (uses polyline if available)
  - Origin/destination addresses with times
  - Action buttons: Classify, Add Notes, Delete
- Pull-to-refresh functionality
- Edit trip drawer for modifying existing trips

### How It Works
- `TripsContext` manages all trips state and operations
- Filters applied via Supabase query parameters
- Aggregations (total miles, deductions) calculated client-side
- `EditTripContext` manages edit drawer state across components

### Supabase Integration
- Trips fetched with filters: `tripService.getTrips(filters)`
- Supports filtering by: classification_status, purpose, is_favorite, date range
- CRUD operations: create, update, delete, classify
- Optimistic updates in context after successful API calls

### Key Files
- `src/screens/TripsScreen.tsx` - Main trips screen
- `src/context/TripsContext.tsx` - Trips state management
- `src/context/EditTripContext.tsx` - Edit drawer state
- `src/components/trips/TripCard.tsx` - Individual trip display
- `src/components/trips/TripsList.tsx` - Trip list with refresh
- `src/components/trips/TripFilters.tsx` - Filter controls
- `src/components/trips/EditTripDrawer.tsx` - Edit trip form

---

## 5. Navigation Structure

### Implemented Navigation
- **RootNavigator**: Switches between Auth and App based on session
- **AuthNavigator**: Welcome → SignUp / Login
- **AppNavigator**: Settings screen (modal)
- **TabNavigator**: Home, Trips, Add (modal), Transactions, Taxes

### Tab Bar Features
- Custom center "+" button with rotation animation
- Action modal with options: Add trip, Add expense, Add revenue, Start tracking
- Animated option cards with staggered reveal

### Key Files
- `src/navigation/RootNavigator.tsx`
- `src/navigation/AuthNavigator.tsx`
- `src/navigation/AppNavigator.tsx`
- `src/navigation/TabNavigator.tsx`

---

## 6. Database Schema (Supabase)

### Tables

#### `users`
- Links to `auth.users` via foreign key
- Stores: work_type, primary_platform, hourly_baseline, plan_tier, region
- RLS: Users can only read/update their own row

#### `trips`
- Core mileage data: started_at, ended_at, distance_miles, distance_km
- Location data: origin_lat/lng, dest_lat/lng, origin_address, dest_address
- Classification: purpose, classification_status
- Deduction: deduction_rate, deduction_value (snapshot at creation)
- Metadata: route_polyline, is_favorite, notes, source
- Indexes on: user_id, started_at, classification_status, is_favorite
- RLS: Full CRUD for own trips only

#### `deduction_rates`
- IRS mileage rates by purpose
- Fields: purpose, rate_per_mile, display_name, description
- Effective date range support for future rate changes
- RLS: All authenticated users can read

#### `daily_summaries`
- Aggregated daily stats: work_miles, personal_miles, deduction_value_total
- Primary key: (user_id, date)
- RLS: Users can read/write their own summaries

#### `exports`
- Export history: export_type (csv/pdf), period_start, period_end
- RLS: Users can read/create their own exports

#### `subscriptions`
- Plan management: plan (free/pro/lifetime), started_at, ended_at
- RLS: Users can read their own; admin-only insert/update

### Migrations
1. `20250104000000_initial_schema.sql` - Core tables and RLS
2. `20250106000000_create_deduction_rates.sql` - Deduction rates with 2024 IRS values
3. `20250106000001_extend_trips.sql` - Extended trip fields (polyline, favorite, addresses)

---

## 7. Push Notifications

### Features Implemented
- Trip started notification (auto-detect mode)
- Trip completed notification with potential deduction
- Classification reminder for unclassified trips
- Android notification channel setup

### How It Works
- Uses `expo-notifications` for local notifications
- Permissions requested on first notification attempt
- Notifications configured to show alert, play sound, show banner

### Key Files
- `src/services/notifications/NotificationService.ts`

---

## 8. Location Services

### Features Implemented
- Foreground location tracking (manual trips)
- Background location tracking (auto-detect)
- Permission management (foreground and background)
- Reverse geocoding for addresses

### Configuration
- Foreground: High accuracy, 10m distance interval, 5s time interval
- Background: Balanced accuracy, 50m distance interval, 10s time interval
- iOS: Shows background location indicator
- Android: Foreground service with notification

### Key Files
- `src/services/location/LocationService.ts` - Main location service
- `src/services/location/LocationPermissions.ts` - Permission helpers
- `src/services/location/types.ts` - Type definitions and configs

---

## 9. UI/UX Components

### Common Components
- `ErrorBoundary` - Catches React errors with fallback UI
- `SegmentedTabs` - iOS-style segmented control

### Home Screen Components
- `ActiveTripCard` - Shows active trip with map, stats, stop button
- `ClassificationModal` - Post-trip classification
- `StopTripConfirmation` - Confirmation before stopping

### Trip Components
- `TripCard` - Individual trip display with actions
- `TripsList` - FlatList with pull-to-refresh
- `TripFilters` - Filter chips for classification/purpose
- `TripSummaryHeader` - Total miles and deductions
- `TripMapPreview` - Map with route polyline
- `AddTripDrawer` - Manual trip entry form
- `EditTripDrawer` - Edit existing trip form
- `LocationSearchModal` - Google Places search

---

## 10. Theming

### Color Palette
- Primary: `#34435E` (dark navy)
- Accent: `#ABD3F8` (light blue)
- Background: `#EBF6FF` (very light blue)
- Muted: `#B4B5B8` (gray)
- Success: `#4CAF50` (green)
- Warning: `#FF9800` (orange)
- Error: `#F44336` (red)

### Key Files
- `src/theme/colors.ts`

---

## 11. Placeholder Screens

These screens exist but have minimal implementation:
- `TransactionsScreen` - Placeholder for expense/revenue tracking
- `TaxesScreen` - Placeholder for tax-related features
- `SettingsScreen` - Basic settings with sign-out

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| expo ~54.0.0 | React Native framework |
| @supabase/supabase-js | Database and auth |
| expo-location | Location tracking |
| expo-task-manager | Background tasks |
| expo-notifications | Push notifications |
| react-native-maps | Map display |
| @mapbox/polyline | Route encoding/decoding |
| geolib | Distance calculations |
| date-fns | Date formatting |
| react-native-google-places-autocomplete | Place search |
| @react-navigation/* | Navigation |

---

## What's NOT Built Yet

Per `CLAUDE.MD`, these are explicitly out of scope for MVP:
- Complex coaching/insights logic
- Multi-platform sync beyond Supabase
- Social features
- Detailed analytics dashboards
- Daily/weekly/monthly recap notifications
- Export functionality (CSV/PDF)
- Subscription/payment integration
- Vehicle management

---

## Architecture Notes

### Client-Side Responsibilities
- Trip detection heuristics
- Deduction rate selection and calculation
- Classification UI and logic
- Location tracking and distance calculation

### Server-Side Responsibilities
- Data persistence with RLS
- Deduction rates storage
- Plan enforcement (future)
- Recap rollups/caching (future)

### Key Design Decisions
1. **Deduction snapshots**: Stored per-trip for audit stability
2. **Detection logic isolated**: Easy to swap/iterate on heuristics
3. **Classification overridable**: Always allows manual override
4. **Money framing first**: Shows $ value, not just miles
5. **Gating configurable**: Uses `plan_tier` + feature flags approach
