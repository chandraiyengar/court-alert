# LTA API Integration

Integration with the LTA Clubspark API to fetch tennis court availability data and aggregate it by venue.

## Key Features

- **Efficient**: Fetches multiple days and courts in single API call
- **Aggregated**: Groups court availability by time slot (total available courts per venue)
- **Capacity-based**: Uses `Capacity` field to determine actual availability (1=available, 0=booked)
- **Multi-hour support**: Breaks 2+ hour sessions into individual hourly slots

## Configuration

Add venues in `config.ts`:

```typescript
{
  id: "finsbury-park",
  venue: "FinsburyPark",        // API endpoint name
  displayName: "Finsbury Park Tennis",
  operatingHours: { startTime: "07:00", endTime: "22:00" }
}
```

Set environment variable: `LTA_ADMIN_API_URL=https://clubspark.lta.org.uk/v0/VenueBooking`

## How It Works

1. **Fetches sessions** from LTA API for all courts and date range
2. **Filters by capacity**: Only sessions with `Capacity: 1` (available)
3. **Breaks multi-hour sessions**: 2-hour session → two 1-hour slots
4. **Aggregates by time**: Counts total available courts per hour
5. **Outputs standard format**: `{date, time, location, spaces}`

## Output Example

```typescript
// If 3 courts are available at 10:00 AM at Finsbury Park:
{
  date: "2025-01-13",
  time: "10:00:00",
  location: "finsbury-park",
  spaces: 3                   // total available courts
}
```

## Testing

```bash
npx tsx lib/lta-api/test.ts  # Full integration test
```
