# LTA API Integration

Integration with the LTA Clubspark API to fetch tennis court availability data and aggregate it by venue.

## Key Features

- **Efficient**: Fetches multiple days and courts in single API call
- **Aggregated**: Groups court availability by time slot (total available courts per venue)
- **Capacity-based**: Uses `Capacity` field to determine actual availability (1=available, 0=booked)
- **Venue-specific durations**: Supports both 30-minute (Burgess Park) and 60-minute (all others) sessions
- **Complete data**: Stores ALL timeslots, including fully booked ones (spaces=0)

## Configuration

Add venues in `config.ts` with their specific slot duration:

```typescript
{
  id: "burgess-park-southwark",
  venue: "BurgessParkSouthwark",
  displayName: "Burgess Park Southwark Tennis",
  operatingHours: { startTime: "07:00", endTime: "22:00" },
  slotDurationMinutes: 30  // 30-minute slots for Burgess Park
},
{
  id: "finsbury-park",
  venue: "FinsburyPark",
  displayName: "Finsbury Park Tennis",
  operatingHours: { startTime: "07:00", endTime: "22:00" },
  slotDurationMinutes: 60  // 60-minute slots for most venues
}
```

Set environment variable: `LTA_ADMIN_API_URL=https://clubspark.lta.org.uk/v0/VenueBooking`

## How It Works

1. **Fetches sessions** from LTA API for all courts and date range
2. **Processes all capacities**: Both available (`Capacity: 1`) and booked (`Capacity: 0`) sessions
3. **Breaks sessions by venue**: Uses venue-specific slot duration (30 or 60 minutes)
4. **Aggregates by time**: Counts total available courts per slot
5. **Outputs standard format**: `{date, time, location, spaces}`

## Venue-Specific Slot Durations

Different venues have different booking slot durations:

- **Burgess Park Southwark**: 30-minute slots (e.g., 08:00-08:30, 08:30-09:00)
- **All other venues**: 60-minute slots (e.g., 08:00-09:00, 09:00-10:00)

The system automatically handles this based on the `slotDurationMinutes` configuration.

## Output Examples

```typescript
// 30-minute slot at Burgess Park:
{
  date: "2025-01-13",
  time: "08:30:00",
  location: "burgess-park-southwark",
  spaces: 2
}

// 60-minute slot at Finsbury Park:
{
  date: "2025-01-13",
  time: "08:00:00",
  location: "finsbury-park",
  spaces: 1
}
```

## Testing

```bash
npx tsx lib/lta-api/test.ts                # Full integration test
npx tsx lib/lta-api/test-venue-slots.ts    # Venue-specific slot duration test
```
