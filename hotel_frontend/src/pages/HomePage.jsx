/**
 * Home Page - displays welcome message and three login cards with demo credentials.
 */
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="container mt-5">
      <div className="text-center mb-5">
        <h1>Hotel Management System</h1>
        <p className="lead">Welcome to our hotel management platform. Please select your role to log in.</p>
      </div>

      <h3 className="text-center mb-4">Demo Login Credentials</h3>

      <div className="row justify-content-center">
        {/* Admin Card */}
        <div className="col-md-4 mb-4">
          <div className="card h-100 border-primary">
            <div className="card-header bg-primary text-white text-center">
              <h5 className="mb-0">Admin Login</h5>
            </div>
            <div className="card-body text-center">
              <p><strong>Username:</strong> admin_test</p>
              <p><strong>Password:</strong> Admin@12345</p>
              <button
                className="btn btn-primary mt-2"
                onClick={() => navigate('/admin/login')}
              >
                Admin Login
              </button>
            </div>
          </div>
        </div>

        {/* Employee Card */}
        <div className="col-md-4 mb-4">
          <div className="card h-100 border-success">
            <div className="card-header bg-success text-white text-center">
              <h5 className="mb-0">Authorized Employee Login</h5>
            </div>
            <div className="card-body text-center">
              <p><strong>Username:</strong> employee_test</p>
              <p><strong>Password:</strong> Employee@12345</p>
              <button
                className="btn btn-success mt-2"
                onClick={() => navigate('/employee/login')}
              >
                Employee Login
              </button>
            </div>
          </div>
        </div>

        {/* Customer Card */}
        <div className="col-md-4 mb-4">
          <div className="card h-100 border-info">
            <div className="card-header bg-info text-white text-center">
              <h5 className="mb-0">User (Customer) Login</h5>
            </div>
            <div className="card-body text-center">
              <p><strong>Username:</strong> user_test</p>
              <p><strong>Password:</strong> User@12345</p>
              <button
                className="btn btn-info mt-2"
                onClick={() => navigate('/user/login')}
              >
                User Login
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-3">
        <p className="text-muted">
          New customer? <a href="/user/register" onClick={(e) => { e.preventDefault(); navigate('/user/register'); }}>Register here</a>
        </p>
      </div>
    </div>
  );
}

export default HomePage;
