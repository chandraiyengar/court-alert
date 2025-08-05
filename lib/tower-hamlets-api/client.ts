export interface TowerHamletSession {
  startTime: string;
  spaces: number;
}

export class TowerHamletsApiClient {
  private static getBaseUrl(): string {
    const url = process.env.TOWER_HAMLET_BOOKINGS_URL;
    if (!url) {
      throw new Error("Missing TOWER_HAMLET_BOOKINGS_URL environment variable");
    }
    return url;
  }

  static async getBookingAvailability(
    date: string,
    location: string
  ): Promise<TowerHamletSession[]> {
    const url = `${this.getBaseUrl()}/${location}/${date}`;

    try {
      const response = await fetch(url, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const htmlContent = await response.text();

      console.log(`📋 Tower Hamlets API Response for ${location} on ${date}:`, {
        hasContent: !!htmlContent,
        contentLength: htmlContent.length,
      });

      return this.transformHtmlResponse(htmlContent);
    } catch (error) {
      console.error(
        `❌ Error fetching Tower Hamlets booking availability for ${location} on ${date}:`,
        error
      );
      throw error;
    }
  }

  private static transformHtmlResponse(
    htmlContent: string
  ): TowerHamletSession[] {
    const sessions: TowerHamletSession[] = [];

    try {
      const tableMatch = htmlContent.match(/<table[\s\S]*?<\/table>/i);

      if (!tableMatch) {
        console.error(
          "⚠️  No availability table found in HTML for tower hamlets"
        );
        return sessions;
      }

      const tableContent = tableMatch[0];

      // Find all table rows with time slots
      const rowMatches = tableContent.match(/<tr[\s\S]*?<\/tr>/gi);

      if (!rowMatches) {
        console.error("⚠️  No table rows found");
        return sessions;
      }

      for (const row of rowMatches) {
        // Extract time from th element
        const timeMatch = row.match(/<th[^>]*class="time"[^>]*>(.*?)<\/th>/i);
        if (!timeMatch) continue;

        const timeText = timeMatch[1].trim();
        const startTime = this.parseTimeToStandardFormat(timeText);

        if (!startTime) continue;

        // Count available courts (checkboxes that are NOT disabled)
        const courtMatches = row.match(
          /<label[^>]*class="court"[^>]*>[\s\S]*?<\/label>/gi
        );

        if (!courtMatches) continue;

        let availableSpaces = 0;

        for (const court of courtMatches) {
          // Check if the checkbox is NOT disabled (meaning it's available)
          const hasDisabled = court.includes("disabled");
          if (!hasDisabled) {
            availableSpaces++;
          }
        }

        sessions.push({
          startTime,
          spaces: availableSpaces,
        });
      }

      console.log(
        `✅ Parsed ${sessions.length} available time slots from HTML`
      );
      return sessions;
    } catch (error) {
      console.error("❌ Error parsing HTML response:", error);
      return sessions;
    }
  }

  private static parseTimeToStandardFormat(timeText: string): string | null {
    // Convert formats like "7pm", "8pm", "10am" to "19:00", "20:00", "10:00"
    const match = timeText.match(/(\d+)(am|pm)/i);
    if (!match) return null;

    const hour = parseInt(match[1]);
    const period = match[2].toLowerCase();

    let hour24 = hour;
    if (period === "pm" && hour !== 12) {
      hour24 += 12;
    } else if (period === "am" && hour === 12) {
      hour24 = 0;
    }

    return `${hour24.toString().padStart(2, "0")}:00`;
  }
}
