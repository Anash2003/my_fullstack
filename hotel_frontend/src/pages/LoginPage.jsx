/**
 * LoginPage - reusable login form for admin, employee, and customer.
 * The 'role' prop determines which role's login this is.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function LoginPage({ role, setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Role display names and redirect paths
  const roleConfig = {
    admin: { title: 'Admin Login', redirect: '/admin/dashboard', color: 'primary' },
    employee: { title: 'Employee Login', redirect: '/employee/dashboard', color: 'success' },
    customer: { title: 'Customer Login', redirect: '/user/dashboard', color: 'info' },
  };

  const config = roleConfig[role];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('auth/login/', { username, password });
      const userData = response.data.user;

      // Verify the user has the correct role
      if (userData.role !== role) {
        setError('This account does not have ' + role + ' access. Please use the correct login page.');
        setLoading(false);
        return;
      }

      setUser(userData);
      navigate(config.redirect);
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.';
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card">
            <div className={`card-header bg-${config.color} text-white text-center`}>
              <h4 className="mb-0">{config.title}</h4>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className={`btn btn-${config.color} w-100`}
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              {role === 'customer' && (
                <p className="text-center mt-3">
                  Don't have an account?{' '}
                  <a href="/user/register" onClick={(e) => { e.preventDefault(); navigate('/user/register'); }}>
                    Register here
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
