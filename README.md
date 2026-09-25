# Return to India Financial Tracker

A private, local-first financial goal tracker. The UI runs in React/Vite and a tiny local Node/Express service automatically saves the full plan to a JSON file on your laptop.

## Automatic storage

Every application change is saved automatically to:

```
data/financial-data.json
```

This includes adding/deleting transactions, changing goals, changing targets, exchange rate, planning assumptions, and settings.

Before replacing the current file, the local service writes the previous version into:

```
backups/
```

Personal JSON files are excluded from Git by `.gitignore`, so your financial data is not pushed to GitHub.

Browser localStorage is retained only as a fallback.

## Run locally

After pulling a new version:

```bash
git pull
npm install
npm run dev
```

One command starts both the local JSON service and Vite. Open the localhost URL shown by Vite, normally:

```
http://localhost:5173
```

The terminal will also show the exact path of your local financial-data.json file.

## Manual backup

The application's Backup button still downloads a portable JSON copy. Restore can import one into the app; after import it is also written to the local data file.

## Important

Investment-return percentages and projected completion dates are planning estimates, not guaranteed returns or outcomes.
