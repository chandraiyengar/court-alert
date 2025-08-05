import { createClient } from "@/utils/supabase/server";
import { SlotInfo } from "../better-api/transformer";
import { DataValidator } from "../better-api/validator";

export interface StoredSlot {
  date: string;
  time: string;
  location: string;
  spaces: number;
}

export interface NewlyAvailableSlot extends SlotInfo {
  previous_spaces: number;
  current_spaces: number;
}

export class DatabaseOperations {
  static async getPreviousState(): Promise<StoredSlot[]> {
    const supabase = await createClient();
    const { data: court_availability, error } = await supabase
      .from("court_availability")
      .select("*");

    if (error) {
      console.error("Error fetching previous state:", error);
      return [];
    }

    return court_availability || [];
  }

  static async updateState(slots: SlotInfo[]): Promise<void> {
    if (slots.length === 0) {
      console.log("⚠️  No slots to update in database");
      return;
    }

    // Validate slots before storing
    const validatedSlots = DataValidator.validateSlots(slots);

    if (validatedSlots.length === 0) {
      console.warn("⚠️  No valid slots to store after validation");
      return;
    }

    try {
      // Use upsert to update existing records or insert new ones
      console.log("🔄 Performing database upsert...");
      await this.upsertSlots(validatedSlots);

      // Log sample data for verification
      console.log(
        "📊 Sample upserted data:",
        validatedSlots.slice(0, 3).map((slot) => ({
          date: slot.date,
          time: slot.time,
          spaces: slot.spaces,
          location: slot.location,
        }))
      );
    } catch (error) {
      console.error("❌ Unexpected error updating database:", error);
      throw error;
    }
  }

  private static async upsertSlots(validatedSlots: SlotInfo[]): Promise<void> {
    const supabase = await createClient();

    const { error: upsertError } = await supabase
      .from("court_availability")
      .upsert(validatedSlots, {
        onConflict: "date,time,location",
      });

    if (upsertError) {
      console.error("❌ Error upserting slots:", upsertError);
      throw upsertError;
    }

    console.log("✅ Database updated successfully using upsert");
  }

  static compareStates(
    previousSlots: StoredSlot[],
    currentSlots: SlotInfo[]
  ): NewlyAvailableSlot[] {
    const newlyAvailable: NewlyAvailableSlot[] = [];

    // Create a map of previous slots for efficient lookup
    const previousSlotsMap = new Map<string, StoredSlot>();
    previousSlots.forEach((slot) => {
      const key = `${slot.date}-${slot.time}-${slot.location}`;
      previousSlotsMap.set(key, slot);
    });

    // Check each current slot for availability changes
    currentSlots.forEach((currentSlot) => {
      const key = `${currentSlot.date}-${currentSlot.time}-${currentSlot.location}`;
      const previousSlot = previousSlotsMap.get(key);

      // If we have previous data for this slot
      if (previousSlot) {
        // Check if availability changed from 0 to 1+ spaces
        if (previousSlot.spaces === 0 && currentSlot.spaces > 0) {
          newlyAvailable.push({
            ...currentSlot,
            previous_spaces: previousSlot.spaces,
            current_spaces: currentSlot.spaces,
          });
        }
      }
    });

    return newlyAvailable;
  }
}
