"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SelectedSlotsSummary from "@/components/SelectedSlotsSummary";
import { type LocationTimeSlot } from "@/components/CourtAvailabilityView";
import { type TimeSlotPreference } from "@/lib/actions";

interface SelectedSlotsEmailFormProps {
  selectedSlots: LocationTimeSlot[];
  onSubmit: (
    preferences: TimeSlotPreference[]
  ) => Promise<{ success: boolean; error?: string }>;
  onRemoveSlot: (slot: LocationTimeSlot) => void;
  formatLocationName: (location: string) => string;
  formatDate: (dateString: string) => string;
  formatTime: (timeString: string) => string;
  setSubmitMessage: (message: string) => void;
}

export default function SelectedSlotsEmailForm({
  selectedSlots,
  onSubmit,
  onRemoveSlot,
  formatLocationName,
  formatDate,
  formatTime,
  setSubmitMessage,
}: SelectedSlotsEmailFormProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const preferences: TimeSlotPreference[] = selectedSlots.map((slot) => ({
        date: slot.date,
        startTime: slot.time,
        email: email.trim(),
        location: slot.location,
      }));

      const result = await onSubmit(preferences);

      if (result.success) {
        setSubmitMessage(
          "✅ Please check your email for confirmation, make sure to unmark it as spam to ensure you receive slot availability notifications."
        );
        setEmail("");
      } else {
        setSubmitMessage(
          `❌ Error: ${result.error || "Failed to save preferences"}`
        );
      }
    } catch (error) {
      setSubmitMessage(
        `❌ Error: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selectedSlots.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
      <SelectedSlotsSummary
        selectedSlots={selectedSlots}
        onRemoveSlot={onRemoveSlot}
        formatLocationName={formatLocationName}
        formatDate={formatDate}
        formatTime={formatTime}
      />

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full sm:w-56"
          disabled={isSubmitting}
        />
        <Button
          size="default"
          className="px-6 w-full sm:w-auto"
          onClick={handleSubmit}
          disabled={selectedSlots.length === 0 || !email.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Submitting...
            </>
          ) : (
            `Get Notified (${selectedSlots.length} full slots)`
          )}
        </Button>
      </div>
    </div>
  );
}
