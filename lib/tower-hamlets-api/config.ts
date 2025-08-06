export interface TowerHamletsVenueConfig {
  id: string;
  name: string;
  venue: string; // URL slug for the venue
  displayName: string;
  operatingHours: {
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  };
  timezone: string;
}

export const TOWER_HAMLETS_VENUE_CONFIGS: TowerHamletsVenueConfig[] = [
  {
    id: "bethnal-green-gardens",
    name: "Bethnal Green Gardens",
    venue: "bethnal-green-gardens",
    displayName: "Bethnal Green Gardens Tennis",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
  {
    id: "king-edward-memorial-park",
    name: "King Edward Memorial Park",
    venue: "king-edward-memorial-park",
    displayName: "King Edward Memorial Park Tennis",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
  {
    id: "poplar-rec-ground",
    name: "Poplar Rec Ground",
    venue: "poplar-rec-ground",
    displayName: "Poplar Recreation Ground Tennis",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
  {
    id: "ropemakers-field",
    name: "Ropemakers Field",
    venue: "ropemakers-field",
    displayName: "Ropemakers Field Tennis",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
  {
    id: "st-johns-park",
    name: "St Johns Park",
    venue: "st-johns-park",
    displayName: "St Johns Park Tennis",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
  {
    id: "victoria-park",
    name: "Victoria Park",
    venue: "victoria-park",
    displayName: "Victoria Park Tennis",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
  {
    id: "wapping-gardens",
    name: "Wapping Gardens",
    venue: "wapping-gardens",
    displayName: "Wapping Gardens Tennis",
    operatingHours: {
      startTime: "07:00",
      endTime: "22:00",
    },
    timezone: "Europe/London",
  },
];

export function getTowerHamletsVenueConfig(
  venueId: string
): TowerHamletsVenueConfig | undefined {
  return TOWER_HAMLETS_VENUE_CONFIGS.find((config) => config.id === venueId);
}
