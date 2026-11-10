# SolarVerseAI

Intelligent solar platform for homes and plants. Plan rooftop solar,
estimate savings, and monitor solar plants in one place.

Built by [Subham Chakraborty].

## Features

**For homeowners**
- Solar potential and system planner
- Savings and ROI calculator
- Battery planner
- Energy forecast and environmental impact
- Saved reports

**For plant operators**
- Plant monitoring
- Fault detection
- Generation forecasting
- Soiling analytics
- Predictive maintenance

> Note: some modules currently use demo / sample data.
> Forecasts and health scores are estimates.

## Tech stack

- TanStack Start, React 19, TypeScript
- Tailwind CSS 4, shadcn/ui, Recharts
- Supabase (database and authentication)

## Getting started

```sh
git clone https://github.com/SubhamC-gif/screenshot-match.git
cd screenshot-match
bun install
bun run dev
```

Create a `.env` file in the project root with your Supabase keys.
Never commit this file.

## Scripts

```sh
bun run dev     # start the dev server
npm run dev     # start the dev server
bun run build   # production build
bun run lint    # lint the code
bun run test    # run tests
```