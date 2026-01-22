# Deployment Guide - Auto Stock Analysis

## 🚀 GitHub Actions (Recommended - FREE)

Your project is already configured to run automatically every weekday morning at 8:30 AM IST!

### Setup Steps:

1. **Initialize Git Repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Stock analysis system"
   ```

2. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Create a new repository (public or private)
   - Don't initialize with README

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

4. **Enable GitHub Actions**:
   - Go to your repository on GitHub
   - Click "Actions" tab
   - GitHub Actions is enabled by default
   - Your workflow will run automatically!

### Schedule:
- **Automatic**: Every weekday at 8:30 AM IST (3:00 AM UTC)
- **Manual**: Click "Actions" → "Daily Stock Analysis" → "Run workflow"

### View Results:
1. Go to "Actions" tab in your GitHub repo
2. Click on latest workflow run
3. Download "stock-analysis-XXX" artifact for full results
4. View logs directly in GitHub

---

## 🌐 Alternative: Render.com (Also FREE)

If you prefer a web-based dashboard:

1. **Create `render.yaml`** (already included in this project)
2. Go to https://render.com
3. Sign up with GitHub
4. Create "New" → "Cron Job"
5. Connect your repository
6. Select "stock-analysis-cron"
7. It will run automatically!

---

## 🖥️ Alternative: Your Own Server/VPS

If you have a server running 24/7:

1. **Clone repository on server**:
   ```bash
   git clone YOUR_REPO_URL
   cd stock-project
   npm install
   ```

2. **Setup cron job**:
   ```bash
   crontab -e
   ```
   
   Add this line:
   ```
   0 3 * * 1-5 cd /path/to/stock-project && npm run india >> /var/log/stock-analysis.log 2>&1
   ```

---

## 📧 Get Email Notifications (Optional)

Want results emailed to you? I can add email functionality using:
- Gmail SMTP
- SendGrid (free tier)
- AWS SES (free tier)

Just let me know!

---

## 🔧 Configuration

### Change Schedule:
Edit `.github/workflows/daily-stock-analysis.yml`:

```yaml
schedule:
  # Format: 'minute hour * * day-of-week'
  - cron: '0 3 * * 1-5'  # 8:30 AM IST weekdays
```

Common times (in UTC, subtract 5:30 for IST):
- `30 2 * * 1-5` - 8:00 AM IST
- `0 3 * * 1-5` - 8:30 AM IST (current)
- `30 3 * * 1-5` - 9:00 AM IST

### Run Both Markets:
Edit the workflow file to add US market analysis:
```yaml
- name: Run US Stock Analysis
  run: npm start
```

---

## ✅ What Happens Automatically:

1. **Every weekday at 8:30 AM IST**:
   - GitHub Actions wakes up
   - Installs dependencies
   - Runs Indian stock analysis
   - Checks trading conditions
   - Saves results as downloadable artifact

2. **You get**:
   - Analysis logs you can view online
   - Downloadable results (kept for 30 days)
   - Email notifications on failures
   - Complete trading recommendations

3. **Cost**: $0.00 (GitHub Actions is free for public repos, 2000 min/month for private)

---

## 🆘 Troubleshooting

**Workflow not running?**
- Check if schedule is correct (GitHub uses UTC)
- Ensure Actions are enabled in repo settings
- Manually trigger to test: Actions → Run workflow

**Want to test now?**
```bash
# Local test
npm run india

# Or trigger GitHub workflow manually
# Go to Actions tab → Daily Stock Analysis → Run workflow
```
