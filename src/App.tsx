import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SubmitReceipt from './pages/SubmitReceipt';
import Admin from './pages/Admin';
import ReceiptDetail from './pages/ReceiptDetail';
import AdminUserProfile from './pages/AdminUserProfile';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import LanguageToggle from './components/LanguageToggle';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/submit" element={<SubmitReceipt />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/receipt/:receiptId" element={<ReceiptDetail />} />
        <Route path="/admin/users/:userId" element={<AdminUserProfile />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <LanguageToggle />
    </BrowserRouter>
  );
}

export default App;
