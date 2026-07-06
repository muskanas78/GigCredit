# GigCredit — Freelance Receivable Factoring Platform
**FAST University Islamabad | FinTech Program | Semester 6**

**Proposed by:** Muskan Ahmed (23i-4145), Anaya Noor (23i-5521), Eman Fatima (23i-4577)

## Live Demo
**Frontend:** https://gig-credit.vercel.app/login

<img width="1600" height="718" alt="image" src="https://github.com/user-attachments/assets/ad87de65-6870-423c-99f1-19ebe6908759" />

## What is GigCredit?
GigCredit is a full-stack fintech web application that helps Pakistani freelancers unlock up to 75% of their pending Upwork/Fiverr earnings instantly — solving the cash-flow delay problem caused by 7–30 day platform clearance cycles.

## Tech Stack
- **Frontend:** React.js (Vite) + Recharts
- **Backend:** Node.js + Express.js
- **Database:** MongoDB Atlas (Mongoose)
- **Auth:** JWT + bcrypt

## Features
- User registration, login, JWT-protected routes
- Auto-created wallet per user
- Deposit, withdraw, transfer (with backend validation)
- Advance eligibility calculator (75% of pending earnings)
- Expense tracking + monthly budgets
- 6 backend suspicious-transaction rules
- Full admin panel (block/unblock users, view all transactions, manage categories)
- Notifications system
- Reports and charts

## Getting Started
### Prerequisites
- Node.js >= 18
- MongoDB Atlas account (free tier works)

### Backend Setup
```bash
cd backend
cp env.example .env
# Fill in MONGO_URI and JWT_SECRET in .env
npm install
npm run seed     # creates demo data
npm run dev      # starts on port 5000
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env
# For local dev, leave VITE_API_BASE empty (Vite proxies to port 5000)
npm install
npm run dev      # starts on port 5173
```

### Demo Accounts (after running seed)
| Role  | Email                    | Password   |
|-------|--------------------------|------------|
| Admin | admin@gigcredit.test     | Admin@123  |
| User  | muskan@gigcredit.test    | Demo@123   |
| User  | eman@gigcredit.test      | Demo@123   |
| User  | anaya@gigcredit.test     | Demo@123   |

## Deployment
- **Frontend:** Vercel or Netlify (set `VITE_API_BASE` to your backend URL)
- **Backend:** Render or Railway (set all env vars in platform settings)
- **Database:** MongoDB Atlas (free M0 cluster)

## API Endpoints
Base: `POST /api/health` — health check

| Module       | Endpoints |
|-------------|-----------|
| Auth         | POST /api/auth/register, /login, /logout, GET /me |
| Wallet       | GET /api/wallet, POST /deposit, /withdraw, /transfer |
| Transactions | GET /api/transactions |
| Expenses     | CRUD /api/expenses |
| Budgets      | CRUD /api/budgets |
| Reports      | GET /api/reports/user-dashboard, /advance-plan |
| Admin        | GET /api/admin/dashboard, /users, /transactions, /wallets |

## Project Structure
```
GigCredit/
├── backend/
│   ├── config/          # DB connection
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # auth, role, validation, error
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── utils/           # helpers, suspicious rules, seed
│   └── validations/     # validation rule sets
└── frontend/
    └── src/
        ├── components/  # layout, charts, UI
        ├── context/     # AuthContext, ToastContext
        ├── pages/       # user pages + admin pages
        ├── services/    # api.js (axios)
        └── utils/       # format helpers
```
