"use client";

import { type LocationTimeSlot } from "@/components/CourtAvailabilityView";

interface CourtAvailability {
  id: number;
  date: string;
  time: string;
  location: string;
  spaces: number;
}

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

  // Handle slot selection/deselection
  const handleSlotClick = (date: string, time: string) => {
    const availability = getAvailabilityForSlot(date, time);

    // If slot has availability, redirect to booking page
    if (availability > 0) {
      const startTime = time.slice(0, 5); // Convert "14:00:00" to "14:00"
      const endTime = `${(parseInt(time.split(":")[0], 10) + 1).toString().padStart(2, "0")}:00`;

      const bookingUrl = `${process.env.NEXT_PUBLIC_BETTER_BOOKINGS_URL}/location/${selectedLocation}/${date}/by-time/slot/${startTime}-${endTime}`;

      // Open booking page in new tab
      window.open(bookingUrl, "_blank");
      return;
    }

    // Only allow selection if no courts are available (full slots)
    onSlotSelection(date, time);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header with dates */}
      <div
        className="grid bg-gray-50 border-b"
        style={{
          gridTemplateColumns: `repeat(${uniqueDates.length + 1}, 1fr)`,
        }}
      >
        <div className="p-3 font-semibold text-center border-r text-sm">
          Time
        </div>
        {uniqueDates.map((date) => (
          <div key={date} className="p-3 text-center border-r last:border-r-0">
            <div className="font-semibold text-sm">{formatDayOfWeek(date)}</div>
            <div className="text-xs text-muted-foreground">
              {formatDate(date)}
            </div>
          </div>
        ))}
      </div>

      {/* Time slots grid */}
      {uniqueTimeSlots.map((timeSlot) => (
        <div
          key={timeSlot}
          className="grid border-b last:border-b-0"
          style={{
            gridTemplateColumns: `repeat(${uniqueDates.length + 1}, 1fr)`,
          }}
        >
          {/* Time column */}
          <div className="p-3 font-medium text-center border-r bg-gray-50/50 flex items-center justify-center">
            <div className="text-xs">{formatTime(timeSlot)}</div>
          </div>

          {/* Date columns */}
          {uniqueDates.map((date) => {
            const isSelected = isSlotSelected(date, timeSlot);
            const availability = getAvailabilityForSlot(date, timeSlot);
            const isFull = availability === 0;

            return (
              <div
                key={date}
                className={`p-2 border-r last:border-r-0 cursor-pointer transition-all min-h-[65px] flex items-center justify-center ${
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
                {isSelected && isFull ? (
                  <div className="flex items-center justify-center">
                    <span className="text-xl font-bold text-red-700">-</span>
                  </div>
                ) : isFull ? (
                  <div className="flex items-center justify-center">
                    <span className="text-xl font-bold text-red-400">-</span>
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
            );
          })}
        </div>
      ))}
    </div>
  );
}
