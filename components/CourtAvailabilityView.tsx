"use client";

import { useState, useEffect } from "react";
import TimeSlotPicker from "@/components/TimeSlotPicker";
import SelectedSlotsEmailForm from "@/components/SelectedSlotsEmailForm";
import { type TimeSlotPreference } from "@/lib/actions";

interface CourtAvailability {
  id: number;
  date: string;
  time: string;
  location: string;
  spaces: number;
}

interface CourtAvailabilityViewProps {
  courtAvailability: CourtAvailability[];
  onSubmit: (
    preferences: TimeSlotPreference[]
  ) => Promise<{ success: boolean; error?: string }>;
}

// Simplified type for location-aware slot selection
export interface LocationTimeSlot {
  location: string;
  date: string;
  time: string;
}

export default function CourtAvailabilityView({
  courtAvailability,
  onSubmit,
}: CourtAvailabilityViewProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  // Use simplified LocationTimeSlot type
  const [selectedSlots, setSelectedSlots] = useState<LocationTimeSlot[]>([]);
  // State to track submission message
  const [submitMessage, setSubmitMessage] = useState("");

  // Extract unique locations from court availability data
  const uniqueLocations = Array.from(
    new Set(courtAvailability.map((court) => court.location))
  );

  // Set default location to the first available location
  useEffect(() => {
    if (uniqueLocations.length > 0 && selectedLocation === null) {
      setSelectedLocation(uniqueLocations[0]);
    }
  }, [uniqueLocations, selectedLocation]);

  // Filter court availability by selected location
  const filteredCourtAvailability = selectedLocation
    ? courtAvailability.filter((court) => court.location === selectedLocation)
    : courtAvailability;

  // Handle slot selection with location awareness
  const handleSlotSelection = (date: string, time: string) => {
    if (!selectedLocation) return;

    const newSlot: LocationTimeSlot = {
      location: selectedLocation,
      date,
      time,
    };

    setSelectedSlots((prev) => {
      const existingIndex = prev.findIndex(
        (slot) =>
          slot.location === selectedLocation &&
          slot.date === date &&
          slot.time === time
      );

      if (existingIndex >= 0) {
        // Remove if already selected
        return prev.filter((_, index) => index !== existingIndex);
      } else {
        // Add if not selected
        return [...prev, newSlot];
      }
    });
  };

  // Format location name for display
  const formatLocationName = (location: string) => {
    return location
      .split("/")
      .map((part) =>
        part
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      )
      .join(" - ");
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T12:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const hour = parseInt(timeString.split(":")[0], 10);
    const nextHour = hour + 1;

    const displayStart =
      hour > 12 ? `${hour - 12} PM` : hour === 12 ? `12 PM` : `${hour} AM`;
    const displayEnd =
      nextHour > 12
        ? `${nextHour - 12} PM`
        : nextHour === 12
          ? `12 PM`
          : `${nextHour} AM`;

    return `${displayStart} - ${displayEnd}`;
  };

  // Handle removing a slot
  const handleRemoveSlot = (slotToRemove: LocationTimeSlot) => {
    setSelectedSlots((prev) =>
      prev.filter(
        (slot) =>
          !(
            slot.location === slotToRemove.location &&
            slot.date === slotToRemove.date &&
            slot.time === slotToRemove.time
          )
      )
    );
  };

  // Handle submission with all selected slots
  const handleSubmit = async (preferences: TimeSlotPreference[]) => {
    const result = await onSubmit(preferences);

    if (result.success) {
      setSelectedSlots([]);
    }

    return result;
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
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
                  onClick={() => setSelectedLocation(location)}
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

          {selectedLocation && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-700 font-medium">
                Currently viewing:
              </p>
              <p className="text-sm text-blue-800 mt-1">
                {formatLocationName(selectedLocation)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {selectedLocation ? (
          <div>
            <TimeSlotPicker
              courtAvailability={filteredCourtAvailability}
              selectedLocation={selectedLocation}
              selectedSlots={selectedSlots}
              onSlotSelection={handleSlotSelection}
            />

            {/* Selected Slots Summary and Email Form */}
            <SelectedSlotsEmailForm
              selectedSlots={selectedSlots}
              onSubmit={handleSubmit}
              onRemoveSlot={handleRemoveSlot}
              formatLocationName={formatLocationName}
              formatDate={formatDate}
              formatTime={formatTime}
              setSubmitMessage={setSubmitMessage}
            />
            {submitMessage && (
              <div className="mt-3">
                <p className="text-sm font-medium">{submitMessage}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">
              Please select a location to view court availability
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
