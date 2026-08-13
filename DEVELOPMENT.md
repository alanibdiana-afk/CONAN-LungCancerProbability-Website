# CONAN – Development Documentation

**AI-Assisted Lung Cancer Risk Screening Tool**
Project: Bulan National High School

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Languages Used](#2-languages-used)
3. [Frameworks & Libraries](#3-frameworks--libraries)
4. [Project Structure](#4-project-structure)
5. [How the App Was Built – Step by Step](#5-how-the-app-was-built--step-by-step)
6. [Core Modules Explained](#6-core-modules-explained)
7. [Prediction Algorithm](#7-prediction-algorithm)
8. [State Management](#8-state-management)
9. [Routing & Pages](#9-routing--pages)
10. [Styling System](#10-styling-system)
11. [Data Storage](#11-data-storage)
12. [Development Tools](#12-development-tools)
13. [Build & Deployment](#13-build--deployment)

---

## 1. Project Overview

CONAN (lung cancer risk screening tool) is a web application that lets users assess their lung cancer risk in three ways:

- **Symptom-based** — 13 clinical risk factors answered as YES/NO
- **Imaging-based** — upload a chest X-ray for automated analysis
- **Combined** — both symptom and imaging inputs fused into one result

The app runs entirely in the browser. No health data is sent to any external server. All predictions are computed locally using a logistic regression model and a hash-based imaging analysis.

---

## 2. Languages Used

| Language | Purpose |
|----------|---------|
| **TypeScript** | Main programming language for all logic and components |
| **TSX (TypeScript + JSX)** | Writing React UI components with type safety |
| **CSS** | Global styles and Tailwind utility classes |
| **JSON** | Configuration files (package.json, tsconfig.json) |
| **Markdown** | Documentation files |

### Why TypeScript?

TypeScript was chosen over plain JavaScript because it catches errors at compile time rather than at runtime. For example, the prediction functions have strictly typed inputs and outputs — if a component passes the wrong data shape to `predictFromSymptoms()`, TypeScript will flag it before the app even runs.

---

## 3. Frameworks & Libraries

### Core Framework

**Next.js 16** — The backbone of the app. Next.js is a React framework that handles routing, server-side rendering, and project structure automatically. This project uses the **App Router** pattern introduced in Next.js 13+.

- Each folder inside `app/` automatically becomes a URL route
- The `layout.tsx` file wraps every page with a shared shell
- Turbopack (Next.js's fast bundler) is used in development for near-instant hot reload

**React 19** — The UI library. All visible elements are built as React components — reusable, self-contained building blocks that manage their own state and render HTML.

### Styling

**TailwindCSS 4** — A utility-first CSS framework. Instead of writing separate `.css` files, styles are applied directly in the component using class names like `bg-white`, `text-slate-700`, `rounded-2xl`, `flex`, `gap-4`. This keeps styles co-located with the component they affect.

### UI Components & Icons

**Lucide React** — Icon library. All icons in the app (sidebar icons, form icons, header buttons) come from this library. Icons are imported as individual React components, e.g. `<Settings className="w-5 h-5" />`.

**Radix UI** — A set of unstyled, accessible UI primitives used for interactive elements like:
- `@radix-ui/react-accordion` — Expandable sections
- `@radix-ui/react-dialog` — Modal dialogs
- `@radix-ui/react-progress` — Progress bars
- `@radix-ui/react-slider` — Sliders
- `@radix-ui/react-switch` — Toggle switches
- `@radix-ui/react-tabs` — Tab navigation
- `@radix-ui/react-tooltip` — Hover tooltips

### Charts

**Recharts 3** — Used in the Dashboard to render charts (pie chart for risk distribution, bar chart for confidence scores, line chart for risk trend over time). Built on top of D3.js but with a React-friendly API.

### File Upload

**React Dropzone 15** — Powers the drag-and-drop X-ray image upload on the Imaging and Combined assessment pages.

### Utility Libraries

| Library | Use |
|---------|-----|
| `clsx` | Conditionally joining CSS class names |
| `tailwind-merge` | Merging Tailwind classes without conflicts |
| `class-variance-authority` | Creating variant-based component styles |

### Fonts

**Geist** (via `next/font/google`) — The primary typeface. Loaded via Next.js's built-in font optimization which avoids layout shift by preloading the font.

---

## 4. Project Structure

```
conan-app/
│
├── app/                        # Next.js App Router — each folder = one page
│   ├── layout.tsx              # Root layout wrapping all pages
│   ├── page.tsx                # Home page (/)
│   ├── about/page.tsx          # About the model (/about)
│   ├── combined/page.tsx       # Combined assessment (/combined)
│   ├── dashboard/page.tsx      # User dashboard (/dashboard)
│   ├── imaging/page.tsx        # X-ray analysis (/imaging)
│   ├── login/page.tsx          # Login/register (/login)
│   ├── manual/page.tsx         # User manual (/manual)
│   ├── privacy/page.tsx        # Privacy policy (/privacy)
│   ├── results/page.tsx        # Results viewer (/results)
│   ├── settings/page.tsx       # Settings (/settings)
│   ├── symptoms/page.tsx       # Symptom assessment (/symptoms)
│   └── terms/page.tsx          # Terms & conditions (/terms)
│
├── components/                 # Reusable React components
│   ├── AppShell.tsx            # Shared layout (sidebar + header + content area)
│   ├── Header.tsx              # Top navigation bar
│   ├── Sidebar.tsx             # Left navigation menu
│   ├── HomeContent.tsx         # Home page body
│   ├── SymptomsForm.tsx        # 13-factor symptom form
│   ├── ImagingForm.tsx         # X-ray upload form
│   ├── CombinedForm.tsx        # Combined assessment form
│   ├── ResultsContent.tsx      # Risk result display
│   ├── DashboardContent.tsx    # Charts and history
│   ├── AboutContent.tsx        # Model methodology page
│   ├── ManualContent.tsx       # User manual page
│   ├── SettingsContent.tsx     # Settings page
│   ├── LoginContent.tsx        # Login/register form
│   ├── PrivacyContent.tsx      # Privacy policy page
│   ├── TermsContent.tsx        # Terms page
│   ├── ConfidenceBar.tsx       # Animated confidence percentage bar
│   ├── RiskBadge.tsx           # Low/Moderate/High colored badge
│   ├── OfflineBanner.tsx       # Offline connectivity warning
│   └── PrivacyModal.tsx        # First-visit privacy consent popup
│
├── lib/                        # Business logic and utilities
│   ├── prediction.ts           # Logistic regression prediction engine
│   ├── context.tsx             # Global React Context (app-wide state)
│   ├── types.ts                # TypeScript type definitions
│   └── utils.ts                # Helper functions (cn() for class merging)
│
├── public/                     # Static files served as-is
│   └── logo.png
│
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript compiler configuration
├── postcss.config.mjs          # PostCSS config (required by TailwindCSS)
├── eslint.config.mjs           # ESLint linting rules
├── package.json                # Dependencies and scripts
└── package-lock.json           # Locked dependency versions
```

---

## 5. How the App Was Built – Step by Step

### Step 1 — Project Initialization

The project was bootstrapped using:

```bash
npx create-next-app@latest conan-app --typescript --tailwind --app
```

This command:
- Creates the folder structure
- Installs Next.js, React, TypeScript, and TailwindCSS automatically
- Sets up the App Router convention

### Step 2 — Define the Data Types

Before any UI was built, all data shapes were defined in `lib/types.ts`. This includes:

- `SymptomFormData` — the 13 YES/NO toggles
- `PredictionResult` — what comes out of the prediction engine (risk level, confidence, factors)
- `User` — account info and saved result history
- `AppSettings` — font size, contrast mode, privacy consent
- `RiskLevel` — a union type: `"low" | "moderate" | "high"`

Starting with types ensures every component and function agrees on the shape of data before any logic is written.

### Step 3 — Build the Prediction Engine

`lib/prediction.ts` was written as pure functions with no UI dependency:

1. **`predictFromSymptoms(data)`** — takes the 13 booleans, runs logistic regression, returns a `PredictionResult`
2. **`predictFromImaging(imageName)`** — takes an image filename, returns a hash-based `PredictionResult`
3. **`predictCombined(symptoms, imageName)`** — calls both above functions and fuses their results with a 50/50 weight

These functions are stateless — they take inputs and return outputs, making them easy to test and reason about independently.

### Step 4 — Set Up Global State with React Context

`lib/context.tsx` creates an `AppContext` that holds all shared state:

- Current user (or null if not logged in)
- App settings (font size, contrast, privacy consent)
- Sidebar open/closed state
- Modal visibility (privacy modal, disclaimer modal)
- Online/offline status

The `AppProvider` component wraps the entire app in `layout.tsx`. Any component nested inside it can call `useApp()` to read or update global state — no need to pass props through every layer.

LocalStorage is used to persist settings and user data between browser sessions. On mount, the context reads from localStorage and hydrates the state.

### Step 5 — Build the Layout System

`components/AppShell.tsx` defines the shared page shell:
- Left sidebar (collapsible on mobile)
- Top header
- Main content area with scrolling

`app/layout.tsx` renders this shell around every page by wrapping `children` inside `AppProvider`.

### Step 6 — Build Each Page

Each route in `app/` is a simple page component that renders a corresponding content component from `components/`. For example:

```
app/symptoms/page.tsx  →  renders  <SymptomsForm />
app/results/page.tsx   →  renders  <ResultsContent />
app/dashboard/page.tsx →  renders  <DashboardContent />
```

This separation keeps the route file thin and puts all logic and UI in the component.

### Step 7 — Build the Forms

`SymptomsForm.tsx` — a 13-toggle form that tracks each factor as a boolean in local `useState`. On submit, it calls `predictFromSymptoms()` and stores the result in the global context via `saveResult()`.

`ImagingForm.tsx` — uses React Dropzone to accept a dropped or selected image file. It calls `predictFromImaging()` using the filename and stores the result.

`CombinedForm.tsx` — a two-step form: first the symptom toggles, then the image upload. On submit it calls `predictCombined()`.

### Step 8 — Build the Results Display

`ResultsContent.tsx` reads the latest `PredictionResult` from context and renders:
- A `RiskBadge` showing Low / Moderate / High
- A `ConfidenceBar` animating to the confidence percentage
- A factor breakdown list sorted by impact level
- A clinical summary paragraph
- Resource links for next steps

### Step 9 — Build the Dashboard

`DashboardContent.tsx` reads the user's saved results array and renders:
- Pie chart (Recharts) for risk distribution
- Bar chart for confidence scores over time
- Line chart for risk trend
- A history table with each saved result

### Step 10 — Accessibility and Settings

`SettingsContent.tsx` exposes:
- Font size selector (small / normal / large) — updates `document.documentElement.style.fontSize`
- High contrast toggle — injects a `<style>` tag with CSS overrides when enabled
- Privacy consent status and links
- Account management and data deletion

### Step 11 — Privacy and Legal Pages

`PrivacyModal.tsx` is shown on first visit if privacy has not been consented to. The user cannot dismiss it without either accepting or navigating to the full privacy policy. Consent is stored in localStorage.

---

## 6. Core Modules Explained

### `lib/types.ts`

The single source of truth for all data shapes. TypeScript enforces these shapes across the entire codebase. If a function expects a `PredictionResult` and receives something missing the `confidence` field, the compiler will show an error before the code runs.

### `lib/prediction.ts`

Contains three exported prediction functions. No external API calls — everything runs in the browser. The logistic regression coefficients (β values) are hardcoded constants derived from clinical literature weighting.

### `lib/context.tsx`

Implements the React Context + Provider pattern. The `AppProvider` component holds all state and exposes it through `useApp()`. Components subscribe only to what they need and re-render only when relevant state changes.

### `lib/utils.ts`

Exports a single `cn()` utility function that merges Tailwind class names correctly. Uses `clsx` for conditional classes and `tailwind-merge` to resolve conflicts (e.g., if two classes set the same CSS property, the last one wins instead of both being applied confusingly).

---

## 7. Prediction Algorithm

### Symptom Model — Logistic Regression

The standard logistic regression formula used in clinical prediction:

```
Z = β₀ + (β₁×x₁) + (β₂×x₂) + ... + (β₁₃×x₁₃)
P = 1 / (1 + e^(-Z))
```

Where:
- `β₀ = -4.2` is the intercept (baseline log-odds with no risk factors)
- Each `βᵢ` is the coefficient for a risk factor (higher = stronger predictor)
- Each `xᵢ` is `1` if the factor is present, `0` if not
- `P` is the resulting probability between 0 and 1

**Risk thresholds:**
- `P < 0.35` → Low
- `0.35 ≤ P < 0.65` → Moderate
- `P ≥ 0.65` → High

**Top coefficients (strongest predictors):**

| Risk Factor | β Coefficient |
|-------------|--------------|
| Smoking History | 1.85 |
| Persistent Coughing | 1.42 |
| Chest Pain | 1.28 |
| Shortness of Breath | 1.15 |
| Wheezing | 1.10 |

### Imaging Model — Hash-Based Analysis

Since no real ML model is deployed server-side, imaging analysis uses a deterministic hash of the uploaded filename:

```
hash = sum of ASCII values of all characters in the filename
normalized = (hash % 100) / 100
```

This produces a consistent 0–1 score for any given filename, then classifies it into Low / Moderate / High using fixed thresholds (< 0.33, < 0.66, ≥ 0.66).

### Combined Model — Weighted Fusion

Risk levels are mapped to numbers (Low=0, Moderate=1, High=2), averaged with 50/50 weighting, then mapped back to a risk level:

```
combinedScore = (symptomRisk × 0.5) + (imagingRisk × 0.5)

< 0.5   → Low
< 1.25  → Moderate
≥ 1.25  → High
```

Confidence is the arithmetic mean of both individual confidence scores.

---

## 8. State Management

The app uses **React Context** (built into React, no third-party library needed) for global state.

**Why not Redux or Zustand?**
The app's state is relatively simple — one user object, one settings object, and a few UI flags. React Context is sufficient and avoids adding another dependency.

**Pattern used:**
```
AppContext (context.tsx)
    └── AppProvider (wraps all pages in layout.tsx)
            └── useApp() hook (used by any component that needs global state)
```

Local UI state (form inputs, toggle states, loading flags) is managed with `useState` inside each component — only state that needs to be shared across pages lives in the context.

---

## 9. Routing & Pages

Next.js App Router is used. Routing is **file-system based** — creating a folder with a `page.tsx` file automatically creates a route.

| File | Route |
|------|-------|
| `app/page.tsx` | `/` |
| `app/symptoms/page.tsx` | `/symptoms` |
| `app/imaging/page.tsx` | `/imaging` |
| `app/combined/page.tsx` | `/combined` |
| `app/results/page.tsx` | `/results` |
| `app/dashboard/page.tsx` | `/dashboard` |
| `app/settings/page.tsx` | `/settings` |
| `app/about/page.tsx` | `/about` |
| `app/manual/page.tsx` | `/manual` |
| `app/login/page.tsx` | `/login` |
| `app/privacy/page.tsx` | `/privacy` |
| `app/terms/page.tsx` | `/terms` |

Navigation between pages uses Next.js's `<Link>` component (for client-side navigation without full page reload) and `useRouter()` hook (for programmatic navigation after form submission).

---

## 10. Styling System

**TailwindCSS** is the only styling system used. There are no separate `.css` files per component (except `globals.css` for base resets and font variable setup).

### How it works

Tailwind scans all files for class names at build time and generates a CSS file containing only the classes that are actually used. This keeps the final CSS bundle small.

### High Contrast Mode

When the user enables High Contrast in Settings, the app injects a `<style>` tag at runtime that overrides Tailwind's default colors with a dark-mode-style palette (black backgrounds, white text, bright accent colors). This is done in `context.tsx` using `document.createElement("style")`.

### Responsive Design

Tailwind's responsive prefixes are used throughout:
- `md:` — applies style on medium screens and up
- `lg:` — applies on large screens

The sidebar is hidden on mobile and shown as an overlay when the hamburger menu is tapped.

---

## 11. Data Storage

No external database. Everything uses the browser's **localStorage** API.

| Key | Contents |
|-----|----------|
| `conan_settings` | JSON object with fontSize, contrastMode, privacyConsented |
| `conan_user` | JSON object with user name, email, and up to 20 saved results |

**Persistence behavior:**
- Settings and user data survive page refresh and browser close
- Data is deleted when the user clicks "Delete All Data" in Settings, or clears browser data manually
- X-ray images are never stored — only the filename is used for hash calculation

---

## 12. Development Tools

| Tool | Purpose |
|------|---------|
| **VS Code / Kiro** | Code editor |
| **ESLint** | Linting — catches code quality issues |
| **TypeScript compiler** | Type checking |
| **Turbopack** | Development bundler (via `next dev`) — fast hot module replacement |
| **Git** | Version control |
| **GitHub** | Remote repository hosting |
| **npm** | Package manager |

### Key npm Scripts

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Compile and optimize for production
npm run start    # Start production server (after build)
npm run lint     # Run ESLint checks
```

---

## 13. Build & Deployment

### Development Build

```bash
npm run dev
```

Starts the Next.js development server with Turbopack. Changes to any file are reflected in the browser almost instantly without a full page reload (Hot Module Replacement).

### Production Build

```bash
npm run build
npm run start
```

`npm run build` compiles TypeScript, bundles all JavaScript, tree-shakes unused code, optimizes images, and generates static HTML for routes that don't need server-side data. The output goes into the `.next/` folder.

`npm run start` serves that compiled output.

### Deployment Options

The app can be deployed to any platform that supports Node.js:

- **Vercel** (recommended — built by the Next.js team, zero-config deployment)
- **Netlify**
- **Railway**
- **Self-hosted** on any VPS with Node.js installed

---

## Summary

| Category | Choice | Reason |
|----------|--------|--------|
| Language | TypeScript | Type safety, fewer runtime bugs |
| Framework | Next.js 16 | File-based routing, React ecosystem, fast dev server |
| UI Library | React 19 | Component model, large ecosystem |
| Styling | TailwindCSS 4 | Fast to write, co-located styles, small output |
| State | React Context | Simple enough for this app, no extra dependencies |
| Charts | Recharts | React-native API, easy to customize |
| Icons | Lucide React | Clean, consistent icon set |
| Storage | localStorage | No backend needed, fully offline-capable |
| Prediction | Logistic Regression (in-browser) | Transparent, fast, no server round-trip |

---

*Developed by Crisvin B. Habitsuela — Bulan National High School, 2026*
