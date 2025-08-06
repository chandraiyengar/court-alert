// Export all LTA API modules
export { LtaApiClient } from "./client";
export type {
  FetchBookingTimesParams,
  LtaSession,
  LtaDay,
  LtaResource,
  LtaApiResponse,
} from "./client";

// Export fetchAllBookingTimes as a standalone function for convenience
import { LtaApiClient } from "./client";
export const fetchAllBookingTimes = LtaApiClient.fetchAllSlots;

export {
  getLtaVenueConfig,
  getAllLtaVenues,
  isWithinLtaOperatingHours,
  LTA_VENUE_CONFIGS,
} from "./config";
export type { LtaVenueConfig } from "./config";

export { LtaDataTransformer } from "./transformer";
export { LtaDataValidator } from "./validator";
