/**
 * Main App component - sets up routing and manages user state.
 */
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import api from './api';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import CustomerDashboard from './pages/CustomerDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in (page refresh)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get('auth/user/');
        setUser(res.data);
      } catch (err) {
        // Not logged in - that's okay
        setUser(null);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Navbar user={user} setUser={setUser} />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/login" element={<LoginPage role="admin" setUser={setUser} />} />
        <Route path="/employee/login" element={<LoginPage role="employee" setUser={setUser} />} />
        <Route path="/user/login" element={<LoginPage role="customer" setUser={setUser} />} />
        <Route path="/user/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute user={user} allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/employee/dashboard" element={
          <ProtectedRoute user={user} allowedRole="employee">
            <EmployeeDashboard />
          </ProtectedRoute>
        } />
        <Route path="/user/dashboard" element={
          <ProtectedRoute user={user} allowedRole="customer">
            <CustomerDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
