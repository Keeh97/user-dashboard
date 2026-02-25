# User Research Monitoring Dashboard

## Project Overview
An internal analytics dashboard for monitoring user research data.

**Target Users:** UX Research team, internal use only  
**Data Confidentiality:** High - all data stored locally, no cloud sync

---

## Tech Stack
- **Frontend:** React 18+ with TypeScript (.tsx)
- **Charts:** Recharts library
- **Styling:** Inline styles
- **Data Storage:** Local (future: SQLite)
- **Deployment:** Electron app

---

## Key Features

### 1. Overview Tab
- KPI cards: Overall NPS, Avg Completion Rate, Active Risk Points
- NPS trend line chart
- User segment distribution (Mass vs Premier)

### 2. Top 10 Journeys Tab
- Overall + segment breakdown (Mass, Premier only)
- Trend indicators (▲▼)
- Sortable by NPS, Completion, Drop-off

### 3. Risk Alerts Tab
- High/Medium/Low risk classification

### 4. Qualitative Findings Tab
- User feedback grouped by journey
- Types: Pain Point, Insight, Opportunity

---

## Data Model

### User Segments (2 only)
- **Mass:** 67%
- **Premier:** 33%
- **No PB segment**

---

## Color Palette
- Primary (Indigo): #6366f1 - Mass
- Success (Green): #22c55e - Premier
- Warning (Yellow): #f59e0b
- Danger (Red): #ef4444

---

## Development Guidelines
1. Never remove features unless requested
2. Keep 2 segments only (Mass, Premier)
3. Preserve trend indicators (▲▼)
4. Use "update only" for small changes

---

## Contact
- Team: UX Research
- Updated: Feb 2026
