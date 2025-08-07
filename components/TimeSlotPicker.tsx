"use client";

import { type LocationTimeSlot } from "@/components/CourtAvailabilityView";
import { CourtAvailability } from "@/lib/booking-types";
import { generateBookingUrl } from "@/lib/utils";

interface TimeSlotPickerProps {
  courtAvailability: CourtAvailability[];
  selectedLocation: string;
  selectedSlots: LocationTimeSlot[];
  onSlotSelection: (date: string, time: string) => void;
}

export default function TimeSlotPicker({
  courtAvailability,
  selectedLocation,
  selectedSlots,
  onSlotSelection,
}: TimeSlotPickerProps) {
  // Get today's date string
  const today = new Date().toISOString().split("T")[0];

  // Filter court availability to only show today onwards
  const filteredByDate = courtAvailability.filter(
    (court) => court.date >= today
  );

  // Get unique dates from today onwards, sorted
  const uniqueDates = Array.from(
    new Set(filteredByDate.map((court) => court.date))
  ).sort();

  // Get unique time slots, sorted
  const uniqueTimeSlots = Array.from(
    new Set(filteredByDate.map((court) => court.time))
  ).sort();

  // Check if a slot is selected
  const isSlotSelected = (date: string, time: string) => {
    return selectedSlots.some(
      (slot) =>
        slot.location === selectedLocation &&
        slot.date === date &&
        slot.time === time
    );
  };

  // Get availability for a specific date and time
  const getAvailabilityForSlot = (date: string, time: string) => {
    const availability = courtAvailability.find(
      (slot) => slot.date === date && slot.time === time
    );
    return availability ? availability.spaces : 0;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T12:00:00"); // Add time to avoid timezone issues
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Format day of week for display
  const formatDayOfWeek = (dateString: string) => {
    const date = new Date(dateString + "T12:00:00"); // Add time to avoid timezone issues
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hourStr, minuteStr] = timeString.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    // Format hour for 12-hour display
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const amPm = hour >= 12 ? "PM" : "AM";

    // Include minutes if not :00
    const minuteDisplay =
      minute === 0 ? "" : `:${minute.toString().padStart(2, "0")}`;

    return `${displayHour}${minuteDisplay} ${amPm}`;
  };

  // Handle slot selection/deselection
  const handleSlotClick = (date: string, time: string) => {
    const availability = getAvailabilityForSlot(date, time);

    // If slot has availability, redirect to booking page
    if (availability > 0) {
      const bookingResult = generateBookingUrl(selectedLocation, date, time);

      if (bookingResult.url) {
        // Open booking page in new tab
        window.open(bookingResult.url, "_blank");
        return;
      } else {
        // Handle case where no booking URL is available (e.g., Tower Hamlets)
        console.warn(
          `No booking URL available for ${selectedLocation} (${bookingResult.apiSource} API)`
        );
        // For now, we'll still allow selection for notification purposes
      }
    }

    // Only allow selection if no courts are available (full slots) or no booking URL is available
    onSlotSelection(date, time);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <table className="w-full table-fixed">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="p-3 font-semibold text-center border-r text-sm w-20">
              Time
            </th>
            {uniqueDates.map((date) => (
              <th
                key={date}
                className="p-3 text-center border-r last:border-r-0"
              >
                <div className="font-semibold text-sm">
                  {formatDayOfWeek(date)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(date)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {uniqueTimeSlots.map((timeSlot) => (
            <tr key={timeSlot} className="border-b last:border-b-0">
              {/* Time column */}
              <td className="p-1 font-medium text-center border-r bg-gray-50/50">
                <div className="text-xs">{formatTime(timeSlot)}</div>
              </td>

              {/* Date columns */}
              {uniqueDates.map((date) => {
                const isSelected = isSlotSelected(date, timeSlot);
                const availability = getAvailabilityForSlot(date, timeSlot);
                const isFull = availability === 0;

                return (
                  <td
                    key={date}
                    className={`p-2 border-r last:border-r-0 cursor-pointer transition-all min-h-[65px] ${
                      isFull ? "hover:bg-red-100" : "hover:bg-green-200"
                    } ${
                      isSelected
                        ? "bg-red-300 border-red-400 shadow-md"
                        : isFull
                          ? "bg-red-50 hover:bg-red-100"
                          : "bg-green-100 hover:bg-green-200"
                    }`}
                    onClick={() => handleSlotClick(date, timeSlot)}
                  >
                    <div className="flex items-center justify-center h-full min-h-[49px]">
                      {isSelected && isFull ? (
                        <div className="flex items-center justify-center">
                          <span className="text-xl font-bold text-red-700">
                            -
                          </span>
                        </div>
                      ) : isFull ? (
                        <div className="flex items-center justify-center">
                          <span className="text-xl font-bold text-red-400">
                            -
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="text-xl font-bold text-green-700 mb-0.5">
                            {availability}
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            {availability === 1 ? "court" : "courts"}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
