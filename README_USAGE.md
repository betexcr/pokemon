# Usage Meta Module

A comprehensive competitive usage statistics system for tracking Pokémon usage across multiple platforms, generations, and formats.

## Features

- **Multi-Platform Support**: Smogon Singles, VGC Official, Battle Stadium Singles
- **Multi-Generation Coverage**: Gen 5-9 with extensible format support
- **Real-time Data**: Monthly usage statistics with trend analysis
- **Interactive UI**: 3D popup book phases with smooth transitions
- **Top 50 Focus**: Optimized for tracking the most relevant competitive Pokémon
- **Source Attribution**: Full traceability with clickable source links

## Architecture

### Data Flow

1. **ETL Pipeline**: Ingest raw usage data from various sources
2. **Normalization**: Canonicalize Pokémon names and validate data
3. **Storage**: Firestore for cloud cache + localStorage for client cache
4. **APIs**: RESTful endpoints for data queries and comparisons
5. **UI**: React components with 3D phase transitions

### Core Components

- **Types**: Comprehensive TypeScript definitions (`src/types/usage.ts`)
- **Adapters**: Platform-specific parsers (`src/lib/usage/adapters/`)
- **Firestore**: Database operations (`src/lib/usage/firestore.ts`)
- **CLI**: Ingestion tool (`src/lib/usage/ingest.ts`)
- **API Routes**: REST endpoints (`src/app/api/usage/`)
- **UI Components**: React components (`src/components/usage/`)

## Quick Start

### 1. Install Dependencies

```bash
npm install
# or
bun install
```

### 2. Set up Firebase

Ensure your Firebase project is configured with:
- Firestore enabled
- Proper security rules (see `firestore.rules`)
- Required indexes (see `firestore.indexes.json`)

### 3. Ingest Sample Data

```bash
# Dry run with sample data
npm run ingest -- --platform SMOGON_SINGLES --generation GEN9 --format OU --month 2023-03 --file sample_smogon_sv_ou_2023-03.txt --dry-run

# Actually ingest data
npm run ingest -- --platform SMOGON_SINGLES --generation GEN9 --format OU --month 2023-03 --file sample_smogon_sv_ou_2023-03.txt
```

### 4. View Usage Dashboard

Navigate to `/usage` in your app to see the interactive dashboard.

## Data Ingestion

### Supported Sources

- **Smogon Singles**: Text/CSV files from usage statistics
- **VGC Official**: JSON/CSV from Pikalytics, Victory Road
- **BSS Official**: JSON/CSV from HOME API, Pikalytics

### Command Line Interface

```bash
npm run ingest -- [options]
```

**Options:**
- `--platform`: SMOGON_SINGLES, VGC_OFFICIAL, BSS_OFFICIAL
- `--generation`: GEN5, GEN6, GEN7, GEN8, GEN9
- `--format`: OU, UU, RU, NU, UBERS, PU, MONOTYPE, VGC_REG_*, BSS_*
- `--month`: YYYY-MM format (e.g., 2023-03)
- `--source`: URL, file path, or filename in `ingest/dropbox/`
- `--dry-run`: Validate without storing data

**Examples:**

```bash
# Smogon OU data
npm run ingest -- --platform SMOGON_SINGLES --generation GEN9 --format OU --month 2023-03 --file smogon_ou_mar2023.txt

# VGC Regulation H data
npm run ingest -- --platform VGC_OFFICIAL --generation GEN9 --format VGC_REG_H --month 2024-08 --url https://example.com/vgc_data.json

# BSS Series 13 data
npm run ingest -- --platform BSS_OFFICIAL --generation GEN9 --format BSS_SERIES_13 --month 2024-07 --file bss_series13_jul2024.csv
```

### File Formats

#### Smogon Singles (Text)
```
| Rank | Pokemon            | Usage % |
|------|-------------------|---------|
| 1    | Great Tusk        | 42.9%   |
| 2    | Landorus-Therian  | 38.4%   |
```

#### CSV Format
```csv
rank,pokemon,usage,raw
1,Great Tusk,42.9,183456
2,Landorus-Therian,38.4,164789
```

#### JSON Format (VGC/BSS)
```json
[
  {
    "name": "Great Tusk",
    "usage_percent": 42.9,
    "rank": 1,
    "sample": 183456,
    "moves": [{"name": "Earthquake", "usage": 82.1}],
    "items": [{"name": "Leftovers", "usage": 38.4}]
  }
]
```

## API Endpoints

### GET /api/usage/monthly

Query monthly usage data with filters.

**Parameters:**
- `platform`: Filter by platform(s)
- `generation`: Filter by generation(s)
- `format`: Filter by format(s)
- `month`: Specific month (YYYY-MM)
- `pokemonId`: Specific Pokémon ID
- `limit`: Result limit (default: 50)
- `offset`: Pagination offset

**Example:**
```
GET /api/usage/monthly?platform=SMOGON_SINGLES&generation=GEN9&format=OU&month=2023-03
```

### GET /api/usage/compare

Compare usage trends across time periods and platforms.

**Parameters:**
- `pokemonId`: Pokémon ID (required)
- `months`: Comma-separated months
- `platforms`: Comma-separated platforms
- `formats`: Comma-separated formats

**Example:**
```
GET /api/usage/compare?pokemonId=984&months=2023-01,2023-02,2023-03&platforms=SMOGON_SINGLES,VGC_OFFICIAL
```

### GET /api/usage/summary/top

Get top N Pokémon for a specific slice.

**Parameters:**
- `platform`: Platform (required)
- `generation`: Generation (required)
- `format`: Format (required)
- `month`: Month (required)
- `limit`: Number of results (default: 50)

**Example:**
```
GET /api/usage/summary/top?platform=SMOGON_SINGLES&generation=GEN9&format=OU&month=2023-03&limit=20
```

## UI Components

### Phase System

The UI uses a 3D popup book metaphor with 5 phases:

1. **Snapshot**: Current meta overview with top performers
2. **Trends**: Usage patterns and rank changes over time
3. **Deep Dive**: Detailed move sets, items, and strategies
4. **Compare**: Cross-platform analysis and meta differences
5. **Insights**: AI-generated analysis and predictions

### Key Components

- `UsagePhaseBook`: Main orchestrator with phase navigation
- `UsageFilters`: Multi-platform filter controls
- `UsageTable`: Sortable table with source tooltips
- `UsagePodium`: Top 3 visualization
- `SourceTooltip`: Hover cards with clickable source links

## Data Model

### UsageRow

```typescript
interface UsageRow {
  pokemonId: number;             // National Dex ID
  pokemonName: string;           // Canonical name
  month: string;                 // YYYY-MM format
  platform: Platform;           // SMOGON_SINGLES, VGC_OFFICIAL, BSS_OFFICIAL
  generation: Generation;        // GEN5-GEN9
  format: Format;               // OU, UU, RU, etc.
  usagePercent: number;         // 0-100
  rank: number;                 // 1-N within slice
  sampleSize?: number;          // Battles/teams counted
  substats?: UsageSubstats;     // Moves, items, abilities, etc.
  source: UsageSource;          // Attribution info
}
```

### Firestore Schema

**Collection**: `usage_monthly`
**Document ID**: `${platform}_${generation}_${format}_${month}_${pokemonId}`

**Indexes Required:**
- `(platform, generation, format, month, rank)`
- `(platform, generation, format, month, pokemonId)`
- `(pokemonId, month)`

## Pokémon Name Canonicalization

The system handles various name formats and aliases:

- **Aliases**: `Lando-T` → `Landorus-Therian`
- **Forms**: `Urshifu-Rapid-Strike`, `Ogerpon-Wellspring`
- **Variants**: `Alolan Ninetales`, `Hisuian Zoroark`

See `src/lib/usage/canonicalize.ts` for the complete mapping.

## Top 50 Focus

The system is optimized for tracking the Top 50 most popular competitive Pokémon:

- Only Top 50 Pokémon are stored in Firestore
- Ranks are calculated against the full dataset
- Coverage reports show missing Top 50 Pokémon
- Efficient queries and reduced storage costs

## Caching Strategy

### Client-Side (localStorage)
- Key: `usage:v2:{platform}:{generation}:{format}:{month}`
- TTL: 24 hours
- Stale-while-revalidate pattern

### Server-Side (Firestore)
- Real-time updates
- Automatic deduplication via document IDs
- Background refresh for stale data

## Security

### Firestore Rules
- **Read**: Public access
- **Write**: Server-only (service account)

### Data Validation
- Schema validation on ingestion
- Type checking in TypeScript
- Input sanitization in APIs

## Testing

### Unit Tests
```bash
npm test src/lib/usage/
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## Deployment

### Prerequisites
1. Firebase project configured
2. Firestore indexes deployed
3. Security rules deployed

### Environment Variables
```env
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_ADMIN_KEY=your-service-account-key
```

### Build & Deploy
```bash
npm run build
npm run deploy
```

## Troubleshooting

### Common Issues

**1. "No adapter found for platform"**
- Ensure platform is one of: SMOGON_SINGLES, VGC_OFFICIAL, BSS_OFFICIAL
- Check adapter registration in `ingest.ts`

**2. "Invalid month format"**
- Use YYYY-MM format (e.g., 2023-03)
- Ensure month is within supported range

**3. "Pokémon not found in Top 50"**
- Check `src/data/top50.json` for supported Pokémon
- Verify name canonicalization in `canonicalize.ts`

**4. "Firestore permission denied"**
- Verify security rules are deployed
- Check service account permissions
- Ensure indexes are created

### Debug Mode

Enable detailed logging:
```bash
DEBUG=usage:* npm run ingest -- [options]
```

### Data Validation

Run validation checks:
```bash
npm run ingest -- --dry-run [options]
```

## Contributing

### Adding New Adapters

1. Create adapter class extending `AbstractAdapter`
2. Implement required methods
3. Register in `UsageIngestionCLI`
4. Add tests and documentation

### Adding New Formats

1. Update `Format` type in `types/usage.ts`
2. Add format options to `UsageFiltersComponent`
3. Update adapter support matrices
4. Add format-specific validation

### Adding New Phases

1. Create phase component in `src/components/usage/phases/`
2. Add phase config to `UsagePhaseBook`
3. Implement phase-specific data fetching
4. Add navigation and transitions

## License

This module is part of the Pokémon competitive analysis platform.
