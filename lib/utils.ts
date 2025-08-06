import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BETTER_VENUE_CONFIGS } from "./better-api/config";
import { LTA_VENUE_CONFIGS } from "./lta-api/config";
import { TOWER_HAMLETS_VENUE_CONFIGS } from "./tower-hamlets-api/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface BookingUrlResult {
  url: string;
  apiSource: "better" | "lta" | "tower-hamlets" | "unknown";
}

/**
 * Determines which API source a location belongs to and generates the appropriate booking URL
 */
export function generateBookingUrl(
  location: string,
  date: string,
  time: string
): BookingUrlResult {
  // Check if it's a Better API location
  const betterLocation = BETTER_VENUE_CONFIGS.find((venue) =>
    venue.activities.some(
      (activity) => `${venue.id}/${activity.id}` === location
    )
  );

  if (betterLocation) {
    const betterBaseUrl = process.env.NEXT_PUBLIC_BETTER_BOOKINGS_URL;
    if (!betterBaseUrl) {
      console.error(
        "NEXT_PUBLIC_BETTER_BOOKINGS_URL environment variable is not set"
      );
      return { url: "", apiSource: "better" };
    }

    const startTime = time.slice(0, 5); // Convert "14:00:00" to "14:00"
    const endTime = `${(parseInt(time.split(":")[0], 10) + 1).toString().padStart(2, "0")}:00`;

    const url = `${betterBaseUrl}/location/${location}/${date}/by-time/slot/${startTime}-${endTime}`;
    return { url, apiSource: "better" };
  }

  // Check if it's an LTA location
  const ltaLocation = LTA_VENUE_CONFIGS.find((venue) => venue.id === location);

  if (ltaLocation) {
    const ltaBaseUrl =
      process.env.NEXT_PUBLIC_LTA_BOOKINGS_URL ||
      "https://clubspark.lta.org.uk";

    // Format date for LTA URL (they expect YYYY-MM-DD format with # anchor)
    const url = `${ltaBaseUrl}/${ltaLocation.venue}/Booking/BookByDate#?date=${date}`;
    return { url, apiSource: "lta" };
  }

  // Check if it's a Tower Hamlets location
  const towerHamletsLocation = TOWER_HAMLETS_VENUE_CONFIGS.find(
    (venue) => venue.id === location
  );

  if (towerHamletsLocation) {
    const towerHamletsBaseUrl = process.env.TOWER_HAMLET_BOOKINGS_URL;
    if (!towerHamletsBaseUrl) {
      console.error(
        "TOWER_HAMLET_BOOKINGS_URL environment variable is not set"
      );
      return { url: "", apiSource: "tower-hamlets" };
    }

    const url = `${towerHamletsBaseUrl}/${towerHamletsLocation.venue}/${date}`;
    return { url, apiSource: "tower-hamlets" };
  }

  // For locations that don't match any API configs, return unknown
  return {
    url: "",
    apiSource: "unknown",
  };
}

/**
 * Determines the API source for a given location ID
 */
export function getApiSource(
  location: string
): "better" | "lta" | "tower-hamlets" | "unknown" {
  // Check Better API
  const betterMatch = BETTER_VENUE_CONFIGS.find((venue) =>
    venue.activities.some(
      (activity) => `${venue.id}/${activity.id}` === location
    )
  );
  if (betterMatch) return "better";

  // Check LTA API
  const ltaMatch = LTA_VENUE_CONFIGS.find((venue) => venue.id === location);
  if (ltaMatch) return "lta";

  // Check Tower Hamlets API
  const towerHamletsMatch = TOWER_HAMLETS_VENUE_CONFIGS.find(
    (venue) => venue.id === location
  );
  if (towerHamletsMatch) return "tower-hamlets";

  // Return unknown for anything else
  return "unknown";
}
