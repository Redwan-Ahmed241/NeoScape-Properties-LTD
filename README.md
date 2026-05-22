# NeoScape Properties LTD

NeoScape Properties LTD is a React + Vite property management frontend for internal admin use. The current codebase focuses on managing properties, rooms, media, documents, rent schedules, and admin access flows. It is not a public guest-booking site in its current state.

## Current Scope

The app currently provides:

- A video-based landing page with calls to action for admin login and management access.
- Admin authentication flows for login, sign-up, forgot-password, and reset-password.
- A protected admin area with role-based access control.
- Property grouping by location, with each location treated as a villa/property bucket.
- Room CRUD for each property.
- Room detail editing with images, documents, availability toggles, and rent/payment tracking.
- A management dashboard for rent schedules, room documents, property images, and property documents.
- Backend API integration with partial graceful fallback where the UI can still load partial data.

## Main Routes

| Route | Screen | Purpose |
|---|---|---|
| `/` | `HeroPage` | Landing page with video background and admin CTAs |
| `/admin/login` | `AdminLogin` | Admin sign-in |
| `/admin/signup` | `AdminSignUp` | Admin registration |
| `/admin/forgot-password` | `ForgotPasswordPage` | Request password reset |
| `/reset-password` | `ResetPasswordPage` | Complete password reset |
| `/admin` | `VillaListPage` | Property list grouped by location |
| `/admin/villa/:villaName` | `VillaRoomsPage` | Rooms inside one property |
| `/admin/room/:roomId` | `RoomDetailPage` | Full room editor and related records |
| `/admin/profile` | `ProfilePage` | Admin profile page |
| `/admin/management` | `ManagementPage` | Rent, document, and media management |

## Functional Areas

### Landing Page

The landing page is a full-screen hero with a video background, animated headline, and CTA buttons. It gives quick entry points into the admin area rather than exposing guest-facing search or booking features.

### Authentication

The auth system is centered around `AuthContext` and `useAuth`.

- Login and logout are managed through the app auth context.
- Admin routes are protected by role checks.
- Non-admin users are blocked from the protected area.
- The login, sign-up, forgot-password, and reset-password pages are all standalone flows.

### Property Management

`VillaListPage` loads rooms, groups them by property/location, and shows summary cards for each property.

- Add a new property.
- View room counts, available rooms, and occupied rooms.
- Open a property to see its rooms.

### Room Management

`VillaRoomsPage` handles room management inside a selected property.

- Add a room to a property.
- Delete a room.
- View room price and basic details.
- Open room details for deeper editing.

### Room Detail Management

`RoomDetailPage` is the main operational screen for a single room.

- Edit room name, description, price, bedrooms, bathrooms, size, and amenities.
- Toggle availability between to-let and occupied.
- Upload and remove room images.
- Upload and delete room documents.
- Record rent payments.
- View rent schedule and document data linked to the room.

### Management Dashboard

`ManagementPage` bundles the operational tools in one place.

- Rent Scheduler
- Room Documents
- Property Images
- Property Documents
- Property filter/search for working on one location at a time

## Key Components

| Component | Purpose |
|---|---|
| `AuthenticatedLayout` | Shared shell for protected routes |
| `Navbar` | Global navigation for the protected area |
| `Logo` | Brand mark used in navigation and auth screens |
| `DocumentManager` | CRUD UI for room and property documents |
| `RentScheduler` | CRUD UI for rent schedules and payment tracking |
| `PropertyImageManager` | Property-level image management |
| `PropertyDocumentManager` | Property-level document management |
| `AuthProvider` | Wraps the app in auth context state |
| `HeroPage` | Animated landing page |

## Supporting Hooks and Modules

| File | Purpose |
|---|---|
| `src/hooks/useAuth.ts` | Re-export for auth context helpers |
| `src/context/AuthContext.tsx` | Auth state, login/logout, and role checks |
| `src/lib/api.ts` | API client for rooms, auth, documents, rent, and uploads |
| `src/lib/types.ts` | Shared TypeScript types |
| `src/lib/documentTypes.ts` | Types for documents, reminders, rent schedules, and payments |
| `src/lib/utils.ts` | Shared utility helpers such as formatting and class merging |

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui and Radix UI primitives
- Lucide React icons
- React Router DOM
- React Hook Form
- Recharts
- Netlify deployment

## Project Structure

```text
src/
  App.tsx                 # Router and protected route setup
  main.tsx                # App bootstrap
  components/
    AuthProvider.tsx
    AuthenticatedLayout.tsx
    DocumentManager.tsx
    Logo.tsx
    Navbar.tsx
    PropertyDocumentManager.tsx
    PropertyImageManager.tsx
    RentScheduler.tsx
   
    ui/
  context/
    AuthContext.tsx
  hooks/
    useAuth.ts
    
  lib/
    api.ts
    documentTypes.ts
    types.ts
    utils.ts
  pages/
    AdminLogin.tsx
    AdminSignUp.tsx
    ForgotPasswordPage.tsx
    HeroPage.tsx
    ManagementPage.tsx
    ProfilePage.tsx
    ResetPasswordPage.tsx
    RoomDetailPage.tsx
    VillaListPage.tsx
    VillaRoomsPage.tsx
```

## Setup

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
pnpm preview
```


## License

Proprietary. All rights reserved.
