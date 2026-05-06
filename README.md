# 💰 LoanTrackr — Smart Loan Management

<div align="center">

![LoanTrackr](https://img.shields.io/badge/LoanTrackr-v1.0.0-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzYjgyZjYiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTEyIDJMNi4yIDcuOGwtNC4yLTEuNEwxMiAyMmwxMC0xNS42LTQuMiAxLjRMMTIgMnoiLz48L3N2Zz4=)
![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A professional, full-stack loan tracking application for managing multiple loans across lending apps like MoneyView, True Balance, Stucred, mpokket, Fibe, and more.**

[Features](#-features) · [Demo](#-screenshots) · [Quick Start](#-quick-start) · [API Docs](#-api-endpoints) · [Contributing](#-contributing)

</div>

---

## 🎯 Why LoanTrackr?

Managing loans across multiple lending apps is chaotic — different EMI dates, varying interest rates, and no single view of your total liability. **LoanTrackr** solves this by giving you:

- **One dashboard** to track all your loans
- **Smart comparisons** to find the best lending app
- **EMI reminders** so you never miss a payment
- **Visual analytics** to understand your debt at a glance

---

## ✨ Features

### 🔐 Secure Authentication
- **Login** with User ID & Password
- **Remember Me** — stay logged in for 30 days
- **Signup** with full validation (First Name, Last Name, Mobile, Email, User ID, Password)
- **Real-time User ID availability** check with debounced API calls
- **Strong password policy** — minimum 12 characters with uppercase, lowercase, numbers, and special characters
- **Visual password strength meter** — Weak → Fair → Strong → Very Strong
- **Password confirmation** — real-time match check with red border + shake animation on mismatch
- **OTP email verification** — SendGrid integration with console fallback for development
- **Rate limiting** — prevents brute force attacks on auth endpoints
- **JWT tokens** — secure, stateless session management

### 📊 Smart Dashboard
- **Total Loan Amount** — displayed prominently in large numbers
- **Remaining Amount** — how much you still owe
- **Percentage Paid** — circular animated progress ring
- **Active Loans** section — with progress bars and next EMI dates
- **Closed Loans** section — archived completed loans

### 📈 Visual Analytics & Comparisons
- **Interest Rate Comparison** — bar chart comparing rates across all your lending apps
- **Loan Distribution** — donut chart showing how your debt is split across apps
- **Best Deal Recommendation** — algorithm scores apps on interest rate, disbursement ratio, and extra costs
- **Per-app statistics** — total loans, average interest, disbursement ratio, extra cost percentage

### 💳 Loan Management
- **Add loans** from 10+ pre-loaded apps or add custom app names
- **Auto-calculate EMI** — enter amount, interest rate, and tenure; EMI & total payable auto-compute
- **Track every detail** — loan amount, disbursed amount, interest rate, tenure, EMI, start date, extra charges
- **Edit & Delete** loans anytime
- **Close loans** — mark as fully paid and move to closed section
- **Record EMI payments** — track each payment with date, amount, and late fees
- **Next EMI date** — auto-calculated with urgency indicators (green/yellow/red)
- **Multi-currency** — supports INR (₹), USD ($), EUR (€), GBP (£), JPY (¥), AUD, CAD

### 🎨 Premium Design
- **Dark mode** with glassmorphism UI
- **Animated background** with floating gradient orbs
- **Inter + JetBrains Mono** typography (Google Fonts)
- **Micro-animations** — fade-in, slide, scale, shake, progress fill
- **Fully responsive** — works on desktop, tablet, and mobile
- **App-specific color coding** — each lending app gets a unique color
- **Gradient buttons** with hover glow effects

---

## 📸 Screenshots

### Login Page
> Dark glassmorphism login with gradient CTA button, eye toggle for password, and Remember Me checkbox.

### Signup Form
> Full validation: green border on available User ID (✓), password strength meter showing "Very Strong" with all 5 checks passing, real-time password match verification.

### OTP Verification
> 6-digit code input with auto-focus, paste support, 60-second resend countdown timer.

### Dashboard
> Hero stats (₹50,000 total, ₹54,155 remaining, 0% paid), Best Deal recommendation, Interest Rate bar chart, Loan Distribution donut chart, Active Loan cards with progress bars.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | Fast, component-based UI with HMR |
| **Styling** | Vanilla CSS + CSS Variables | Full control, no framework lock-in |
| **Backend** | Node.js + Express | RESTful API server |
| **Database** | SQLite (sql.js) | Zero-config, portable, file-based |
| **Auth** | JWT + bcryptjs | Stateless sessions, secure password hashing |
| **Validation** | Zod | Type-safe schema validation (server + client) |
| **Charts** | Recharts | React-native charting library |
| **Icons** | Lucide React | Beautiful, consistent icon set |
| **Email** | SendGrid | OTP email delivery (with console fallback) |
| **Notifications** | React Hot Toast | Elegant toast notifications |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18 or higher
- **npm** v9 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/loan-trackr.git
cd loan-trackr

# Install all dependencies (root + server + client)
npm run install:all

# Set up environment variables
cp .env.example .env
# Edit .env with your settings (optional for dev)

# Start development servers
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `JWT_SECRET` | `dev-secret` | JWT signing secret (change in production!) |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL for CORS |
| `SENDGRID_API_KEY` | *(empty)* | SendGrid API key for OTP emails |
| `FROM_EMAIL` | `noreply@loantrackr.app` | Sender email for OTPs |

> **Note**: Without a SendGrid API key, OTPs are printed to the server console. Perfect for development!

---

## 📡 API Endpoints

### Authentication (No auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Register a new user |
| `POST` | `/api/auth/login` | Login with credentials |
| `POST` | `/api/auth/verify-otp` | Verify email OTP |
| `POST` | `/api/auth/resend-otp` | Resend OTP to email |
| `GET` | `/api/auth/check-userid/:id` | Check User ID availability |

### Loans (Auth required — Bearer token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/loans` | Get all user's loans |
| `POST` | `/api/loans` | Add a new loan |
| `PUT` | `/api/loans/:id` | Update a loan |
| `DELETE` | `/api/loans/:id` | Delete a loan |
| `PATCH` | `/api/loans/:id/close` | Mark loan as closed |
| `POST` | `/api/loans/:id/payment` | Record an EMI payment |
| `GET` | `/api/loans/:id/payments` | Get payment history |
| `GET` | `/api/loans/meta/apps` | Get available app names |

### Analytics (Auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/summary` | Dashboard summary stats |
| `GET` | `/api/analytics/comparison` | Loan app comparison data |

### User (Auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/profile` | Get user profile |
| `PUT` | `/api/user/profile` | Update profile |

---

## 📁 Project Structure

```
loan-trackr/
├── client/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── context/            # AuthContext (session management)
│   │   ├── pages/              # AuthPage, DashboardPage
│   │   ├── services/           # API client & service layer
│   │   ├── styles/             # Design system (variables, global, animations)
│   │   └── utils/              # Validators, formatters
│   ├── index.html              # Entry HTML with Google Fonts
│   └── vite.config.js          # Vite config with API proxy
├── server/                     # Express Backend
│   ├── config/                 # Database initialization
│   ├── controllers/            # Business logic
│   ├── middleware/             # Auth (JWT) & validation (Zod)
│   ├── routes/                 # API route definitions
│   ├── utils/                  # JWT, OTP, Email helpers
│   └── server.js               # Entry point
├── .env.example                # Environment variable template
├── .gitignore                  # Git ignore rules
├── package.json                # Root scripts (concurrently)
└── README.md                   # This file
```

---

## 🔒 Security

- **Passwords**: Hashed with bcrypt (12 salt rounds)
- **Sessions**: JWT tokens with configurable expiry
- **Rate Limiting**: 20 attempts / 15 min on auth endpoints
- **Headers**: Helmet.js for secure HTTP headers
- **Validation**: Zod schemas on both client and server
- **CORS**: Configured for frontend origin only

---

## 🗺️ Roadmap

- [ ] 📱 Push notifications for upcoming EMIs
- [ ] 🔑 Two-factor authentication (2FA)
- [ ] 📄 Export loan data as PDF/CSV
- [ ] 📊 Payment history timeline view
- [ ] 🌓 Dark/Light theme toggle
- [ ] 🔐 Forgot password flow
- [ ] 👤 User profile editing page
- [ ] 📱 Progressive Web App (PWA) support

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Tips
- The project uses a **modular architecture** — changes to one component won't break others
- Server auto-restarts with **nodemon** on file changes
- Client uses **Vite HMR** for instant updates
- Database is stored at `server/database/loantrackr.db` (auto-created)

---

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by [Roshan Shirke](https://github.com/YOUR_USERNAME)**

⭐ Star this repo if you find it useful!

</div>
