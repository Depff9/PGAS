import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { ROLES } from '../mock/users';

export default function ProtectedRoute({ children, roles, commissionPermission }) {
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
          : '/applications';
    return <Navigate to={fallback} replace />;
  }

  if (user.role === ROLES.COMMISSION && commissionPermission) {
    if (!user.permissions?.[commissionPermission]) {
      return <Navigate to="/commission" replace />;
    }
  }

  return children;
}
