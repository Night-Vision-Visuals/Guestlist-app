# Night Vision — Guestlist App

A full-stack guestlist management system for curated nightclub events. Built for **Night Vision Visuals (Vienna)**, this app handles the complete guest lifecycle: invite-code distribution, online applications, admin review, QR-ticket generation, and door check-in via a live camera scanner.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Environment Variables](#environment-variables)
6. [Local Development Setup](#local-development-setup)
7. [Supabase Setup](#supabase-setup)
8. [Pages Reference](#pages-reference)
9. [API Routes Reference](#api-routes-reference)
10. [Admin Dashboard Guide](#admin-dashboard-guide)
11. [Database Migrations](#database-migrations)
12. [Deployment](#deployment)

---

## Features

### Public-Facing

| Feature | Description |
|---|---|
| **Landing Page** | Dark, animated homepage with event info and links to apply or login |
| **Access / Apply** | Guests enter a 6-character invite code to unlock the application form |
| **Application Form** | Collects name, date of birth, gender, email, Instagram handle, how they heard about the event, and an optional short intro. Accepts GDPR/Datenschutz consent. |
| **QR Ticket** | Approved guests receive a unique URL (`/ticket/[token]`) showing a scannable QR code for door entry |
| **Datenschutz** | German-language privacy policy page |

### Admin Dashboard

| Feature | Description |
|---|---|
| **Applications** | View all guest applications with status, demographics, and search/filter. Switch between compact overview and full detail view. Approve, reject, waitlist, or cancel guests. Edit email or status inline. Manually check in approved guests as a backup. |
| **Analytics** | Per-event statistics: total applications, approved/rejected/waitlist/cancelled counts, check-in rate, gender distribution, average age, heard-about-us breakdown, and applications-over-time chart. |
| **Invitations** | Generate 6-character invite codes with a type label (Guestlist, Friend, VIP, Instagram, WhatsApp, Social Media). Track uses vs. capacity. Revoke or permanently delete codes. |
| **Events** | Create, edit, and (Admin-only) delete events. Set event name, date, location, description, guest limit, poster image URL, and minimum/maximum guest age. Past events are read-only. |
| **Scanner** | Live camera QR-code scanner for door check-in. Pre-requests camera permission and handles iOS/Android quirks. Shows instant pass/fail feedback with guest name. |

### Security & Auth

- JWT-based admin authentication stored in an HTTP-only cookie (`admin_token`, 24 h TTL)
- Next.js middleware protects all `/dashboard` routes server-side
- Passwords stored as bcrypt hashes in Supabase
- Only the admin account named `Admin` can permanently delete events

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server + Client Components) |
| Language | TypeScript 5 |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Database & Auth | [Supabase](https://supabase.com) (PostgreSQL + JS client) |
| Authentication | [jose](https://github.com/panva/jose) (JWT verify) + [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) (JWT sign) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) (password hashing) |
| QR Generation | [qrcode](https://github.com/soldair/node-qrcode) |
| QR Scanning | [@zxing/browser](https://github.com/zxing-js/browser) + [@zxing/library](https://github.com/zxing-js/library) |
| Icons | [lucide-react](https://lucide.dev) |
| Audio | [use-sound](https://github.com/joshwcomeau/use-sound) |
| Unique IDs | [uuid](https://github.com/uuidjs/uuid) |

---

## Project Structure

```
Guestlist-app/
├── migrations/                        # SQL migration scripts (run in Supabase SQL editor)
│   ├── 001_add_new_columns.sql        # Adds gender, heard_about_us, qr_token, check-in fields
│   └── 002_extended_features.sql     # Adds invite_type, revoked_at, min/max age, age_flagged
│
├── public/                            # Static assets (logo, sounds)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout: fonts (Geist), metadata, MusicProvider wrapper
│   │   ├── globals.css                # Global Tailwind imports and CSS variables
│   │   ├── page.tsx                   # Public landing page (/)
│   │   │
│   │   ├── admin/
│   │   │   └── page.tsx               # Admin login page (/admin)
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx               # Guest access page (/login) — invite code entry + application form
│   │   │
│   │   ├── datenschutz/
│   │   │   └── page.tsx               # German privacy policy page (/datenschutz)
│   │   │
│   │   ├── ticket/[token]/
│   │   │   ├── page.tsx               # Server component: fetches application by QR token
│   │   │   └── QRTicket.tsx           # Client component: renders QR code image for the ticket
│   │   │
│   │   ├── dashboard/
│   │   │   ├── layout.tsx             # Dashboard layout: auth check + Sidebar + EventProvider
│   │   │   ├── page.tsx               # Applications tab — main guest management view
│   │   │   ├── analytics/
│   │   │   │   ├── layout.tsx         # Analytics sub-layout
│   │   │   │   └── page.tsx           # Analytics tab — statistics, charts, demographics
│   │   │   ├── events/
│   │   │   │   └── page.tsx           # Events tab — create, edit, delete events
│   │   │   ├── invites/
│   │   │   │   ├── layout.tsx         # Invites sub-layout
│   │   │   │   └── page.tsx           # Invitations tab — generate, revoke, delete codes
│   │   │   └── scanner/
│   │   │       └── page.tsx           # Scanner tab — live camera QR check-in
│   │   │
│   │   ├── api/
│   │   │   ├── analytics/route.ts     # GET  /api/analytics?eventId=  — per-event stats
│   │   │   ├── applications/route.ts  # GET  /api/applications?eventId= — list all applications
│   │   │   ├── apply/route.ts         # POST /api/apply — submit guest application (public)
│   │   │   ├── checkin/route.ts       # POST /api/checkin — QR scanner check-in; GET to look up token
│   │   │   ├── edit-application/      # POST /api/edit-application — update guest email or status
│   │   │   ├── events/route.ts        # GET/POST/PATCH/DELETE /api/events — event CRUD
│   │   │   ├── invite/
│   │   │   │   ├── create/route.ts    # POST /api/invite/create — generate a new invite code
│   │   │   │   ├── delete/route.ts    # POST /api/invite/delete — permanently delete a code
│   │   │   │   ├── list/route.ts      # GET  /api/invite/list?eventId= — list invite codes
│   │   │   │   └── revoke/route.ts    # POST /api/invite/revoke — revoke (disable) a code
│   │   │   ├── login/route.ts         # POST /api/login — admin login, sets JWT cookie
│   │   │   ├── logout/route.ts        # POST /api/logout — clears JWT cookie
│   │   │   ├── manual-checkin/        # POST /api/manual-checkin — manually check in by application ID
│   │   │   ├── me/route.ts            # GET  /api/me — returns current admin username
│   │   │   ├── update-status/         # POST /api/update-status — approve / reject / waitlist / cancel
│   │   │   └── validate-invite/       # POST /api/validate-invite — check code before showing form
│   │   │
│   │   └── components/
│   │       ├── Sidebar.tsx            # Dashboard navigation sidebar with event switcher
│   │       ├── AuthCard.tsx           # Reusable card wrapper for auth-style forms
│   │       ├── Input.tsx              # Styled input component
│   │       ├── MusicProvider.tsx      # Global audio context — plays ambient background music
│   │       └── MusicToggle.tsx        # Floating button to mute/unmute background music
│   │
│   └── lib/
│       ├── auth.ts                    # verifyAdminSession() — reads and verifies JWT from cookie
│       ├── supabase.ts                # Supabase client singleton
│       ├── EventContext.tsx           # React context: fetches and shares the list of events + current event
│       └── useCurrentEvent.ts         # Legacy hook (use EventContext instead)
│
├── middleware.ts                      # Next.js middleware: protects /dashboard/* routes
├── next.config.ts                     # Next.js configuration
├── tailwind.config.js                 # Tailwind CSS configuration
├── tsconfig.json                      # TypeScript configuration
└── package.json                       # Dependencies and scripts
```

---

## Database Schema

All tables live in the default Supabase schema (`public`). The database is PostgreSQL hosted on Supabase.

### `admins`

Stores admin user accounts. Passwords are stored as bcrypt hashes.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` PK | Auto-generated primary key |
| `username` | `text` UNIQUE | Login username |
| `password_hash` | `text` | bcrypt hash of the password |
| `created_at` | `timestamptz` | Account creation timestamp |

> **Note:** The special username `Admin` has elevated privileges (can delete events).

---

### `events`

Each row represents a Night Vision party event.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` PK | Auto-generated primary key |
| `name` | `text` | Event name (e.g. "Night Vision Vol. 3") |
| `event_date` | `date` | Date of the event |
| `location` | `text` | Venue / city (e.g. "Vienna, Austria") |
| `description` | `text` | Optional event description |
| `guest_limit` | `integer` | Maximum number of approved guests |
| `poster_url` | `text` | URL to the event poster image |
| `min_age` | `integer` | Minimum guest age (default: 18). Guests younger are flagged. |
| `max_age` | `integer` | Maximum guest age (optional). Guests older are flagged. |
| `created_at` | `timestamptz` | Creation timestamp |

---

### `invite_codes`

One row per invitation code that admins distribute to potential guests.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` PK | Auto-generated primary key |
| `code_hash` | `text` | Plain-text 6-character uppercase hex code (e.g. `A3F9C1`) |
| `max_uses` | `integer` | How many times this code can be used |
| `current_uses` | `integer` | How many times it has been used so far |
| `redeemed` | `boolean` | `true` when all uses are consumed **or** the code is revoked |
| `revoked_at` | `timestamptz` | Set when an admin explicitly revokes the code; `null` if not revoked |
| `invite_type` | `text` | Category: `guestlist`, `friend`, `vip`, `instagram`, `whatsapp`, `socialmedia` |
| `event_id` | `uuid` FK → `events.id` | The event this code belongs to (optional) |
| `created_by_admin_id` | `uuid` FK → `admins.id` | Admin who generated the code |
| `redeemed_at` | `timestamptz` | When the last use was redeemed |
| `redeemed_by_guest_id` | `uuid` FK → `applications.id` | Last applicant to use the code |
| `created_at` | `timestamptz` | Creation timestamp |

> **Status logic:** A code is "Revoked" when `revoked_at IS NOT NULL`. It is "Fully Used" when `redeemed = true` and `revoked_at IS NULL`. It is "Active" otherwise.

---

### `applications`

One row per guest application. Each application is linked to an invite code and an event.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` PK | Auto-generated primary key |
| `event_id` | `uuid` FK → `events.id` | The event the guest applied for |
| `invitation_code_id` | `uuid` FK → `invite_codes.id` | The invite code used |
| `first_name` | `text` | Guest's first name |
| `last_name` | `text` | Guest's last name |
| `date_of_birth` | `date` | Guest's date of birth |
| `email` | `text` | Guest's email address |
| `instagram` | `text` | Instagram handle (optional) |
| `intro` | `text` | Short personal intro (optional) |
| `gender` | `text` | `male`, `female`, or `diverse` |
| `heard_about_us` | `text` | How they found out: `friend`, `instagram`, `flyer`, `tiktok`, `other` |
| `datenschutz_accepted` | `boolean` | Whether they accepted the GDPR privacy policy |
| `status` | `text` | `applied` → `approved` / `rejected` / `waitlist` / `cancelled` |
| `qr_token` | `text` UNIQUE | Unique token generated on approval; powers the `/ticket/[token]` URL |
| `checked_in` | `boolean` | Whether the guest checked in at the door |
| `checked_in_at` | `timestamptz` | Timestamp of door check-in |
| `invite_type` | `text` | Copied from the invite code at application time |
| `age_flagged` | `boolean` | `true` if the guest's age is outside the event's `min_age`/`max_age` range |
| `created_at` | `timestamptz` | Submission timestamp |

> **Guest status flow:** `applied` (default) → admin reviews → `approved` (QR token generated), `rejected`, `waitlist`, or `cancelled` (guest self-reports they can't attend — does not count as a no-show).

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase — get these from your Supabase project settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# JWT secret — any long random string (min 32 chars recommended)
# Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-very-long-random-secret-string

# Optional: default event ID used as a fallback when no event_id is passed in an application
# (legacy — can be left empty if events are managed via the dashboard)
NEXT_PUBLIC_EVENT_ID=
```

> **Security:** `JWT_SECRET` must be kept secret and never committed. It signs the admin session tokens. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose client-side because Supabase Row Level Security governs data access.

---

## Local Development Setup

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- A [Supabase](https://supabase.com) project (free tier is fine)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/Night-Vision-Visuals/Guestlist-app.git
cd Guestlist-app

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local   # or create it manually (see Environment Variables above)

# 4. Apply database migrations (see Supabase Setup below)

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Next.js development server with hot reload |
| `npm run build` | Build the production bundle |
| `npm run start` | Start the production server (requires a prior build) |
| `npm run lint` | Run ESLint on the codebase |

---

## Supabase Setup

### 1. Create the tables

Run the following SQL in your Supabase **SQL Editor** to create the base schema:

```sql
-- Admins table
CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Events table
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  event_date date NOT NULL,
  location text,
  description text,
  guest_limit integer,
  poster_url text,
  min_age integer DEFAULT 18,
  max_age integer,
  created_at timestamptz DEFAULT now()
);

-- Invite codes table
CREATE TABLE invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash text NOT NULL,
  max_uses integer NOT NULL DEFAULT 1,
  current_uses integer NOT NULL DEFAULT 0,
  redeemed boolean NOT NULL DEFAULT false,
  revoked_at timestamptz,
  invite_type text DEFAULT 'guestlist',
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  created_by_admin_id uuid REFERENCES admins(id) ON DELETE SET NULL,
  redeemed_at timestamptz,
  redeemed_by_guest_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Applications table
CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  invitation_code_id uuid REFERENCES invite_codes(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  email text NOT NULL,
  instagram text,
  intro text,
  gender text,
  heard_about_us text,
  datenschutz_accepted boolean DEFAULT false,
  status text NOT NULL DEFAULT 'applied',
  qr_token text UNIQUE,
  checked_in boolean DEFAULT false,
  checked_in_at timestamptz,
  invite_type text,
  age_flagged boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_applications_qr_token ON applications(qr_token);
CREATE INDEX idx_invite_codes_code_hash ON invite_codes(code_hash);
CREATE INDEX idx_applications_age_flagged ON applications(age_flagged);
CREATE INDEX idx_applications_invite_type ON applications(invite_type);
CREATE INDEX idx_invite_codes_invite_type ON invite_codes(invite_type);
```

### 2. Create the first admin account

```sql
-- Replace 'Admin' and the hash below with your chosen username and a real bcrypt hash.
-- Generate a bcrypt hash: node -e "const b=require('bcryptjs'); b.hash('your_password',10).then(console.log)"
INSERT INTO admins (username, password_hash)
VALUES ('Admin', '$2a$10$your_bcrypt_hash_here');
```

### 3. Row Level Security (RLS)

The app uses the **Supabase anon key** from both the client and server. For simplicity during development you can disable RLS on all tables. For production, enable it and add policies so only authenticated admins can read/write sensitive data.

```sql
-- Disable RLS (development only)
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
```

---

## Pages Reference

### Public Routes

| Route | File | Description |
|---|---|---|
| `/` | `src/app/page.tsx` | Landing page. Animated particle canvas, event teaser, links to apply and admin login. Color scheme: black + cyan. |
| `/login` | `src/app/login/page.tsx` | Guest access page. Step 1: enter 6-digit invite code. Step 2: fill out application form. On success shows a confirmation message. Paste-to-fill supported on the code inputs. |
| `/ticket/[token]` | `src/app/ticket/[token]/page.tsx` | Server-rendered ticket page. Validates the QR token, then renders `QRTicket.tsx` with a QR code image. Shows "already checked in" state if applicable. |
| `/datenschutz` | `src/app/datenschutz/page.tsx` | German GDPR privacy policy. |
| `/admin` | `src/app/admin/page.tsx` | Admin login form. Submits to `/api/login`, redirects to `/dashboard` on success. |

### Dashboard Routes (auth required)

All dashboard routes are protected by `middleware.ts` — unauthenticated visitors are redirected to `/admin`.

| Route | File | Description |
|---|---|---|
| `/dashboard` | `src/app/dashboard/page.tsx` | **Applications tab.** Lists all guests for the current event. Overview mode shows compact rows with status badges. Detail mode expands each card to show all fields. Actions: Approve, Reject, Waitlist, Cancel, Edit (email/status), Manual Check-in. Search by name, email, or Instagram. |
| `/dashboard/analytics` | `src/app/dashboard/analytics/page.tsx` | **Analytics tab.** Displays stats cards (total, approved, rejected, waitlist, pending, checked-in, cancelled), gender distribution bars, average age, heard-about-us breakdown, approval rate, invite code usage stats, and an applications-by-day timeline. |
| `/dashboard/invites` | `src/app/dashboard/invites/page.tsx` | **Invitations tab.** Generate invite codes with a type (Guestlist, Friend, VIP, Instagram, WhatsApp, Social Media) and a max-uses limit. Copy generated codes. View all codes with usage bars. Revoke or delete codes. |
| `/dashboard/events` | `src/app/dashboard/events/page.tsx` | **Events tab.** Create new events (future dates only). Edit existing non-past events (inline form). Delete events (Admin account only, double confirmation). Displays age badge (e.g. "Age: 18–35") when restrictions are set. |
| `/dashboard/scanner` | `src/app/dashboard/scanner/page.tsx` | **Scanner tab.** Activates the device camera to scan QR codes. On a valid scan calls `/api/checkin` and shows the guest name with a green/yellow/red result card. Pre-requests `getUserMedia` to avoid iOS/Android permission race conditions. |

---

## API Routes Reference

All admin-only routes verify the `admin_token` JWT cookie via `verifyAdminSession()` and return `401 Unauthorized` if missing or invalid.

### Authentication

#### `POST /api/login`
Authenticates an admin user.
- **Body:** `{ username: string, password: string }`
- **Success:** Sets `admin_token` HTTP-only cookie (24 h), returns `{ success: true }`
- **Errors:** `400` missing fields · `401` wrong credentials · `500` server/JWT config error

#### `POST /api/logout`
Logs out the current admin.
- **Body:** none
- **Success:** Clears `admin_token` cookie, returns `{ success: true }`

#### `GET /api/me`
Returns the currently logged-in admin's identity.
- **Auth required**
- **Success:** `{ username: string, adminId: string }`

---

### Events

#### `GET /api/events`
Returns all events, sorted by date descending.
- **Auth required**
- **Success:** Array of event objects

#### `POST /api/events`
Creates a new event.
- **Auth required**
- **Body:** `{ name, event_date, location?, description?, guest_limit?, poster_url?, min_age?, max_age? }`
- **Success:** `{ success: true, event: { ... } }`

#### `PATCH /api/events`
Updates an existing event's fields.
- **Auth required**
- **Body:** `{ id, ...fields to update }`
- **Success:** `{ success: true }`

#### `DELETE /api/events`
Permanently deletes an event. **Restricted to the `Admin` account.**
- **Auth required** (username must equal `"Admin"`)
- **Body:** `{ id: string }`
- **Success:** `{ success: true }`
- **Errors:** `403` if caller is not `Admin`

---

### Applications

#### `GET /api/applications?eventId=`
Returns all applications for an event (or all events if no `eventId`), sorted newest first.
- **Auth required**

#### `POST /api/apply`
Submits a new guest application. **Public — no auth required.**
- **Body:** `{ first_name, last_name, date_of_birth, email, code, gender, heard_about_us, datenschutz_accepted, instagram?, intro? }`
- **Validates:** all required fields present · invite code is valid and not revoked/exhausted · GDPR checkbox is ticked
- **Success:** Creates application record, increments `invite_codes.current_uses`, returns `{ success: true, applicationId, usesRemaining }`
- **Errors:** `400` invalid/exhausted code · `401` invalid code · `500` DB error

#### `POST /api/update-status`
Changes an application's status (admin action on the Applications tab).
- **Auth required**
- **Body:** `{ id: string, action: "approve" | "reject" | "waitlist" | "cancelled" }`
- **On `approve`:** checks if approved count < 130; if so, sets status to `approved` and generates a UUID QR token; otherwise auto-waitlists.
- **Success:** `{ success: true, qr_token? }`

#### `POST /api/edit-application`
Updates an application's email and/or status directly.
- **Auth required**
- **Body:** `{ id: string, email?: string, status?: string }`
- **On status `approved`:** generates a QR token if one doesn't already exist.
- **Success:** `{ success: true }`

---

### Check-in

#### `POST /api/checkin`
Checks in a guest by QR token (used by the door scanner).
- **Auth required**
- **Body:** `{ token: string }`
- **Validates:** application exists · status is `approved` · not already checked in
- **Success:** `{ success: true, guest: { id, name, email, checked_in_at } }`
- **Errors:** `404` unknown QR · `400` not approved · `409` already checked in

#### `GET /api/checkin?token=`
Looks up a guest by QR token without marking them as checked in.
- **Auth required**
- **Success:** `{ id, name, email, status, checked_in, checked_in_at }`

#### `POST /api/manual-checkin`
Manually checks in an approved guest by their application ID (backup for when QR fails).
- **Auth required**
- **Body:** `{ id: string }`
- **Validates:** application exists · status is `approved` · not already checked in
- **Success:** `{ success: true, message, checked_in_at }`

---

### Invite Codes

#### `GET /api/invite/list?eventId=`
Lists all invite codes (optionally filtered by event), joined with the creating admin's username.
- **Auth required**

#### `POST /api/invite/create`
Generates a new random 6-character invite code.
- **Auth required**
- **Body:** `{ max_uses: number (1–100), invite_type?: string, event_id?: string }`
- **Success:** `{ success: true, code: "XXXXXX", id, max_uses, created_at }`

#### `POST /api/invite/revoke`
Revokes an invite code by setting `revoked_at` and `redeemed = true`. The code can no longer be used but its history is preserved.
- **Auth required**
- **Body:** `{ id: string }`
- **Success:** `{ success: true }`

#### `POST /api/invite/delete`
Permanently deletes an invite code record.
- **Auth required**
- **Body:** `{ id: string }`
- **Success:** `{ success: true }`

#### `POST /api/validate-invite`
Checks whether an invite code is valid before showing the application form (called from the login page).
- **Public — no auth required**
- **Body:** `{ code: string }`
- **Success:** `{ success: true }`
- **Errors:** `401` invalid code · `400` revoked or exhausted

---

### Analytics

#### `GET /api/analytics?eventId=`
Returns all statistics for a given event.
- **Auth required**
- **Response shape:**
```json
{
  "event": { "id", "name", "date", "location" },
  "statistics": {
    "total", "approved", "rejected", "waitlist", "pending",
    "cancelled", "checkedIn", "approvalRate"
  },
  "genderStats": {
    "male", "female", "diverse",
    "malePercent", "femalePercent", "diversePercent",
    "averageAge"
  },
  "heardAboutUs": { "friend": 5, "instagram": 12, ... },
  "inviteStats": { "totalCodes", "totalGenerated", "totalUsed", "usageRate" },
  "applicationsByDay": { "3/9/2026": 4, ... }
}
```

---

## Admin Dashboard Guide

### Switching Events

Use the **event selector dropdown** in the sidebar to switch between events. All dashboard tabs (Applications, Analytics, Invitations) update to show data for the selected event.

### Guest Status Workflow

```
Applied (default)
    ↓ Admin reviews
 ┌──────────────────────────────────┐
 │  Approved → QR ticket generated  │
 │  Rejected                        │
 │  Waitlist                        │
 │  Cancelled (guest notified, no   │
 │            "no-show" flag)        │
 └──────────────────────────────────┘
 Approved guests:
    → Receive /ticket/[token] URL
    → Check in at door via QR scanner
      OR manual check-in button
```

### Guest Capacity

The `update-status` API auto-moves guests to **Waitlist** when the approved count reaches 130 (hardcoded limit). You can adjust this in `src/app/api/update-status/route.ts`.

### Creating Invite Codes

1. Go to **Invitations** tab
2. Click **+ Create New Code**
3. Choose a type (e.g. VIP, Friend) and set the number of allowed uses
4. Copy the generated 6-character code and share it with the guest

A code marked as **Revoked** was manually disabled by an admin. A code marked **Fully Used** has reached its `max_uses` limit through normal applications.

---

## Database Migrations

Migrations are plain SQL files in the `migrations/` folder. Run them in order in your Supabase **SQL Editor** under **Database → SQL Editor**.

| File | What it does |
|---|---|
| `001_add_new_columns.sql` | Adds `gender`, `heard_about_us`, `datenschutz_accepted`, `qr_token`, `checked_in`, `checked_in_at` to `applications`; adds `description`, `guest_limit`, `poster_url` to `events`; documents plain-text code storage change |
| `002_extended_features.sql` | Adds `invite_type`, `revoked_at` to `invite_codes`; adds `min_age`, `max_age` to `events`; adds `age_flagged`, `invite_type` to `applications`; adds performance indexes |

> These migrations are **idempotent** — they use `ADD COLUMN IF NOT EXISTS` so re-running them is safe.

---

## Deployment

### Vercel (recommended)

1. Push the repo to GitHub
2. Import the project on [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local` in the Vercel project settings
4. Deploy — Vercel auto-detects Next.js and builds/deploys on every push

### Other Platforms

Any Node.js 18+ host works. Build with `npm run build` and start with `npm run start`. Ensure all environment variables are set in the host's environment.

### Camera Scanner on Mobile

The QR scanner requires **HTTPS** to access the device camera (browser security requirement). On localhost, `http://` works fine. On a deployed URL you must use HTTPS — Vercel provides this automatically.

