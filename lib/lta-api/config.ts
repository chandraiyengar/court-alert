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
  {
    id: "hackney-downs",
    name: "Hackney Downs",
    venue: "HackneyDowns",
    displayName: "Hackney Downs Park Tennis",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
  {
    id: "brockwell-park",
    name: "Brockwell Park",
    venue: "brockwellpark",
    displayName: "Brockwell Park Tennis",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
  {
    id: "burgess-park-southwark",
    name: "Burgess Park Southwark",
    venue: "BurgessParkSouthwark",
    displayName: "Burgess Park Southwark Tennis",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
  {
    id: "clapham-common",
    name: "Clapham Common",
    venue: "claphamcommon",
    displayName: "Clapham Common Tennis",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
  {
    id: "clissold-park-hackney",
    name: "Clissold Park Hackney",
    venue: "ClissoldParkHackney",
    displayName: "Clissold Park Hackney Tennis",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
  {
    id: "dulwich-park",
    name: "Dulwich Park",
    venue: "DulwichPark",
    displayName: "Dulwich Park Tennis",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
  {
    id: "holland-park",
    name: "Holland Park",
    venue: "HollandPark2",
    displayName: "Holland Park Tennis",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
  {
    id: "kennington-park",
    name: "Kennington Park",
    venue: "kenningtonpark",
    displayName: "Kennington Park Tennis",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
  {
    id: "larkhall-park",
    name: "Larkhall Park",
    venue: "LarkhallPark",
    displayName: "Larkhall Park Tennis",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
  {
    id: "parliament-hill-fields",
    name: "Parliament Hill Fields",
    venue: "ParliamentHillFieldsTennisCourts",
    displayName: "Parliament Hill Fields Tennis Courts",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
  {
    id: "ravenscourt-park",
    name: "Ravenscourt Park",
    venue: "RavenscourtPark",
    displayName: "Ravenscourt Park Tennis",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
  {
    id: "spring-hill-park",
    name: "Spring Hill Park",
    venue: "SpringHillParkTennis",
    displayName: "Spring Hill Park Tennis",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
  {
    id: "tanner-street-park",
    name: "Tanner Street Park",
    venue: "TannerStPark",
    displayName: "Tanner Street Park Tennis",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
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
