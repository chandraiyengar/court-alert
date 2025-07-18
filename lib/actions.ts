"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface TimeSlotPreference {
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  email: string;
  location: string;
}

export async function submitTimePreferences(
  preferences: TimeSlotPreference[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Transform the preferences to match the database schema
    const dbPreferences = preferences.map((pref) => ({
      date: pref.date,
      time: pref.startTime,
      email: pref.email,
      location: pref.location,
    }));

    const { error: deleteError } = await supabase
      .from("preferences")
      .delete()
      .eq("email", preferences[0].email);

    if (deleteError) {
      console.error("Error deleting existing preferences:", deleteError);
      return { success: false, error: deleteError.message };
    }

    const { error } = await supabase.from("preferences").insert(dbPreferences);

    if (error) {
      console.error("Error inserting preferences:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/pick-times");

    try {
      await sendConfirmationEmail(preferences);
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the entire operation if email sending fails
      // The preferences were still saved successfully
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

async function sendConfirmationEmail(preferences: TimeSlotPreference[]) {
  const userEmail = preferences[0].email;
  const location = preferences[0].location;
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

  const formattedPreferences = preferences
    .map((pref) => {
      const date = new Date(pref.date).toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      return `• ${formatLocationName(pref.location)}: ${date} at ${pref.startTime}`;
    })
    .join("\n");

  const emailContent = `
    <h2>Tennis Booking Preferences Confirmed</h2>
    <p>Hi there!</p>
    <p>We've received your tennis court booking preferences. Here are the times you selected:</p>
    <div style="background-color: #f8f9fa; padding: 16px; border-left: 4px solid #007bff; margin: 16px 0;">
      <strong>Your Selected Time Preferences:</strong><br/>
      ${formattedPreferences.replace(/\n/g, "<br/>")}
    </div>
    <p><strong>Location:</strong> ${formatLocationName(location)}</p>
    <p>You'll receive an email if any of these slots become available.</p>
  `;

  await resend.emails.send({
    from: "no-reply@mail.chandraiyengar.xyz",
    to: userEmail,
    subject: "Tennis Booking Preferences Confirmed",
    html: emailContent,
  });
}
