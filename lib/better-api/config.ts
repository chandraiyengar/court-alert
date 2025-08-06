export interface VenueConfig {
  id: string;
  name: string;
  venue: string; // Better API venue slug
  activities: ActivityConfig[];
  bookingUrl: string;
  timezone: string;
}

export interface ActivityConfig {
  id: string;
  name: string;
  activity: string; // Better API activity slug
  displayName: string;
  operatingHours: {
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  };
}

export const BETTER_VENUE_CONFIGS: VenueConfig[] = [
  {
    id: "islington-tennis-centre",
    name: "Islington Tennis Centre",
    venue: "islington-tennis-centre",
    activities: [
      {
        id: "highbury-tennis",
        name: "Highbury Tennis",
        activity: "highbury-tennis",
        displayName: "Highbury Tennis (Outdoor)",
        operatingHours: {
          startTime: "07:00",
          endTime: "21:00",
        },
      },
      {
        id: "tennis-court-indoor",
        name: "Indoor Tennis",
        activity: "tennis-court-indoor",
        displayName: "Tennis Court (Indoor)",
        operatingHours: {
          startTime: "07:00",
          endTime: "23:00",
        },
      },
      {
        id: "tennis-court-outdoor",
        name: "Outdoor Tennis",
        activity: "tennis-court-outdoor",
        displayName: "Tennis Court (Outdoor)",
        operatingHours: {
          startTime: "07:00",
          endTime: "23:00",
        },
      },
      {
        id: "rosemary-gardens-tennis",
        name: "Rosemary Gardens Tennis",
        activity: "rosemary-gardens-tennis",
        displayName: "Rosemary Gardens Tennis",
        operatingHours: {
          startTime: "08:00",
          endTime: "22:00",
        },
      },
      {
        id: "tufnell-park-tennis",
        name: "Tufnell Park Tennis",
        activity: "tufnell-park-tennis",
        displayName: "Tufnell Park Tennis",
        operatingHours: {
          startTime: "08:00",
          endTime: "21:00",
        },
      },
    ],
    bookingUrl: process.env.NEXT_PUBLIC_BETTER_BOOKINGS_URL
      ? process.env.NEXT_PUBLIC_BETTER_BOOKINGS_URL + "/location"
      : (() => {
          throw new Error(
            "NEXT_PUBLIC_BETTER_BOOKINGS_URL environment variable is not set"
          );
        })(),
    timezone: "Europe/London",
  },
  {
    id: "lee-valley-hockey-and-tennis-centre",
    name: "Lee Valley Hockey and Tennis Centre",
    venue: "lee-valley-hockey-and-tennis-centre",
    activities: [
      {
        id: "tennis-court-indoor",
        name: "Indoor Tennis",
        activity: "tennis-court-indoor",
        displayName: "Tennis Court (Indoor)",
        operatingHours: {
          startTime: "07:00",
          endTime: "23:00",
        },
      },
    ],
    bookingUrl: process.env.NEXT_PUBLIC_BETTER_BOOKINGS_URL
      ? process.env.NEXT_PUBLIC_BETTER_BOOKINGS_URL + "/location"
      : (() => {
          throw new Error(
            "NEXT_PUBLIC_BETTER_BOOKINGS_URL environment variable is not set"
          );
        })(),
    timezone: "Europe/London",
  },
  {
    id: "gunnersbury-park-sports-hub",
    name: "Gunnersbury Park Sports Hub",
    venue: "gunnersbury-park-sports-hub",
    activities: [
      {
        id: "tennis-court-outdoor",
        name: "Outdoor Tennis",
        activity: "tennis-court-outdoor",
        displayName: "Tennis Court (Outdoor)",
        operatingHours: {
          startTime: "07:00",
          endTime: "22:00",
        },
      },
    ],
    bookingUrl: process.env.NEXT_PUBLIC_BETTER_BOOKINGS_URL
      ? process.env.NEXT_PUBLIC_BETTER_BOOKINGS_URL + "/location"
      : (() => {
          throw new Error(
            "NEXT_PUBLIC_BETTER_BOOKINGS_URL environment variable is not set"
          );
        })(),
    timezone: "Europe/London",
  },
  // Add more venues here as needed
];

export function getVenueConfig(venueId: string): VenueConfig | undefined {
  return BETTER_VENUE_CONFIGS.find((config) => config.id === venueId);
}

export function getActivityConfig(
  venueId: string,
  activityId: string
): ActivityConfig | undefined {
  const venue = getVenueConfig(venueId);
  return venue?.activities.find((activity) => activity.id === activityId);
}

export function getAllVenueActivities(): Array<{
  venue: VenueConfig;
  activity: ActivityConfig;
  locationId: string;
}> {
  return BETTER_VENUE_CONFIGS.flatMap((venue) =>
    venue.activities.map((activity) => ({
      venue,
      activity,
      locationId: `${venue.id}/${activity.id}`,
    }))
  );
}

export function isWithinOperatingHours(
  venueId: string,
  activityId: string,
  timeString: string
): boolean {
  const activity = getActivityConfig(venueId, activityId);
  if (!activity) return true; // If no config, assume all times are valid

  try {
    const [hours, minutes] = timeString.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return false;

    const timeMinutes = hours * 60 + minutes;

    const [startHours, startMinutes] = activity.operatingHours.startTime
      .split(":")
      .map(Number);
    if (isNaN(startHours) || isNaN(startMinutes)) return true;

    const startTimeMinutes = startHours * 60 + startMinutes;

    const [endHours, endMinutes] = activity.operatingHours.endTime
      .split(":")
      .map(Number);
    if (isNaN(endHours) || isNaN(endMinutes)) return true;

    const endTimeMinutes = endHours * 60 + endMinutes;

    return timeMinutes >= startTimeMinutes && timeMinutes <= endTimeMinutes;
  } catch {
    console.warn(
      `⚠️  Error parsing time for operating hours check: ${timeString}`
    );
    return true; // Default to allowing the time if parsing fails
  }
}
