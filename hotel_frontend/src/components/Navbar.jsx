/**
 * Navbar component - shown on all pages.
 * Shows different links based on user role.
 */
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('auth/logout/');
    } catch (err) {
      // Ignore errors on logout
    }
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">Hotel Management System</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>
            {user && (
              <>
                {user.role === 'admin' && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/admin/dashboard">Admin Dashboard</Link>
                  </li>
                )}
                {user.role === 'employee' && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/employee/dashboard">Employee Dashboard</Link>
                  </li>
                )}
                {user.role === 'customer' && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/user/dashboard">Customer Dashboard</Link>
                  </li>
                )}
                <li className="nav-item">
                  <span className="nav-link text-info">Hi, {user.first_name || user.username}</span>
                </li>
                <li className="nav-item">
                  <button className="btn btn-outline-light btn-sm mt-1" onClick={handleLogout}>Logout</button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
