"use client";

import { type LocationTimeSlot } from "@/components/CourtAvailabilityView";

interface SelectedSlotsSummaryProps {
  selectedSlots: LocationTimeSlot[];
  onRemoveSlot: (slot: LocationTimeSlot) => void;
  formatLocationName: (location: string) => string;
  formatDate: (dateString: string) => string;
  formatTime: (timeString: string) => string;
}

export default function SelectedSlotsSummary({
  selectedSlots,
  onRemoveSlot,
  formatLocationName,
  formatDate,
  formatTime,
}: SelectedSlotsSummaryProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        Selected Time Slots
      </h3>
      <div className="space-y-2 mb-4">
        {selectedSlots.map((slot) => (
          <div
            key={`${slot.location}-${slot.date}-${slot.time}`}
            className="flex items-center justify-between p-2 bg-red-50 rounded-md border border-red-200"
          >
            <div className="flex-1">
              <div className="font-medium text-sm text-red-800">
                {formatLocationName(slot.location)}
              </div>
              <div className="text-xs text-red-600">
                {formatDate(slot.date)} • {formatTime(slot.time)}
              </div>
            </div>
            <button
              onClick={() => onRemoveSlot(slot)}
              className="text-red-500 hover:text-red-700 p-1"
              title="Remove slot"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
