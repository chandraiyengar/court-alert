import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LocationDropdownProps {
  uniqueLocations: string[];
  selectedLocation: string | null;
  onLocationSelect: (location: string) => void;
  formatLocationName: (location: string) => string;
}

export default function LocationDropdown({
  uniqueLocations,
  selectedLocation,
  onLocationSelect,
  formatLocationName,
}: LocationDropdownProps) {
  return (
    <div className="w-full mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Location
      </label>
      <Select value={selectedLocation || ""} onValueChange={onLocationSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose a location..." />
        </SelectTrigger>
        <SelectContent>
          {uniqueLocations.map((location) => (
            <SelectItem key={location} value={location}>
              {formatLocationName(location)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
