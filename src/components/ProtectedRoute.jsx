import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { ROLES } from '../mock/users';

export default function ProtectedRoute({ children, roles }) {
  const user = useAppSelector((s) => s.auth.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    const fallback =
      user.role === ROLES.ADMIN
        ? '/admin'
        : user.role === ROLES.COMMISSION
          ? '/commission'
          : '/profile';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
