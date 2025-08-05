interface LocationSidebarProps {
  uniqueLocations: string[];
  selectedLocation: string | null;
  onLocationSelect: (location: string) => void;
  formatLocationName: (location: string) => string;
}

export default function LocationSidebar({
  uniqueLocations,
  selectedLocation,
  onLocationSelect,
  formatLocationName,
}: LocationSidebarProps) {
  return (
    <div className="w-64 flex-shrink-0">
      <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-4">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Select Location
        </h2>

        {uniqueLocations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No locations available
          </p>
        ) : (
          <div className="space-y-2">
            {uniqueLocations.map((location) => (
              <button
                key={location}
                onClick={() => onLocationSelect(location)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                  selectedLocation === location
                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {formatLocationName(location)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
