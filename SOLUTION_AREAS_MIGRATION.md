# Solution Areas Migration Guide

## Overview
This guide documents the migration from the deprecated `department` field to the new `solutionAreas` relationship in the SlideDeck 2.0 application.

## What Changed

### Database Schema
1. **New Tables Added:**
   - `SolutionArea` - Stores available solution areas (marketing, sales, engineering, etc.)
   - `SlideSolutionArea` - Junction table for many-to-many relationship between slides and solution areas

2. **Field Status:**
   - `department` field remains in the `Slide` table but is marked as deprecated
   - New `solutionAreas` relationship allows multiple solution areas per slide

### Available Solution Areas
The following solution areas are pre-seeded in the database:
- `marketing` - Marketing
- `sales` - Sales
- `engineering` - Engineering
- `design` - Design
- `consulting` - Consulting
- `management` - Management
- `hr` - Human Resources
- `finance` - Finance

## Implementation Details

### API Endpoints Updated
1. **GET /api/slides/[id]** - Now includes `solutionAreas` in response
2. **PATCH /api/slides/[id]** - Accepts `solutionAreaCodes` array for updating
3. **POST /api/slides/[id]/generate-tags** - New endpoint for generating tags based on metadata
4. **DELETE /api/slides/[id]** - Also deletes related `SlideSolutionArea` records

### Frontend Changes
1. **SlideEditModal** - Added MultiSelect dropdown for solution areas
2. **Auto-fill Metadata** - Now considers solution areas for tag generation
3. **Tag Generation** - Creates tags like `solution-marketing`, `solution-design` etc.

## Migration Steps

### 1. Database Migration
```bash
# Set the database URL
$env:DATABASE_URL="postgresql://user:pass@host:port/db?schema=public"

# Run migrations
npx prisma migrate dev --name add_solution_areas

# Generate Prisma Client
npx prisma generate
```

### 2. Seed Solution Areas
```bash
# Run the seed script
npx tsx prisma/seed-solution-areas.ts
```

### 3. Migrate Existing Data (Optional)
If you have existing slides with `department` data:
```bash
# Run migration script
npx tsx scripts/migrate-departments-to-solution-areas.ts
```

## Usage

### Editing Slides
1. Open slide edit modal
2. Go to "Metadata" tab
3. Use "Solution Areas" multi-select dropdown
4. Select one or multiple solution areas
5. Save changes

### Auto-generated Tags
When extracting text from slides, the system will:
1. Analyze content for solution area keywords
2. Auto-select appropriate solution areas
3. Generate corresponding tags (e.g., `solution-design`)

## API Examples

### Update Slide with Solution Areas
```javascript
PATCH /api/slides/{slideId}
{
  "title": "Updated Title",
  "solutionAreaCodes": ["marketing", "design"]
}
```

### Generate Tags
```javascript
POST /api/slides/{slideId}/generate-tags
{
  "metadata": {
    "solutionAreaCodes": ["marketing", "sales"]
  },
  "extractedText": "slide content..."
}
```

## Technical Notes

### TypeScript Types
- Added `SolutionArea` and `SlideSolutionArea` interfaces in `lib/types.ts`
- Updated `Slide` interface to include `solutionAreas?: SlideSolutionArea[]`

### Prisma Schema
- Uses many-to-many relationship pattern
- Cascade delete configured for data integrity
- Unique constraints prevent duplicate assignments

### Performance Considerations
- All solution area queries are indexed
- Junction table uses composite unique index
- Eager loading configured for common queries

## Future Enhancements
1. Admin UI for managing solution areas
2. Bulk update tool for solution areas
3. Analytics dashboard by solution area
4. Solution area-based filtering in search 