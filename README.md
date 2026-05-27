# EventFlow Connect

EventFlow Connect is a modern, premium event management and sponsorship marketplace platform. It facilitates seamless collaboration between **Organizers**, **Sponsors**, **Volunteers**, and **Participants** by synchronizing budgets, real-time tasks, live check-ins, direct communications, and BI-grade ROI analytics.

---

## 🚀 Project Overview

The application acts as an end-to-end workspace for coordinating tech summits, hackathons, and workshops:
- **Organizers** can draft events, plan budgets, review volunteers, and pitch packages directly to sponsors.
- **Sponsors** can browse marketplace opportunities, negotiate packages via live chat, sign deals, and track their return on investment in real time.
- **Volunteers** can apply for preferred departments, earn XP rewards, and check in participants via QR codes.
- **Participants** can register for events, view custom timelines, and track their checked-in status.

---

## 🛠️ Tech Stack Used

- **Frontend Core:** React 18, Vite, TypeScript
- **State & Routing:** TanStack Router, React Hooks
- **Styling & UI:** Glassmorphism, CSS Custom Properties, Tailwind CSS utilities
- **Database & Backend:** Supabase (Postgres), Row-Level Security (RLS) policies, PostgreSQL views, Real-time Channels
- **Data Visualization:** Recharts (Area charts, Horizontal dual Bar charts)
- **Icons & Alerts:** Lucide React, Sonner (Toasts)

---

## ✨ Features Implemented

### 1. Organizer Console
*   **Manual Agenda Builder:** A dynamic timeline editor inside the event creation flow starting from a clean blank canvas.
*   **Live Kanban Workspace:** Task boards with category tracking (Catering, Venue, etc.) and volunteer assignment, mirrored as read-only for sponsors.
*   **Volunteer Screening:** Accept or reject volunteer applications, award XP based on performance scores.
*   **QR Check-In Scanner:** Input or paste attendee QR codes to check them in live.

### 2. Sponsor Console & Finalization Flow
*   **Contract Finalization:** An in-chat contextual action header allowing organizers to lock budget allocations and sign deals.
*   **Sponsorship ROI Analytics:** A minimalist, high-contrast business intelligence dashboard parsing the custom `sponsor_historical_roi_summary` view:
    *   *Spend Tracking Curve:* Sleek chronological area chart of capital deployed over time.
    *   *Comparative ROI Matrix:* Dual horizontal bar chart comparing Avg Cost-per-Attendee against total leads for Hackathons, Workshops, and Summits.
    *   *AI Recommendations:* Bullets offering automated investment advice using conditional logic.

### 3. Volunteer & Participant Spaces
*   **Application Workspaces:** Simple forms to declare department preferences, availabilities, and college/t-shirt size details.
*   **Interactive Event Timelines:** Viewable directly on event cards and in the active workspace tabs.

### 4. Global Profiles & Socials
*   **Unified Profile Management:** A single, centralized profile interface (`UserProfile.tsx`) shared across all 4 consoles (Organizer, Sponsor, Volunteer, Participant).
*   **Parent Table Integration:** Edit and save LinkedIn and GitHub URLs directly to the `public.profiles` parent table.
*   **Interactive Badges:** Linked profiles render as clickable anchor links with `target="_blank"` in brand-purple styling, while unlinked socials present dashed badges to immediately toggle edit mode.

---

## 📦 Setup Instructions

Follow these steps to run the project locally on your machine:

### 1. Prerequisites
Ensure you have **Node.js** (v18 or higher) and **npm** (or **yarn** / **pnpm**) installed.

### 2. Clone and Install Dependencies
Navigate to the project root and install the dependencies:
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root of the project directory and supply your Supabase credentials:
```env
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-anon-key"
```

### 4. Database Setup
Set up the tables, views, and functions in your Supabase project. In particular, ensure the following custom database view is active:
```sql
CREATE OR REPLACE VIEW public.sponsor_historical_roi_summary AS
SELECT 
    s.sponsor_id,
    s.event_id,
    e.title AS event_title,
    COALESCE(e.themes->>0, 'Hackathon') AS event_type,
    e.event_date,
    COALESCE(s.amount_allocated, 0) AS amount_allocated,
    COALESCE(s.total_spent, 0) AS total_spent,
    COALESCE(e.expected_footfall, 0) AS expected_footfall,
    CASE 
        WHEN COALESCE(e.expected_footfall, 0) > 0 THEN ROUND((COALESCE(s.amount_allocated, 0) / e.expected_footfall)::numeric, 2)
        ELSE 0 
    END AS cost_per_attendee,
    COALESCE(s.expected_calls_leads, 0) AS total_leads_generated
FROM public.sponsorships s
JOIN public.events e ON e.id = s.event_id
WHERE s.status = 'approved';
```

### 5. Running the Application
Start the local development server:
```bash
npm run dev
```
Open your browser and navigate to the port output in your terminal (typically `http://localhost:8080` or `http://localhost:5173`).

---

## 🌐 Deployment to Render

This application is configured to run on a Node.js production server. To deploy to **Render**:

1. Create a new **Web Service** on Render and connect your GitHub repository.
2. In the configuration settings, choose **Node** for the runtime environment.
3. Configure the following build and start commands:
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `node server.mjs` (or `npm start`)
4. Under **Environment Variables**, configure your environment variables from `.env` (such as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`).
5. Click **Create Web Service** to start the build and deployment process.
