# Donation Kiosk (WebView)

Portrait donation UI for **Unity kiosk WebView** (design target: **2160 × 3840**). Shell chrome (logo, date, home/back) lives in Unity — this app renders **body content only**. Built with React, TypeScript, CSS, TanStack Query, and Zustand.

## Stack

- **React 19** + **TypeScript** (Vite)
- **@tanstack/react-query** — campaigns, payment history, outfits
- **Zustand** — donation flow state (campaign, amount, payment, message)
- **React Router** — multi-step navigation
- **CSS** — component-scoped styles, design tokens in `src/styles/variables.css`

## Kiosk scaling

The UI is laid out at **1080 × 1920** (half of 2160 × 3840) inside `KioskShell`, then scaled with CSS `transform: scale()` to fit any viewport while keeping the 9:16 aspect ratio.

## Pages

| Route | Screen |
|-------|--------|
| `/` | Select donation field (campaigns) |
| `/campaigns` | Redirects to `/` |
| `/amount` | Amount + one-time / regular toggle |
| `/payment` | Card / Kakao / Naver pay |
| `/message` | Message + name + on-screen keyboard |
| `/thank-you` | Confirmation |

## Run

```bash
npm install
npm run dev
```

Open the dev URL and resize the browser to a tall aspect ratio (9:16) to preview kiosk layout.

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  api/          # API clients + React Query data sources
  components/   # Reusable UI (Header, CampaignCard, etc.)
  pages/        # Route screens
  store/        # Zustand donation store
  styles/       # CSS variables
```

## API

| Endpoint | Usage |
|----------|--------|
| `GET /api/donations/campaigns?pageNum&pageSize` | Campaign list |
| `GET /api/donations/payment/history?pageNum&pageSize&keyword` | Wall of Givers |
| `POST http://127.0.0.1:8080/api/donations/payments` | Kiosk payment (`PaymentPage`) — set `VITE_PAYMENT_API_BASE_URL` |
| `POST /api/donations/payment` | Save donation from certificate page (before wall) |
| `GET /api/donations/outfits?pageNum&pageSize` | Outfit selection |

Flow data is kept in **Zustand** and mirrored to **`sessionStorage`** so steps survive refresh. On the certificate page, **계속** POSTs photo, name, message, campaign, amount, and payment method, then opens the wall (which reads payment history from the API).

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to your backend origin, or leave empty and use the Vite dev proxy (`VITE_API_PROXY_TARGET`, default `http://localhost:8080`).
