# Metadata Architecture

## Core Principle
All metadata must be stored in the database and be editable through the admin interface. Changes must reflect immediately across the entire application.

## Current Issues
1. Mixed storage: some in DB, some as enums, some hardcoded
2. No cache invalidation when metadata changes
3. Components don't always fetch fresh data
4. Inconsistent data models

## Proposed Architecture

### 1. Convert ALL Metadata to Database Models

```prisma
// Status - convert from enum to model
model Status {
  id    String   @id @default(cuid())
  code  String   @unique
  name  String
  order Int      @default(0)
  slides Slide[]
}

// Format - convert from enum to model  
model Format {
  id    String   @id @default(cuid())
  code  String   @unique
  name  String
  slides Slide[]
}

// Language - convert from enum to model
model Language {
  id    String   @id @default(cuid())
  code  String   @unique
  name  String
  slides Slide[]
}

// Region - convert from enum to model
model Region {
  id    String   @id @default(cuid())
  code  String   @unique
  name  String
  slides Slide[]
}

// Category - new model for categories
model Category {
  id          String     @id @default(cuid())
  code        String     @unique
  name        String
  icon        String?
  parentId    String?
  parent      Category?  @relation("CategoryToCategory", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryToCategory")
  order       Int        @default(0)
  slides      Slide[]
}
```

### 2. Metadata Service Layer

Create a central service that:
- Caches metadata in memory with TTL
- Invalidates cache on any update
- Provides consistent API for all components

```typescript
// lib/metadata-service.ts
class MetadataService {
  private cache = new Map();
  private ttl = 60000; // 1 minute

  async getStatuses() {
    return this.getCached('statuses', () => prisma.status.findMany());
  }

  async getFormats() {
    return this.getCached('formats', () => prisma.format.findMany());
  }

  // ... other metadata getters

  invalidate(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}
```

### 3. Real-time Updates

Use React Context + WebSockets/SSE for real-time metadata updates:

```typescript
// contexts/MetadataContext.tsx
export const MetadataProvider = ({ children }) => {
  const [metadata, setMetadata] = useState({});

  useEffect(() => {
    // Listen for metadata updates
    const eventSource = new EventSource('/api/metadata/stream');
    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setMetadata(prev => ({ ...prev, ...update }));
    };
  }, []);

  return (
    <MetadataContext.Provider value={metadata}>
      {children}
    </MetadataContext.Provider>
  );
};
```

### 4. Migration Strategy

1. **Phase 1**: Add new models alongside existing enums
2. **Phase 2**: Migrate data from enums to models
3. **Phase 3**: Update all components to use models
4. **Phase 4**: Remove enum definitions

### 5. API Structure

All metadata CRUD operations follow same pattern:

```
GET    /api/metadata/{type}        - List all
POST   /api/metadata/{type}        - Create new
PUT    /api/metadata/{type}/{id}   - Update
DELETE /api/metadata/{type}/{id}   - Delete
```

Where {type} is: statuses, formats, languages, regions, categories, domains, solution-areas, tags

### 6. Component Integration

All components that use metadata must:
1. Use the MetadataContext or fetch fresh data
2. Never hardcode metadata values
3. Handle loading states while metadata loads

Example:
```typescript
function SlideEditModal() {
  const { statuses, formats, languages } = useMetadata();
  
  // No hardcoded values!
  return (
    <select>
      {statuses.map(status => (
        <option key={status.id} value={status.code}>
          {status.name}
        </option>
      ))}
    </select>
  );
}
```

## Benefits

1. **Consistency**: One source of truth for all metadata
2. **Flexibility**: Admin can modify any metadata without code changes
3. **Real-time**: Changes reflect immediately everywhere
4. **Scalability**: Easy to add new metadata types
5. **Maintainability**: Centralized management

## Implementation Steps

1. Create database models for all metadata types
2. Build metadata service with caching
3. Create unified API endpoints
4. Add real-time update mechanism
5. Update all components to use central metadata
6. Create comprehensive admin UI in settings
7. Migrate existing data
8. Remove hardcoded values and enums 