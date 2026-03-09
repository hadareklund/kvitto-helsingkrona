import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SubmitReceipt from './pages/SubmitReceipt';
import Admin from './pages/Admin';
import ReceiptDetail from './pages/ReceiptDetail';
import AdminUserProfile from './pages/AdminUserProfile';
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
