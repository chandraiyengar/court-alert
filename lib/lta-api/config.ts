export interface LtaVenueConfig {
  id: string;
  name: string;
  venue: string; // LTA API venue slug (e.g., "FinsburyPark")
  displayName: string;
  operatingHours: {
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  };
  timezone: string;
}

export const LTA_VENUE_CONFIGS: LtaVenueConfig[] = [
  {
    id: "finsbury-park",
    name: "Finsbury Park",
    venue: "FinsburyPark",
    displayName: "Finsbury Park Tennis",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
  // Add more LTA venues here as needed
];

export function getLtaVenueConfig(venueId: string): LtaVenueConfig | undefined {
  return LTA_VENUE_CONFIGS.find((config) => config.id === venueId);
}

export function getAllLtaVenues(): LtaVenueConfig[] {
  return LTA_VENUE_CONFIGS;
}

export function isWithinLtaOperatingHours(
  venueId: string,
  timeString: string
): boolean {
  const venue = getLtaVenueConfig(venueId);
  if (!venue) return true; // If no config, assume all times are valid

  try {
    const [hours, minutes] = timeString.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return false;

    const timeMinutes = hours * 60 + minutes;

    const [startHours, startMinutes] = venue.operatingHours.startTime
      .split(":")
      .map(Number);
    if (isNaN(startHours) || isNaN(startMinutes)) return true;

    const startTimeMinutes = startHours * 60 + startMinutes;

    const [endHours, endMinutes] = venue.operatingHours.endTime
      .split(":")
      .map(Number);
    if (isNaN(endHours) || isNaN(endMinutes)) return true;

    const endTimeMinutes = endHours * 60 + endMinutes;

    return timeMinutes >= startTimeMinutes && timeMinutes <= endTimeMinutes;
  } catch {
    console.warn(
      `⚠️  Error parsing time for LTA operating hours check: ${timeString}`
    );
    return true; // Default to allowing the time if parsing fails
  }
}
