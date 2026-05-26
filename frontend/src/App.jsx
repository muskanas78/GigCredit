// App.jsx — top-level routing tree.

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

// Public
import Landing from './pages/Landing.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import NotFound from './pages/NotFound.jsx';

// User
import UserLayout from './components/layout/UserLayout.jsx';
import Dashboard from './pages/user/Dashboard.jsx';
import Wallet from './pages/user/Wallet.jsx';
import Deposit from './pages/user/Deposit.jsx';
import Withdraw from './pages/user/Withdraw.jsx';
import Transfer from './pages/user/Transfer.jsx';
import Transactions from './pages/user/Transactions.jsx';
import TransactionDetail from './pages/user/TransactionDetail.jsx';
import Receipt from './pages/user/Receipt.jsx';
import Expenses from './pages/user/Expenses.jsx';
import Budgets from './pages/user/Budgets.jsx';
import Reports from './pages/user/Reports.jsx';
import Notifications from './pages/user/Notifications.jsx';
import Profile from './pages/user/Profile.jsx';

// Admin
import AdminLayout from './components/layout/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminUserDetail from './pages/admin/AdminUserDetail.jsx';
import AdminWallets from './pages/admin/AdminWallets.jsx';
import AdminTransactions from './pages/admin/AdminTransactions.jsx';
import AdminFlagged from './pages/admin/AdminFlagged.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';
import AdminReports from './pages/admin/AdminReports.jsx';
import AdminAuditLogs from './pages/admin/AdminAuditLogs.jsx';

// ---- Route guards --------------------------------------------------

function BootGate({ children }) {
  const { bootLoading } = useAuth();
  if (bootLoading) {
    return (
      <div style={{
        height: '100vh', display: 'grid', placeItems: 'center',
      }}>
        <span className="spinner lg" />
      </div>
    );
  }
  return children;
}

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicOnly({ children }) {
  // Login/register are inaccessible once logged in.
  const { isAuthenticated, isAdmin } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}

// ---- App -----------------------------------------------------------

export default function App() {
  return (
    <BootGate>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login"    element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

        {/* User */}
        <Route element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
          <Route path="/dashboard"            element={<Dashboard />} />
          <Route path="/wallet"               element={<Wallet />} />
          <Route path="/wallet/deposit"       element={<Deposit />} />
          <Route path="/wallet/withdraw"      element={<Withdraw />} />
          <Route path="/wallet/transfer"      element={<Transfer />} />
          <Route path="/transactions"         element={<Transactions />} />
          <Route path="/transactions/:id"     element={<TransactionDetail />} />
          <Route path="/transactions/:id/receipt" element={<Receipt />} />
          <Route path="/expenses"             element={<Expenses />} />
          <Route path="/budgets"              element={<Budgets />} />
          <Route path="/reports"              element={<Reports />} />
          <Route path="/notifications"        element={<Notifications />} />
          <Route path="/profile"              element={<Profile />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
          <Route path="/admin"                element={<AdminDashboard />} />
          <Route path="/admin/users"          element={<AdminUsers />} />
          <Route path="/admin/users/:id"      element={<AdminUserDetail />} />
          <Route path="/admin/wallets"        element={<AdminWallets />} />
          <Route path="/admin/transactions"   element={<AdminTransactions />} />
          <Route path="/admin/flagged"        element={<AdminFlagged />} />
          <Route path="/admin/categories"     element={<AdminCategories />} />
          <Route path="/admin/reports"        element={<AdminReports />} />
          <Route path="/admin/audit-logs"     element={<AdminAuditLogs />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BootGate>
  );
}
