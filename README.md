# NeoScape Properties Ltd -- Property Management Platform

VillaEase is a full-featured room and villa booking platform built for property managers and guests. It provides a public-facing booking experience modeled after modern hospitality platforms, paired with a comprehensive administrative back office for property operations, document management, and rent collection.

The system is designed as a single-page application backed by a RESTful API, with graceful offline fallback to mock data when the backend is unreachable.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
  - [Guest-Facing](#guest-facing)
  - [Administrative](#administrative)
- [Architecture](#architecture)
  - [Technology Stack](#technology-stack)
  - [Project Structure](#project-structure)
  - [Design System](#design-system)
- [Authentication and Authorization](#authentication-and-authorization)
- [API Integration](#api-integration)
- [Pages and Components](#pages-and-components)
  - [Pages](#pages)
  - [Core Components](#core-components)
  - [UI Components](#ui-components)
- [Data Models](#data-models)
- [Engineering Decisions](#engineering-decisions)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development](#development)
  - [Production Build](#production-build)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [License](#license)

---

## Overview

VillaEase addresses the operational needs of small-to-mid-scale property managers who need a unified platform to:

1. Showcase rooms and villas to prospective guests with rich detail pages, image carousels, and advanced search/filtering.
2. Accept and manage bookings with check-in/check-out calendars, guest information, and real-time price calculation.
3. Administer property operations including room inventory management, property document lifecycle tracking, and tenant rent collection scheduling.

The application is fully client-rendered, deployed as static assets behind a CDN, and communicates with a Django-based REST API hosted on Render.

---

## Features

### Guest-Facing

- **Search and Discovery**: Airbnb-style hero search bar with location, date, and guest count fields. Filter rooms by type, price range, amenities, and availability.
- **Room Browsing**: Grid and list view modes with responsive layouts (1 to 4 columns). Room cards feature image carousels with navigation, ratings, reviews, guest capacity, and pricing.
- **Booking Flow**: Multi-field booking form with date pickers (minimum date constraints), guest count caps per room, dynamic total price calculation, and guest information collection. Authentication is required before booking submission.
- **User Accounts**: Registration with username, email, mobile number, and password. Login with JWT-based authentication. Profile page with personal information and booking history (status-coded: confirmed, pending, cancelled).
- **Responsive Design**: Every page and component adapts from mobile to desktop. Mobile-specific features include floating book buttons, hamburger navigation, and stacked layouts.

### Administrative

- **Room Management**: Full CRUD operations for room inventory. Create rooms with name, type, price, location, capacity, dimensions, images, amenities, and description. Toggle room availability. View stats (total rooms, available count, average price).
- **Document Management**: Track property documents (licenses, permits, insurance, contracts, certificates) through their lifecycle. Automatic status computation: active, expiring soon, or expired. Configurable reminder system that generates alerts when documents approach their renewal or expiry dates. Stats dashboard with counts by status.
- **Rent Collection**: Create rent schedules per room with tenant details, monthly rent amount, and due day. Record full or partial payments with method and notes. Automatic reminder generation for payments due within 5 days or overdue up to 30 days. Monthly stats showing expected rent, collected amount, and pending payments.
- **Role-Based Access**: Admin dashboard and management tools are gated behind authentication. Navigation elements are conditionally rendered based on user role.

---

## Architecture

### Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Language | TypeScript | Type-safe development with strict compiler options |
| UI Framework | React 18 | Component-based rendering with hooks |
| Build Tool | Vite | Fast HMR in development, optimized production bundles |
| Styling | Tailwind CSS | Utility-first CSS with design tokens |
| Component Library | shadcn/ui (Radix UI) | Accessible, composable primitives (dialogs, dropdowns, tabs, tooltips, etc.) |
| Icons | Lucide React | Consistent icon set |
| Routing | React Router DOM | Client-side routing with nested routes and protected routes |
| Forms | React Hook Form | Form state management (used alongside controlled components) |
| Charts | Recharts | Data visualization in admin dashboard |
| Animations | tailwindcss-animate | CSS keyframe animations for accordions and transitions |
| Package Manager | pnpm | Fast, disk-efficient dependency management |
| Linting | ESLint + TypeScript ESLint | Code quality enforcement with zero-warning policy |
| Deployment | Netlify | Static hosting with SPA redirect rules |
| Backend API | Django REST Framework | External API hosted on Render (not included in this repository) |

### Project Structure

```
Root
  components.json          -- shadcn/ui configuration
  netlify.toml             -- Deployment and redirect rules
  package.json             -- Dependencies and scripts
  tailwind.config.ts       -- Tailwind theme (colors, spacing, animations)
  tsconfig.json            -- TypeScript strict mode, path aliases
  vite.config.ts           -- Vite plugins, path alias (@/), build options

  src/
    main.tsx               -- Application entry point
    App.tsx                 -- Root component, routing, auth provider

    pages/
      HomePage.tsx          -- Landing page with hero search, villa tabs, room grid
      RoomsPage.tsx         -- Browse all rooms with filters, grid/list toggle
      BookingPage.tsx       -- Room detail and booking form
      LoginPage.tsx         -- User login with glassmorphism overlay
      RegisterPage.tsx      -- User registration
      ProfilePage.tsx       -- User profile and booking history
      AdminLogin.tsx        -- Admin authentication
      AdminPage.tsx         -- Admin dashboard (rooms, documents, rent)

    components/
      AuthProvider.tsx      -- React context provider for auth state
      Navbar.tsx            -- Global navigation with role-based links
      HeroSearch.tsx        -- Search bar with location, dates, guests
      RoomCard.tsx          -- Room listing card with image carousel
      BookingForm.tsx       -- Booking submission form with price calculation
      FilterChips.tsx       -- Room type and amenity filters
      PriceRangeSlider.tsx  -- Dual-handle price range input
      DocumentManager.tsx   -- Property document CRUD and reminders
      RentScheduler.tsx     -- Rent schedule CRUD and payment tracking
      Logo.tsx              -- Brand logo
      theme-provider.tsx    -- Dark/light mode provider
      ui/                   -- 50+ shadcn/ui primitives (accordion, dialog, etc.)

    hooks/
      useAuth.ts            -- Authentication state and methods
      useRooms.ts           -- Room fetching with API fallback to mock data
      use-mobile.tsx        -- Responsive breakpoint detection
      use-toast.ts          -- Toast notification hook

    lib/
      api.ts                -- Centralized API client with JWT refresh
      types.ts              -- TypeScript interfaces (Room, Booking, etc.)
      mockData.ts           -- Fallback dataset for offline development
      documentTypes.ts      -- Document and rent schedule type definitions
      utils.ts              -- Utility functions (cn, formatPrice)

  styles/
    globals.css             -- CSS custom properties, dark mode tokens
```

### Design System

The application uses a custom design token system built on CSS custom properties, compatible with shadcn/ui conventions:

- **Color Palette**: HSL-based tokens for background, foreground, primary, secondary, muted, accent, destructive, and card surfaces. Full dark mode support.
- **Typography**: System font stack (`font-sans`) with `text-balance` for headings.
- **Spacing and Layout**: Tailwind's default scale with a centered container (max 1400px) and 2rem padding.
- **Border Radius**: Configurable via `--radius` CSS variable with `lg`, `md`, `sm` variants.
- **Animations**: Accordion expand/collapse keyframes. Spin and pulse utilities for loading states.

---

## Authentication and Authorization

Authentication is implemented using JWT (JSON Web Tokens) with the following flow:

1. **Login**: User submits credentials to `/api/auth/login/`. On success, the server returns `access` and `refresh` tokens along with user metadata (ID, username, phone, role).
2. **Token Storage**: Both tokens and a serialized user object are stored in `localStorage`.
3. **Authenticated Requests**: A centralized `apiRequest` wrapper automatically attaches the `Authorization: Bearer <access>` header to all protected API calls.
4. **Token Refresh**: When a request returns HTTP 401, the wrapper automatically attempts to refresh the access token using the refresh token. If refresh fails, the user is logged out and local storage is cleared.
5. **Route Protection**: A `ProtectedRoute` component checks authentication state before rendering children. Unauthenticated users are redirected to the login page.
6. **Role-Based UI**: The navigation bar conditionally renders admin links (Admin Dashboard) based on the `user.role` field. Profile and booking routes are protected for all authenticated users.
7. **Graceful Degradation**: If the API is unreachable during token verification, the client falls back to local JWT decoding (parsing the base64-encoded payload) to check expiry.

---

## API Integration

The API client (`src/lib/api.ts`, 454 lines) provides a structured interface to the backend:

| Module | Endpoints | Auth Required |
|---|---|---|
| `roomsApi.getRooms()` | `GET /api/rooms/` with query params (location, dates, guests, price, type, amenities) | No |
| `roomsApi.getRoom(id)` | `GET /api/rooms/:id/` | No |
| `roomsApi.createRoom()` | `POST /api/rooms/` | Admin |
| `roomsApi.updateRoom()` | `PUT /api/rooms/:id/` | Admin |
| `roomsApi.deleteRoom()` | `DELETE /api/rooms/:id/` | Admin |
| `bookingsApi.createBooking()` | `POST /api/bookings/` | User |
| `bookingsApi.getBookings()` | `GET /api/bookings/` | Admin |
| `bookingsApi.updateBookingStatus()` | `PATCH /api/bookings/:id/status/` | Admin |
| `bookingsApi.getUserBookings()` | `GET /api/bookings/user-bookings/` | User |
| `login()` | `POST /api/auth/login/` | No |
| `register()` | `POST /api/auth/register/` | No |
| `logout()` | `POST /api/auth/logout/` | User |
| `userProfileApi.*` | `GET/PUT /api/auth/user-info/`, `/auth/profile/`, `/auth/change-password/`, `/auth/upload-profile-image/` | User |
| `uploadApi.uploadImages()` | `POST /api/upload/images` | Admin |
| `refreshToken()` | `POST /api/auth/token/refresh/` | Refresh token |

**Offline Fallback**: The `useRooms` hook catches API errors and transparently falls back to `mockData.ts`, which contains a representative dataset of 6 villa rooms. This allows full frontend development and demonstration without a running backend.

---

## Pages and Components

### Pages

| Page | Route | Description | Auth |
|---|---|---|---|
| HomePage | `/` | Hero search, villa tab navigation, filterable room grid | Public |
| RoomsPage | `/rooms` | Full room catalog with filters, grid/list toggle, skeleton loading | Public |
| BookingPage | `/booking/:id` | Room detail view with sticky booking sidebar, trust badges, mobile booking button | Public (booking requires auth) |
| LoginPage | `/login` | Glassmorphism login modal overlaying blurred homepage | Public |
| RegisterPage | `/register` | Registration form with same overlay pattern | Public |
| ProfilePage | `/profile` | User info tabs, booking history with status badges | Protected |
| AdminLogin | `/admin/login` | Admin-specific login | Public |
| AdminPage | `/admin` | 3-tab dashboard: Rooms, Documents, Rent Collection | Admin |

### Core Components

| Component | Lines | Description |
|---|---|---|
| Navbar | 207 | Sticky navigation with responsive hamburger menu, role-based link rendering, profile dropdown with avatar |
| HeroSearch | 117 | Pill-shaped search bar (location, check-in, check-out, guest count) with search callback |
| RoomCard | 170 | Image carousel with dot indicators, favorite toggle, room metadata, price display, availability badge |
| BookingForm | 213 | Date pickers, guest count, guest info fields, dynamic pricing, success confirmation card, auth guard |
| FilterChips | 86 | Room type badges (Delux, Double Delux), amenity display, clear-all action |
| PriceRangeSlider | 76 | Dual-handle range slider with numeric inputs, formatted price display |
| DocumentManager | 595 | Full document CRUD, expiry status computation, reminder alerts, stats dashboard. Persisted to localStorage |
| RentScheduler | 832 | Rent schedule CRUD, payment recording (full/partial), due date reminders, monthly stats. Persisted to localStorage |
| AuthProvider | 16 | React context provider wrapping the `useAuthProvider` hook |

### UI Components

The `src/components/ui/` directory contains 50+ primitives sourced from shadcn/ui, each built on Radix UI for accessibility compliance (WAI-ARIA patterns, keyboard navigation, screen reader support). These include: accordion, alert dialog, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command palette, context menu, dialog, drawer, dropdown menu, form, hover card, input (with OTP variant), label, menubar, navigation menu, pagination, popover, progress bar, radio group, resizable panels, scroll area, select, separator, sheet, sidebar, skeleton, slider, sonner (toast), switch, table, tabs, textarea, toast, toggle, tooltip.

---

## Data Models

### Room

| Field | Type | Description |
|---|---|---|
| id | string / number | Unique identifier |
| name | string | Display name (e.g., "Moorfield Villa - Ocean View Suite") |
| type | string | Room category (villa, delux, etc.) |
| price | number | Nightly rate |
| rating | number | Average guest rating |
| reviews | number | Total review count |
| images | string[] | Image URLs |
| amenities | string[] | Feature list (WiFi, parking, etc.) |
| description | string | Full text description |
| location | string | Geographic location |
| maxGuests | number | Maximum occupancy |
| bedrooms | number | Bedroom count |
| bathrooms | number | Bathroom count |
| size | number | Size in square meters |
| available | boolean | Current availability |

### Booking

| Field | Type | Description |
|---|---|---|
| id | string | Unique identifier |
| roomId | string | Associated room |
| checkIn / checkOut | string | Date range |
| guests | number | Number of guests |
| totalPrice | number | Calculated total |
| status | enum | pending, confirmed, cancelled, completed |
| guestInfo | object | Name, email, phone |
| createdAt / updatedAt | string | Timestamps |

### PropertyDocument

| Field | Type | Description |
|---|---|---|
| id | string | Unique identifier |
| name | string | Document title |
| type | enum | license, permit, insurance, contract, certificate, other |
| status | enum | active, expiring-soon, expired, renewed |
| expiryDate | string | Expiration date |
| renewalDate | string | Renewal date |
| reminderDays | number | Days before expiry to trigger alert |

### RentSchedule

| Field | Type | Description |
|---|---|---|
| id | string | Unique identifier |
| roomId / roomName | string | Associated room |
| tenantName / tenantEmail / tenantPhone | string | Tenant contact |
| monthlyRent | number | Monthly amount |
| dueDay | number | Day of month (1-31) |
| status | enum | active, paused, completed |
| paymentHistory | RentPayment[] | Payment records with date, amount, method, status |

---

## Engineering Decisions

### Offline-First Data Strategy

The `useRooms` hook implements a try/catch pattern where API failures transparently fall back to local mock data. This enables:
- Frontend development without a running backend
- Demo deployments that function without API connectivity
- Graceful degradation in production if the API experiences downtime

### JWT Token Lifecycle Management

Rather than using a dedicated auth library, the application implements a lightweight token refresh mechanism directly in the API wrapper. Every authenticated request passes through `apiRequest()`, which handles 401 responses by attempting a refresh before failing. This centralizes auth logic in a single function and avoids scattering token management across components.

### Component-Level Persistence for Admin Tools

Document management and rent scheduling data are persisted to `localStorage` rather than sent to the backend API. This is a deliberate choice for the current stage: it allows the admin tools to function as standalone utilities without backend schema changes, while keeping the persistence layer easy to swap for API calls when the backend endpoints are ready.

### Strict TypeScript Configuration

The project uses TypeScript in strict mode with `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch` enabled. Combined with ESLint's zero-warning policy, this catches type errors, unused code, and potential logic bugs at compile time.

### CSS Architecture

Two-layer approach:
1. `styles/globals.css` defines the shadcn/ui design token system (HSL color variables, dark mode overrides).
2. `src/index.css` adds application-specific utilities (search bar styles, range slider thumb customization, grid pattern backgrounds).

Both layers sit on top of Tailwind's utility classes, avoiding custom CSS wherever possible while accommodating edge cases that Tailwind cannot express natively.

### Route-Level Code Organization

Pages own their data fetching and state management. Components are stateless or manage only UI-local state (carousel index, form fields). Hooks encapsulate reusable logic (auth, room fetching, responsive breakpoints). This separation keeps components testable and pages self-contained.

### SPA Deployment Configuration

The `netlify.toml` file configures a catch-all redirect (`/* -> /index.html` with status 200), ensuring that React Router handles all routes client-side without 404 errors on direct navigation or page refresh.

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- pnpm (recommended) or npm

### Installation

```bash
git clone <repository-url>
cd Room-Booking-new
pnpm install
```

### Development

```bash
pnpm dev
```

The development server starts on `http://localhost:5173` with hot module replacement enabled.

### Production Build

```bash
pnpm build
```

Outputs optimized static assets to the `dist/` directory. Preview locally with:

```bash
pnpm preview
```

---

## Deployment

The application is configured for deployment on Netlify:

- **Build command**: `pnpm run build`
- **Publish directory**: `dist`
- **Node version**: 18
- **SPA routing**: All paths redirect to `index.html` with status 200

To deploy, connect the repository to a Netlify site and the `netlify.toml` configuration will be picked up automatically.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://room-booking-pjo6.onrender.com/api` | Base URL for the backend REST API |

Set in a `.env` file at the project root or in the deployment platform's environment settings. The `VITE_` prefix is required for Vite to expose the variable to client-side code.

---

## License

This project is proprietary. All rights reserved.
