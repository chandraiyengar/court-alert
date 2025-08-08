import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { NewlyAvailableSlot } from "../database/operations";
import { generateBookingUrl } from "../utils";

export interface UserPreference {
  id: number;
  email: string;
  date: string;
  time: string; // HH:MM:SS format to match slots
  location: string;
  created_at: string;
}

export interface UserNotification {
  email: string;
  slots: NewlyAvailableSlot[];
}

export class NotificationService {
  private static resend = new Resend(process.env.RESEND_API_KEY);

  static async getUserPreferences(): Promise<UserPreference[]> {
    const supabase = await createClient();
    const { data: preferences, error } = await supabase
      .from("preferences")
      .select("*");

    if (error) {
      console.error("Error fetching user preferences:", error);
      return [];
    }

    return preferences || [];
  }

  static findPreferenceMatches(
    newlyAvailable: NewlyAvailableSlot[],
    preferences: UserPreference[]
  ): UserNotification[] {
    const userMatches = new Map<string, NewlyAvailableSlot[]>();

    newlyAvailable.forEach((slot) => {
      // Find users who have preferences matching this slot
      const matchingUsers = preferences.filter((pref) => {
        // Convert preference time from HH:MM to HH:MM:SS for comparison
        const prefTime =
          pref.time.includes(":") && pref.time.split(":").length === 2
            ? `${pref.time}:00`
            : pref.time;

        return (
          pref.date === slot.date &&
          prefTime === slot.time &&
          pref.location === slot.location
        );
      });

      // Group slots by user email
      matchingUsers.forEach((user) => {
        if (!userMatches.has(user.email)) {
          userMatches.set(user.email, []);
        }
        userMatches.get(user.email)!.push(slot);
      });
    });

    return Array.from(userMatches.entries()).map(([email, slots]) => ({
      email,
      slots,
    }));
  }

  static async sendNotificationEmails(
    userNotifications: UserNotification[]
  ): Promise<void> {
    for (const notification of userNotifications) {
      const { email, slots } = notification;

      // Sort slots by date and time for better presentation
      const sortedSlots = slots.sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        return a.time.localeCompare(b.time);
      });

      const isMultipleSlots = slots.length > 1;
      const subject = isMultipleSlots
        ? `${slots.length} Tennis Courts Now Available`
        : `Tennis Court Available - ${new Date(
            slots[0].date
          ).toLocaleDateString("en-GB", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })} at ${slots[0].time.substring(0, 5)}`;

      const emailContent = this.generateEmailContent(
        sortedSlots,
        isMultipleSlots
      );

      try {
        await this.resend.emails.send({
          from: "no-reply@mail.chandraiyengar.xyz",
          to: email,
          subject: subject,
          html: emailContent,
        });

        console.log(
          `📧 Notification sent to ${email} for ${slots.length} court${
            slots.length > 1 ? "s" : ""
          }`
        );
      } catch (error) {
        console.error(`❌ Failed to send email to ${email}:`, error);
      }
    }
  }

  private static generateEmailContent(
    slots: NewlyAvailableSlot[],
    isMultipleSlots: boolean
  ): string {
    const slotsHtml = slots
      .map((slot) => {
        const date = new Date(slot.date).toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const time = slot.time.substring(0, 5);

        const booking = generateBookingUrl(slot.location, slot.date, slot.time);
        const providerLabel =
          booking.apiSource === "better"
            ? "Better"
            : booking.apiSource === "lta"
              ? "LTA ClubSpark"
              : booking.apiSource === "tower-hamlets"
                ? "Tower Hamlets"
                : "Booking";

        return `
        <div style="background-color: #f9f9f9; padding: 12px; margin: 8px 0; border-left: 4px solid #0066cc;">
          <p style="margin: 4px 0;"><strong>📅 ${date}</strong></p>
          <p style="margin: 4px 0;"><strong>🕐 ${time}</strong></p>
          <p style="margin: 4px 0;"><strong>📍 ${this.formatLocationName(slot.location)}</strong></p>
          <p style="margin: 4px 0;"><strong>🎾 ${slot.current_spaces} space${
            slot.current_spaces > 1 ? "s" : ""
          } available</strong></p>
          <p style="margin: 8px 0 4px 0;">
            ${
              booking.url
                ? `<a href="${booking.url}" style="background-color: #0066cc; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block;">Book on ${providerLabel}</a>`
                : `<span style="color: #666;">Booking link unavailable for this provider</span>`
            }
          </p>
        </div>
      `;
      })
      .join("");

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🎾 Tennis Court${isMultipleSlots ? "s" : ""} Available</h2>
        <p>${
          isMultipleSlots
            ? `Great news! ${slots.length} tennis court slots you requested are now available:`
            : "A tennis court slot you requested is now available:"
        }</p>
        
        ${slotsHtml}
        
        <div style="margin-top: 24px; padding: 16px; background-color: #e8f4f8; border-radius: 4px;">
          <p style="margin: 0; color: #0066cc; font-weight: bold;">💡 Pro Tip:</p>
          <p style="margin: 8px 0 0 0; color: #666;">
            These courts can book up quickly! Use the booking button above to secure your slot.
          </p>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px;">
          You're receiving this because you signed up for notifications for ${
            isMultipleSlots ? "these time slots" : "this time slot"
          }.
        </p>
      </div>
    `;
  }

  private static formatLocationName(location: string): string {
    return location
      .split("/")
      .map((part) =>
        part
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      )
      .join(" / ");
  }

  static formatNotificationSummary(
    userNotifications: UserNotification[]
  ): string {
    if (userNotifications.length === 0) {
      return "No notifications sent - no matching preferences found.";
    }

    const totalSlots = userNotifications.reduce(
      (sum, notification) => sum + notification.slots.length,
      0
    );

    let summary = `\n🎉 NOTIFICATIONS SENT (${userNotifications.length} user${
      userNotifications.length > 1 ? "s" : ""
    }, ${totalSlots} slot${totalSlots > 1 ? "s" : ""}):\n`;
    summary += "=".repeat(60) + "\n";

    userNotifications.forEach((notification, index) => {
      const { email, slots } = notification;

      summary += `${index + 1}. 📧 ${email} (${slots.length} court${
        slots.length > 1 ? "s" : ""
      })\n`;

      slots.forEach((slot) => {
        const date = new Date(slot.date).toLocaleDateString("en-GB", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        const time = slot.time.substring(0, 5);
        summary += `   🎾 ${date} at ${time} (${slot.current_spaces} spaces)\n`;
      });
    });

    summary += "=".repeat(60);
    return summary;
  }
}
