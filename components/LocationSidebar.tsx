interface LocationSidebarProps {
  uniqueLocations: string[];
  selectedLocation: string | null;
  onLocationSelect: (location: string) => void;
  formatLocationName: (location: string) => string;
}

export default function LocationSidebar({}: LocationSidebarProps) {
  // Component retained for potential future use; not rendered anymore.
  return null;
}
