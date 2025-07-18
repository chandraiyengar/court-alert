export interface TimeSlot {
  starts_at: {
    format_12_hour: string;
    format_24_hour: string;
  };
  ends_at: {
    format_12_hour: string;
    format_24_hour: string;
  };
  duration: string;
  price: {
    is_estimated: boolean;
    formatted_amount: string;
  };
  composite_key: string;
  timestamp: number;
  booking: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  action_to_show: {
    status: string;
    reason: string | null;
  };
  category_slug: string;
  date: string;
  venue_slug: string;
  location: string;
  spaces: number;
  name: string;
  allows_anonymous_bookings: boolean;
}

export interface BookingTimesResponse {
  data: TimeSlot[];
}

export interface GetBookingTimesParams {
  venue?: string;
  activity?: string;
  date?: string;
}

// Re-export types from other modules for convenience
export type { SlotInfo } from "./better-api/transformer";
export type { StoredSlot, NewlyAvailableSlot } from "./database/operations";
export type { UserPreference, UserNotification } from "./notifications/service";
export type { VenueConfig, ActivityConfig } from "./better-api/config";
export type {
  BookingServiceOptions,
  BookingServiceResult,
} from "./booking-service";
