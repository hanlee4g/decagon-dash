# Decagon Case Study Dashboard

A web application for analyzing week-by-week escalation rate and CSAT metrics with comprehensive filtering capabilities. Built for [Decagon AI](https://decagon.ai/).

## Features

- **Week-by-Week Analysis**: View escalation rate and CSAT averages grouped by week
- **Trend Tracking**: See week-over-week percentage changes for both metrics
- **Comprehensive Filtering**: Filter data by any combination of:
  - Date range
  - Escalated status (Yes/No)
  - User repeat contact count
  - CSAT scores (1-5 or presence/absence)
  - Decagon Language
  - Post-signup RTR flag status
  - Sandbox status
  - User device (web/mobile)
  - Fee block state
  - Trial status
  - Language
  - Decagon admin portal status

- **Interactive Charts**: Line charts for both escalation rate and CSAT average
- **Exportable Data**: 
  - Export charts as PNG images
  - Export filtered weekly data as CSV
- **Responsive Design**: Works on desktop and mobile devices

## Quick Start

1. Clone this repository
2. Open `index.html` in a web browser, or serve via a local server:
   ```bash
   python3 -m http.server 8080
   ```
3. Navigate to `http://localhost:8080`

## Deploy to GitHub Pages

### Option 1: Deploy from Main Branch

1. Push your code to GitHub
2. Go to your repository's **Settings** > **Pages**
3. Under "Source", select **Deploy from a branch**
4. Choose `main` branch and `/ (root)` folder
5. Click **Save**
6. Your site will be available at `https://<username>.github.io/<repo-name>/`

### Option 2: Using gh-pages Branch

```bash
# Create and switch to gh-pages branch
git checkout -b gh-pages

# Push to GitHub
git push origin gh-pages
```

Then enable GitHub Pages from the `gh-pages` branch in repository settings.

## Data Format

The application expects a CSV file named `Case_Study_Data.csv` with the following columns:

| Column | Description |
|--------|-------------|
| created_at | Date in format "Day, Month DD, YYYY" |
| escalated | "Yes" or "No" |
| userId | User identifier |
| csat | CSAT score (1-5) or empty |
| decagonlanguage | Language detected by Decagon |
| is_post_signup_rtr_flagged | TRUE/FALSE or empty |
| sandbox | TRUE or empty |
| user_device | "web" or "mobile" |
| user_fee_block_state | TRUE/FALSE or empty |
| is_trial | TRUE/FALSE or empty |
| language | Browser language code |
| isdecagon_admin_portal | TRUE or empty |

## Technology Stack

- **HTML5/CSS3/JavaScript** (Vanilla JS - no framework)
- **[Chart.js](https://www.chartjs.org/)** - Interactive charts
- **[PapaParse](https://www.papaparse.com/)** - CSV parsing

## License

MIT

