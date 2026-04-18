# Guestlist App

A full-stack event guestlist management platform built with **Next.js 16**, **TypeScript**, **Supabase**, and **Tailwind CSS v4**. Designed for nightclub and event promoters to manage guest applications, staff, door check-ins, analytics, and communications — all from a single admin dashboard.

---

## ✨ Features

### 🎟️ Guest Applications
- Guests apply via a public invite-code-gated form
- Invite codes are tiered: **guest**, **friendlist**, **crew/staff**
  - Friendlist & staff codes are single-use (`max_uses = 1`)
  - Staff/crew codes auto-approve the applicant and assign a role
- Application status flow: `applied → approved / rejected / waitlist / cancelled`
- Each approved guest receives a unique QR token for door scanning

### 🚪 Door Check-In (QR Scanner)
- Admin-only scanner page decodes QR codes (including white-on-black inverted codes)
- Supports both normal and inverted QR scans via canvas loop
- Displays guest name, tier, and **calculated entry price** before confirming check-in
- Tracks `paid` status at the point of check-in
- Already-checked-in guests return a clear yellow "already checked in" card (HTTP 409)
- Manual check-in also available (auto-sets `paid = true`)

### 💶 Entry Fee & Payment Tracking
- Events can have an `entry_fee` (€) and a `friendlist_discount` (%)
- Server-side price calculation based on guest tier:
  - `guest` → full fee
  - `friendlist` → discounted price
  - `crew` / `staff` → free
- `paid` flag recorded per guest at check-in or retroactively via PATCH
- Revenue projections available in analytics (approved / checked-in / paid)

### 📧 Email Dispatch System (Resend)
- Sends approval and rejection emails to guests via [Resend](https://resend.com)
- **Batch mode**: manually trigger a send for all pending guests at once
- **Scheduled mode**: set a future datetime for auto batch dispatch (via cron endpoint)
- **Immediate mode**: if the batch was already sent, any new approval/rejection triggers an instant email
- **Resend**: force-resend email for any individual guest regardless of prior state
- Cron endpoint: `GET /api/cron/send-scheduled-emails` — protected by `CRON_SECRET` header or admin session

### 📊 Analytics Dashboard
- Powered by **Recharts** (bar charts + line charts)
- Application statistics: total, approved, rejected, waitlist, pending, cancelled, checked-in, no-shows
- Approval rate and show rate
- **Gender distribution** with filter toggle (all applicants vs approved only)
- **Age distribution** in brackets (18–20, 21–23, 24–26, 27–29, 30–34, 35–39, 40+) with gender breakdown
- "Heard about us" source breakdown
- **Income stats**: projected revenue for approved / checked-in / paid tiers
- **Per-admin invite code stats**: codes created, capacity, usage rate, guest show rate
- **Individual code details**: tier, comment, status (active / exhausted / revoked / declined)
- Applications over time (timeline chart)

### 🎛️ DJ Roster & Lineup Management
- Dedicated **DJs** tab in the sidebar
- DJ profiles linked to staff application records (role = `dj`)
- Fields: genres, Instagram, SoundCloud, Mixcloud, bio
- DJ Sets management: start/end time, set type, stage/room, notes
- Set types: opening, warming_up, peak_time, closing, back2back, b3b, live_act
- Full CRUD via `/api/djs` and `/api/dj-sets`

### 👤 Manual Guest & Staff Addition
- Admins can add guests or staff directly from the dashboard (no invite code required)
- Supported roles: `guest`, `dj`, `security`, `bar_staff`, `general_staff`, `awareness`, `other`
- Auto-generates QR token, sets `status = approved`, tracks `added_by_admin_id`
- Email and gender validation enforced server-side

### 🔐 Admin Authentication
- JWT-based admin sessions (via cookie)
- All API routes protected with `verifyAdminSession()`
- Admin accounts tracked with `created_by_admin_id` on invite codes and `added_by_admin_id` on manual guests

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── admins/             # List admin accounts
│   │   ├── analytics/          # Full event analytics
│   │   ├── applications/       # List applications (with admin joins)
│   │   ├── apply/              # Guest application submission
│   │   ├── checkin/            # QR scan check-in (GET/POST/PATCH)
│   │   ├── cron/
│   │   │   └── send-scheduled-emails/   # Cron-triggered batch email
│   │   ├── dj-sets/            # DJ set CRUD
│   │   ├── djs/                # DJ profile CRUD
│   │   ├── edit-application/   # Edit guest record
│   │   ├── events/
│   │   │   ├── email-state/    # Batch email status
│   │   │   └── schedule-email/ # Schedule future batch send
│   │   ├── invite/
│   │   │   ├── create/         # Create tiered invite code
│   │   │   └── list/           # List invite codes
│   │   ├── manual-checkin/     # Manual door check-in
│   │   ├── manual-guest/       # Add guest/staff without invite code
│   │   ├── resend-email/       # Force-resend email
│   │   ├── send-emails/        # Trigger batch email send
│   │   ├── update-status/      # Update application status
│   │   └── validate-invite/    # Validate invite code + return tier
│   ├── components/
│   │   └── Sidebar.tsx         # Navigation sidebar
│   └── dashboard/
│       ├── analytics/          # Analytics charts & tables
│       ├── djs/                # DJ roster & lineup page
│       └── scanner/            # QR door scanner
├── lib/
│   ├── auth.ts                 # JWT session verification
│   ├── EventContext.tsx         # Global event selection context
│   ├── sendEmails.ts           # Email dispatch logic (Resend)
│   └── supabase.ts             # Supabase client
public/
└── Video/
    └── bg.mp4                  # Background video asset
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.9.0
- A [Supabase](https://supabase.com) project
- A [Resend](https://resend.com) account (for email dispatch)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_api_key
CRON_SECRET=your_cron_secret          # Used to protect the cron email endpoint
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

---

## 🗄️ Database Tables (Supabase)

| Table | Description |
|-------|-------------|
| `events` | Events with name, date, capacity, entry_fee, friendlist_discount, email schedule fields |
| `applications` | Guest/staff applications with status, QR token, role, paid flag |
| `invite_codes` | Invite codes with tier, max_uses, usage tracking, admin attribution |
| `admins` | Admin accounts |
| `dj_profiles` | DJ social links, genres, bio — linked to an application |
| `dj_sets` | DJ set schedule entries linked to dj_profile + event |

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` ^16.2.3 | App framework |
| `react` 19.2.3 | UI library |
| `@supabase/supabase-js` | Database & auth |
| `recharts` ^3.8.1 | Analytics charts |
| `resend` ^6.12.0 | Transactional email |
| `xlsx` ^0.18.5 | Excel export |
| `lucide-react` | Icons |
| `tailwindcss` v4 | Styling |
| `jose` / `jsonwebtoken` | JWT session handling |
| `qrcode` | QR code generation |
| `uuid` | Token generation |

---

## 🔒 Security

- All dashboard routes and API endpoints require a valid admin JWT cookie
- The cron endpoint (`/api/cron/send-scheduled-emails`) accepts either an admin session **or** a `X-Cron-Secret` header matching `CRON_SECRET`
- Invite code validation uses plain-text comparison (codes are stored as-is in `code_hash`)
- Role and tier validation enforced server-side on all write endpoints

---

## 📄 License

Private — Night Vision Visuals. All rights reserved.
