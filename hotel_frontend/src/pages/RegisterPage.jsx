/**
 * RegisterPage - customer self-registration form.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function RegisterPage() {
  const [form, setForm] = useState({
    username: '', password: '', email: '',
    first_name: '', last_name: '', phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('auth/register/', form);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/user/login'), 2000);
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'object') {
        // Collect all error messages
        const messages = Object.values(data).flat().join(' ');
        setError(messages);
      } else {
        setError('Registration failed.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-info text-white text-center">
              <h4 className="mb-0">Customer Registration</h4>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">First Name</label>
                    <input type="text" className="form-control" name="first_name" value={form.first_name} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Last Name</label>
                    <input type="text" className="form-control" name="last_name" value={form.last_name} onChange={handleChange} required />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input type="text" className="form-control" name="username" value={form.username} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-control" name="password" value={form.password} onChange={handleChange} required minLength="6" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone (optional)</label>
                  <input type="text" className="form-control" name="phone" value={form.phone} onChange={handleChange} />
                </div>
                <button type="submit" className="btn btn-info w-100" disabled={loading}>
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </form>

              <p className="text-center mt-3">
                Already have an account?{' '}
                <a href="/user/login" onClick={(e) => { e.preventDefault(); navigate('/user/login'); }}>Login here</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
