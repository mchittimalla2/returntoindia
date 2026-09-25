# Return to India Financial Tracker

A local-only React/Vite application that tracks financial goals and dynamically recalculates your projected completion date.

## Current features

- Add, edit, and delete financial goals
- Track monthly cash savings, home-loan principal payments, investments, and other progress
- Enter values in INR or USD
- Editable USD/INR conversion rate
- Original target date vs current projected date
- Projected date automatically moves based on your actual average monthly progress
- Editable planning return assumption
- Local browser storage only — no database and no cloud backend
- JSON backup and restore

## Run locally

```bash
git pull
npm install
npm run dev
```

Then open the localhost URL shown by Vite, usually:

```
http://localhost:5173
```

## Data storage

Your entries are stored in browser localStorage on your laptop. Use the **Backup** button periodically to save a JSON copy.

## Important

The investment-return percentage is a planning assumption, not a guaranteed return.
