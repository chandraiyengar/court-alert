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
      // Still clear the database even if no new slots, to remove past/invalid slots
      await this.clearDatabase();
      return;
    }

    // Validate slots before storing
    const validatedSlots = DataValidator.validateSlots(slots);

    if (validatedSlots.length === 0) {
      console.warn("⚠️  No valid slots to store after validation");
      // Still clear the database even if no valid slots, to remove past/invalid slots
      await this.clearDatabase();
      return;
    }

    try {
      // Always do a full overwrite to ensure past time slots are removed
      console.log("🔄 Performing full database overwrite...");
      await this.deleteAndInsert(validatedSlots);

      // Log sample data for verification
      console.log(
        "📊 Sample stored data:",
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

  private static async clearDatabase(): Promise<void> {
    const supabase = await createClient();

    const { error: deleteError } = await supabase
      .from("court_availability")
      .delete()
      .neq("id", 0);

    if (deleteError) {
      console.error("❌ Error clearing database:", deleteError);
      throw deleteError;
    }

    console.log("✅ Database cleared successfully");
  }

  private static async deleteAndInsert(
    validatedSlots: SlotInfo[]
  ): Promise<void> {
    const supabase = await createClient();

    const { error: deleteError } = await supabase
      .from("court_availability")
      .delete()
      .neq("id", 0);

    if (deleteError) {
      console.error("❌ Error clearing previous state:", deleteError);
      throw deleteError;
    }

    const { error: insertError } = await supabase
      .from("court_availability")
      .insert(validatedSlots);

    if (insertError) {
      console.error("❌ Error inserting new state:", insertError);
      throw insertError;
    }

    console.log("✅ Database updated successfully using full overwrite");
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
