# 🪐 Jyotish Darshan — AI Vedic Kundli App

A full-stack Vedic astrology birth chart app built with **Next.js 15 + TypeScript**, powered by **Claude AI** for personalized chart interpretations.

---

## ✨ Features

- **Vedic Birth Chart Calculation** — Lagna, all 9 planets (Sun through Ketu) with Lahiri Ayanamsa correction
- **North Indian Style Chart** — Classic diamond grid SVG rendering
- **Planetary Details** — Sign, degree, nakshatra, pada, retrograde, combust, exaltation status
- **Yoga Detection** — Gajakesari, Budhaditya, Panch Mahapurusha yogas and more
- **Vimshottari Dasha** — Full 120-year dasha sequence with antardasha breakdown
- **Claude AI Streaming** — Real-time streaming interpretations for:
  - Full Chart Reading
  - Personality & Temperament
  - Career & Dharma
  - Relationships & Marriage
  - Health & Constitution
  - Vedic Remedies (gemstones, mantras, dana)

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd kundli-app
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Get a Claude API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Paste it into the app's API key field — it's stored only in `sessionStorage`, never sent anywhere except directly to Anthropic's API

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── interpret/
│   │       └── route.ts        # Streaming Claude API endpoint
│   ├── globals.css             # Mystical theme + Tailwind
│   ├── layout.tsx
│   └── page.tsx                # Main app page
├── components/
│   ├── BirthForm.tsx           # Birth details input form
│   ├── KundliChart.tsx         # North Indian SVG chart
│   ├── PlanetTable.tsx         # Planetary positions table
│   ├── DashaTimeline.tsx       # Vimshottari dasha with progress
│   ├── InterpretationPanel.tsx # Claude AI streaming panel
│   └── YogaCards.tsx           # Detected yoga cards
├── lib/
│   └── astro.ts                # Vedic astronomy calculation engine
└── types/
    └── index.ts                # All TypeScript types
```

---

## 🔭 Astronomy Engine

The `src/lib/astro.ts` module implements:

- **Julian Day conversion** with timezone handling
- **Lahiri Ayanamsa** (Sidereal correction, ~23.85° + drift)
- **Tropical planetary longitudes** using simplified VSOP87 orbital elements
- **Ascendant (Lagna)** calculation using GMST + local sidereal time
- **Retrograde detection** via 24h position differential
- **Combust detection** with per-planet orb values
- **Nakshatra & Pada** calculation (27 nakshatras × 4 padas)
- **Vimshottari Dasha** from Moon's nakshatra lord with antardasha
- **Yoga detection** — 8 classical yogas

> **Accuracy note:** Uses ~1° precision orbital formulas. For production use, integrate the [Swiss Ephemeris](https://www.astro.com/swisseph/) via the `swisseph` npm package for arc-minute precision.

---

## 🛠️ Upgrading Accuracy

To use Swiss Ephemeris for precise positions:

```bash
npm install swisseph
```

Then replace the `tropicalLongitude()` function in `astro.ts`:

```typescript
import swisseph from 'swisseph';

function tropicalLongitude(key: PlanetKey, jd: number): number {
  const PLANET_IDS: Record<PlanetKey, number> = {
    su: swisseph.SE_SUN, mo: swisseph.SE_MOON,
    ma: swisseph.SE_MARS, me: swisseph.SE_MERCURY,
    ju: swisseph.SE_JUPITER, ve: swisseph.SE_VENUS,
    sa: swisseph.SE_SATURN, ra: swisseph.SE_MEAN_NODE,
    ke: swisseph.SE_MEAN_NODE, // Ketu = Rahu + 180°
  };
  const result = swisseph.swe_calc_ut(jd, PLANET_IDS[key], swisseph.SEFLG_SWIEPH);
  let lon = result.longitude;
  if (key === 'ke') lon = (lon + 180) % 360;
  return lon;
}
```

---

## 🌐 Adding Geocoding

Auto-fill lat/lon from city name using a geocoding API:

```typescript
// In BirthForm.tsx, add after city input:
async function geocodeCity(city: string) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`
  );
  const [result] = await res.json();
  if (result) {
    set("lat", parseFloat(result.lat));
    set("lon", parseFloat(result.lon));
  }
}
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.6 |
| Styling | Tailwind CSS + Custom CSS |
| AI | Claude claude-sonnet-4-20250514 (Streaming) |
| SDK | @anthropic-ai/sdk |
| Fonts | Cinzel Decorative + Crimson Pro |
| Deployment | Vercel (recommended) |

---

## 🚀 Deploy to Vercel

```bash
npm i -g vercel
vercel
```

No environment variables required — users provide their own API key in the UI.

---

## 📜 License

MIT — build freely, interpret wisely.

> *"The stars incline, they do not compel."*
