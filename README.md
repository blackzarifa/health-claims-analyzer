# Health Claims Analyzer

A Vue 3 + TypeScript app that uses AI to fact-check health influencers' claims against scientific literature.

## Screenshots

![Leaderboard](/screenshots/leaderboard.png)

![Admin Panel](/screenshots/admin-panel.png)

## Features

- **Real-time Analysis**: Uses Perplexity AI to scan influencer content and extract health claims
- **Scientific Verification**: Cross-references claims with academic sources like PubMed and Google Scholar
- **Trust Scoring**: Calculates trust scores based on claim accuracy and scientific backing
- **Influencer Discovery**: Automatically finds and analyzes trending health influencers
- **Admin Panel**: Protected interface for managing analysis settings and running new scans

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **UI**: PrimeVue + Tailwind CSS
- **Backend**: Firebase (Firestore)

## Running the App

1. Clone the repo
```bash
git clone https://github.com/blackzarifa/health-claims-analyzer.git
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
# .env
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Run the dev server
```bash
pnpm dev
```

## TODO 

- Add authentication for the Admin Panel
- Add pagination for claims and influencers
- Implement claim deduplication using semantic similarity
- Add data visualization for trust score trends
