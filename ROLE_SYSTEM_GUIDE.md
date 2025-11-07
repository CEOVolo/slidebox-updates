# SlideBox Role System Guide

## System Overview

The role system in SlideBox implements differentiated access to application functionality with two main roles: **ADMIN** and **USER**.

### Roles and Permissions

#### ADMIN (Administrator)
Full access to all system functions:
- ✅ **Import slides** - Import new slides from Figma
- ✅ **Edit slides** - Modify titles, descriptions, categories
- ✅ **Delete slides** - Remove slides from system
- ✅ **Manage categories** - Create and modify categories
- ✅ **Create presentations** - Assemble slides into presentations
- ✅ **Favorite slides** - Add slides to favorites
- ✅ **View slides** - Basic content viewing

#### USER (User)
Limited access for content consumption:
- ❌ **Import slides** - Not available
- ❌ **Edit slides** - Not available
- ❌ **Delete slides** - Not available
- ❌ **Manage categories** - Not available
- ✅ **Create presentations** - Assemble slides into presentations
- ✅ **Favorite slides** - Add slides to favorites
- ✅ **View slides** - Basic content viewing

## Technical Implementation

### Database (Prisma Schema)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      String   // "ADMIN" or "USER" 
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  slides         Slide[]
  presentations  Presentation[]
  favoriteSlides FavoriteSlide[]
}

model FavoriteSlide {
  id     String @id @default(cuid())
  userId String
  slideId String
  user   User   @relation(fields: [userId], references: [id])
  slide  Slide  @relation(fields: [slideId], references: [id])
}
```

### Authentication Components

#### AuthService (`lib/auth.ts`)
Central authentication management service:

```typescript
class AuthService {
  // Get current user
  static getCurrentUser(): AuthUser | null
  
  // Set user
  static setCurrentUser(user: AuthUser): void
  
  // Logout
  static logout(): void
  
  // Role checks
  static hasRole(role: UserRole): boolean
  static canImportSlides(): boolean
  static canEditSlides(): boolean
  // ... other permissions
}
```

#### useAuth Hook
React Hook for use in components:

```typescript
const auth = useAuth();

// Access checks
if (auth.canEditSlides) {
  // Show edit button
}

if (auth.isAdmin) {
  // Show admin functions
}
```

### UI Components

#### Header (`components/Header.tsx`)
- Displays current user information
- Shows user role with appropriate icon
- Import button available only to administrators
- User menu with available functions

#### AuthModal (`components/AuthModal.tsx`)
- Login/registration form
- Quick demo buttons:
  - "Administrator" - login as ADMIN
  - "User" - login as USER

#### SlideCard (`components/SlideCard.tsx`)
- Edit buttons shown only if `onEditSlide` is passed
- Administrators see all management buttons
- Users see only view and add-to-presentation buttons

### Middleware and Route Protection

Planned implementation of middleware for API route protection:

```typescript
// Middleware functions
export const requireAuth = (req: Request) => { /* ... */ }
export const requireRole = (role: UserRole) => { /* ... */ }
export const requireAdmin = requireRole('ADMIN')

// Usage in API routes
export async function POST(req: Request) {
  requireAdmin(req);
  // ... admin-only logic
}
```

## Demo Accounts

### Quick Login for Demo
Quick login buttons available in `AuthModal`:

```typescript
// Admin account
{
  id: 'demo-admin',
  email: 'admin@slidebox.com',
  name: 'Administrator',
  role: 'ADMIN'
}

// User account  
{
  id: 'demo-user',
  email: 'user@slidebox.com',
  name: 'User',
  role: 'USER'
}
```

### Testing Roles

1. **Test ADMIN role:**
   - Login via "Administrator" button
   - Check for "Import" button presence in header
   - Check edit buttons on slide cards

2. **Test USER role:**
   - Login via "User" button
   - Ensure "Import" button is absent
   - Ensure edit buttons are hidden

## Security

### Current Implementation
- User data stored in `localStorage`
- Role checks performed on frontend
- **Suitable for demo only**

### Production Recommendations

1. **Server-side authentication:**
   ```bash
   npm install next-auth
   npm install @next-auth/prisma-adapter
   ```

2. **JWT tokens:**
   - Store tokens in httpOnly cookies
   - Verify token signatures on server
   - Automatic token refresh

3. **API route protection:**
   ```typescript
   // middleware.ts
   export function middleware(request: NextRequest) {
     const token = request.cookies.get('auth-token');
     if (!token) {
       return NextResponse.redirect('/login');
     }
   }
   ```

4. **Server-side validation:**
   - All data modification operations should check roles on server
   - Never trust client-side data

## System Extension

### Adding New Roles

1. **Update UserRole type:**
   ```typescript
   export type UserRole = 'ADMIN' | 'USER' | 'EDITOR' | 'VIEWER';
   ```

2. **Add new permissions:**
   ```typescript
   static canModerateContent(): boolean {
     const user = this.getCurrentUser();
     return user?.role === 'ADMIN' || user?.role === 'EDITOR';
   }
   ```

3. **Update UI components**

### Granular Permissions

For more complex scenarios, implement a permission system:

```typescript
interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}
```

## FAQ

**Q: How to check user role in a component?**
A: Use the `useAuth()` hook: `const { isAdmin, canEditSlides } = useAuth();`

**Q: Where to add a new permission?**
A: Add a new method to the `AuthService` class and update the `useAuth` hook interface.

**Q: How to protect an API route?**
A: Add role check at the beginning of handler function: `requireAdmin(req);`

**Q: How to change an existing user's role?**
A: In current demo version - modify value in localStorage. In production - through admin panel with DB update. 