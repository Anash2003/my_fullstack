/**
 * ProtectedRoute - redirects to home if user is not logged in or has wrong role.
 */
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ user, allowedRole, children }) {
  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default ProtectedRoute;
