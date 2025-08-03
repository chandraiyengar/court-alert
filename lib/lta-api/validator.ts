import { SlotInfo } from "../better-api/transformer";

export class LtaDataValidator {
  static validateSlots(slots: SlotInfo[]): SlotInfo[] {
    const validSlots = slots.filter((slot, index) =>
      this.isValidSlot(slot, index)
    );

    if (validSlots.length !== slots.length) {
      console.warn(
        `⚠️  Filtered out ${slots.length - validSlots.length} invalid LTA slots during validation`
      );
    }

    // Remove duplicates based on date, time, and location
    const uniqueSlots = this.removeDuplicates(validSlots);

    if (uniqueSlots.length !== validSlots.length) {
      console.warn(
        `⚠️  Removed ${validSlots.length - uniqueSlots.length} duplicate LTA slots`
      );
    }

    return uniqueSlots;
  }

  private static isValidSlot(slot: SlotInfo, index: number): boolean {
    // Check date format (should be YYYY-MM-DD)
    if (!this.isValidDateFormat(slot.date)) {
      console.warn(
        `⚠️  Invalid LTA date format at index ${index}: ${slot.date}`
      );
      return false;
    }

    // Check time format (should be HH:MM:SS)
    if (!this.isValidTimeFormat(slot.time)) {
      console.warn(
        `⚠️  Invalid LTA time format at index ${index}: ${slot.time}`
      );
      return false;
    }

    // Check spaces is a valid number
    if (!this.isValidSpaces(slot.spaces)) {
      console.warn(
        `⚠️  Invalid LTA spaces value at index ${index}: ${slot.spaces}`
      );
      return false;
    }

    // Check location is not empty
    if (!this.isValidLocation(slot.location)) {
      console.warn(`⚠️  Empty LTA location at index ${index}`);
      return false;
    }

    // Check that date is not in the past (more than 1 day ago)
    if (!this.isValidDate(slot.date)) {
      console.warn(`⚠️  LTA date in the past at index ${index}: ${slot.date}`);
      return false;
    }

    // Check that time values are within valid ranges
    if (!this.isValidTimeValues(slot.time)) {
      console.warn(
        `⚠️  Invalid LTA time values at index ${index}: ${slot.time}`
      );
      return false;
    }

    return true;
  }

  private static isValidDateFormat(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(date);
  }

  private static isValidTimeFormat(time: string): boolean {
    const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
    return timeRegex.test(time);
  }

  private static isValidSpaces(spaces: number): boolean {
    return (
      typeof spaces === "number" && spaces >= 0 && Number.isInteger(spaces)
    );
  }

  private static isValidLocation(location: string): boolean {
    return Boolean(location && location.trim() !== "");
  }

  private static isValidDate(dateString: string): boolean {
    const slotDate = new Date(dateString);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return slotDate >= yesterday;
  }

  private static isValidTimeValues(time: string): boolean {
    const [hours, minutes, seconds] = time.split(":").map(Number);
    return (
      hours >= 0 &&
      hours <= 23 &&
      minutes >= 0 &&
      minutes <= 59 &&
      seconds >= 0 &&
      seconds <= 59
    );
  }

  private static removeDuplicates(slots: SlotInfo[]): SlotInfo[] {
    return slots.filter((slot, index, self) => {
      const key = `${slot.date}-${slot.time}-${slot.location}`;
      return (
        index ===
        self.findIndex((s) => `${s.date}-${s.time}-${s.location}` === key)
      );
    });
  }
}
