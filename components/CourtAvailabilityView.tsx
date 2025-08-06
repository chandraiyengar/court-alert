"use client";

import { useState, useEffect } from "react";
import TimeSlotPicker from "@/components/TimeSlotPicker";
import SelectedSlotsEmailForm from "@/components/SelectedSlotsEmailForm";
import LocationSidebar from "@/components/LocationSidebar";
import LocationDropdown from "@/components/LocationDropdown";
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

  // Get slot duration for a venue (30 min for specific venues, 60 min for others)
  const getSlotDuration = (location: string) => {
    const thirtyMinuteVenues = ["burgess-park-southwark", "tanner-street-park"];
    return thirtyMinuteVenues.includes(location) ? 30 : 60;
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hourStr, minuteStr] = timeString.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    // Get venue-specific slot duration
    const slotDuration = selectedLocation
      ? getSlotDuration(selectedLocation)
      : 60;

    // Calculate end time based on venue's slot duration
    const startTotalMinutes = hour * 60 + minute;
    const endTotalMinutes = startTotalMinutes + slotDuration;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMinute = endTotalMinutes % 60;

    // Format start time
    const startDisplayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const startAmPm = hour >= 12 ? "PM" : "AM";
    const startMinuteDisplay =
      minute === 0 ? "" : `:${minute.toString().padStart(2, "0")}`;

    // Format end time
    const endDisplayHour =
      endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour;
    const endAmPm = endHour >= 12 ? "PM" : "AM";
    const endMinuteDisplay =
      endMinute === 0 ? "" : `:${endMinute.toString().padStart(2, "0")}`;

    return `${startDisplayHour}${startMinuteDisplay} ${startAmPm} - ${endDisplayHour}${endMinuteDisplay} ${endAmPm}`;
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
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <LocationSidebar
          uniqueLocations={uniqueLocations}
          selectedLocation={selectedLocation}
          onLocationSelect={setSelectedLocation}
          formatLocationName={formatLocationName}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Mobile Dropdown - hidden on desktop */}
        <div className="block lg:hidden">
          <LocationDropdown
            uniqueLocations={uniqueLocations}
            selectedLocation={selectedLocation}
            onLocationSelect={setSelectedLocation}
            formatLocationName={formatLocationName}
          />
        </div>

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
