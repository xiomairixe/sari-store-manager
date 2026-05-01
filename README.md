# 🏪  My Store Management

A full-featured inventory and business management app built for a small Filipino sari-sari store. Designed for both mobile and desktop use with a responsive sidebar layout.

---

## ✨ Features

### 📦 Inventory Management
- Add, edit, and delete products with image support (URL or file upload)
- Bulk unit support (pack, box) with per-piece price computation
- Auto markup and selling price calculator
- Stock tracking with low stock and out-of-stock alerts
- Reorder level alerts and expiry date tracking
- Mark products as ⭐ Essential for priority restocking
- Price history tracking per product
- Supplier management

### 🛍️ Checkout / POS
- Fast point-of-sale interface
- Automatic stock deduction on checkout

### 📈 Sales Overview
- Daily, Weekly, and custom date range filters
- **System vs Actual** total toggle — compare checkout records vs confirmed cash counts
- Sales trend chart with dual lines (system + actual)
- End-of-day cash reconciliation (actual vs system comparison)
- Slow-moving items indicator
- Previous period comparison (% change)

### 🧾 Expenses & Profit
- Log expenses by category (Rent, Utilities, Supplies, etc.)
- Pie chart breakdown of expenses per period
- Net profit computation (Revenue − Expenses)
- Optional receipt image upload per expense

### 🏠 Assets
- Track business assets by category (Equipment, Vehicle, Property, etc.)
- Asset value summary and status tracking (Active, Maintenance, Disposed)
- Quantity adjustment (+/−) and lost/damaged logging

### 👥 Utang (Customer Credit)
- Customer credit ledger with credit limit and progress bar
- Per-transaction history (utang + bayad)
- Exceeded credit limit warning
- Full transaction review modal per customer

### 🔐 Security
- Password-protected app access (session-based)
- 5-attempt lockout with 5-minute cooldown timer
- Recovery code system for forgotten passwords
- Change password with strength indicator
- Lock app button in sidebar

### 🛒 Shopping Notes
- Floating notes panel accessible from any page

---

## 🗂️ Project Structure

```
src/
├── layout/
│   ├── Navbar.jsx           # Responsive sidebar (desktop) + bottom nav (mobile)
│   ├── PasswordGate.jsx     # App lock screen with attempt limiting & recovery
│   └── ChangePassword.jsx   # Password settings modal
├── pages/
│   ├── Dashboard.jsx        # Overview with metrics, quick actions, recent activity
│   ├── Products.jsx         # Inventory management
│   ├── Sales.jsx            # Sales overview and reconciliation
│   ├── Costs.jsx            # Expenses and profit tracking
│   ├── Assets.jsx           # Business asset tracker
│   ├── Utang.jsx            # Customer credit management
│   ├── CheckOut.jsx         # POS / Checkout
│   ├── Suppliers.jsx        # Supplier directory
│   └── Notes.jsx            # Shopping notes
├── App.jsx                  # Root component with routing and layout shell
└── main.jsx                 # Entry point
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm or yarn
- Backend API running (see backend repo)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd sari-store-manager

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_API_URL=http://localhost:5000
```

### Running the App

```bash
# Development
npm run dev

# Development (accessible on local network / other devices)
npm run dev -- --host 0.0.0.0

# Production build
npm run build

# Preview production build
npm run preview
```

---

## 🔐 Default Password

The app ships with a default password:

```
tindahan2024
```

**Change it immediately** after first login via **Sidebar → Security → Change Password**.

### Setting Up a Recovery Code
Go to **Sidebar → Security → Change Password** and set a recovery code. Store it somewhere safe — you'll need it if you ever forget your password.

### Emergency Reset (Browser Console)
If locked out with no recovery code, open DevTools (`F12`) and run:

```js
localStorage.removeItem("tindahan_password")
localStorage.removeItem("tindahan_lockout")
sessionStorage.setItem("tindahan_auth", "1")
location.reload()
```

This resets to the default password `tindahan2024`.

---

## 📱 Responsive Layout

| Screen | Layout |
|--------|--------|
| Mobile (`< 768px`) | Bottom navigation bar with floating Checkout button |
| Desktop (`≥ 768px`) | Fixed left sidebar with full nav labels and security controls |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Charts | Recharts |
| Styling | Inline styles + CSS-in-JS (no external CSS framework) |
| Fonts | DM Sans (Google Fonts) |
| Icons | Custom inline SVGs |

---


Private use only — built for personal store management.