# P'Som (พี่แกงส้ม) Booking System - Project Guidelines

## 🎯 Primary Goal
Your mission is to build a "Zero-Friction" automated booking system for พี่แกงส้ม (P'Som). 
- **Success Metric:** A user should be able to book and pay in under 3 clicks once the LIFF app opens.
- **Identity Goal:** Never implement manual login. Use the LIFF SDK to treat the LINE `userId` as the "Source of Truth" for all user data and bookings.
- **Professionalism:** Every completed booking must trigger a high-quality LINE Flex Message receipt to the user.

## 🛠 Tech Stack (2026 Standard)
- **Framework:** Next.js 16+ (App Router).
- **LIFF SDK:** `@line/liff` v2.27+ (CDN: `https://static.line-scdn.net/liff/edge/2/sdk.js`).
- **Database:** Prisma + PostgreSQL.
- **Deployment:** Vercel (Required for HTTPS).
- **Payments:** Beam Checkout (API v2026).

## 🔑 Identity & Auth
- **LIFF ID:** 2009468965-EGRhMQlZ
- **Procedure:** `liff.init()` -> Check `liff.isLoggedIn()` -> `liff.getProfile()`.
- **Constraint:** If the user is not in a LINE browser, provide a "Open in LINE" deep link.

## 📱 2026 UI/UX Requirements
- **Android Edge-to-Edge:** LINE for Android (v16.0+) enforces edge-to-edge display.
  - **REQUIRED:** All bottom-fixed elements must use `padding-bottom: env(safe-area-inset-bottom)`.
- **Viewport:** Metadata must include `viewport-fit=cover`.
- **Loading:** Use a branded skeleton screen while the LIFF handshake initializes.

## 📋 Logic & Workflows
1. **Booking:** Atomic transactions to prevent double-booking.
2. **Buffer:** Automatically enforce a 15-minute buffer between slots.
3. **Timezone:** Everything is `Asia/Bangkok` (UTC+7).
4. **Payment:** Create a `PENDING` booking -> Generate Beam Payment Link -> Redirect -> Confirm via Webhook.

## ⌨️ Development Commands
- `npm run dev` - Start development server
- `npx prisma db push` - Sync schema to DB
- `npm run build` - Vercel production build