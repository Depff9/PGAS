import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/authSlice';
import { formatFullName, ROLE_LABELS, ROLES } from '../mock/users';
import { UNIVERSITY } from '../config/university';
import NotificationBell from './NotificationBell';

function navClass(isActive) {
  return 'navbar__link' + (isActive ? ' active' : '');
}

export default function Navbar() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isCommissionActive = pathname.startsWith('/commission');
  const isWorkspaceActive = pathname.startsWith('/application');
  const isApplicationActive =
    pathname.startsWith('/applications') || isWorkspaceActive;
  const isAdminActive = pathname.startsWith('/admin');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar__inner container">
        <Link to="/" className="navbar__brand" title={UNIVERSITY.officialName}>
          <span className="navbar__logo">ПГАС · {UNIVERSITY.shortName}</span>
          <span className="navbar__tagline">{UNIVERSITY.tagline}</span>
        </Link>

        <nav className="navbar__nav" aria-label="Основное меню">
          {(!user || user.role === ROLES.STUDENT) && (
            <>
              <NavLink to="/" end className={({ isActive }) => navClass(isActive)}>
                Главная
              </NavLink>
              <NavLink to="/directions" className={({ isActive }) => navClass(isActive)}>
                Направления
              </NavLink>
            </>
          )}
          {user?.role === ROLES.STUDENT && (
            <>
              <NavLink to="/rating" className={({ isActive }) => navClass(isActive)}>
                Рейтинг
              </NavLink>
              <NavLink
                to="/applications"
                className={() => navClass(isApplicationActive)}
              >
                Моё заявление
              </NavLink>
              <NavLink
                to="/application/workspace"
                className={() => navClass(isWorkspaceActive) + ' navbar__link--cta'}
              >
                Таблица
              </NavLink>
            </>
          )}
          {user?.role === ROLES.COMMISSION && (
            <NavLink to="/commission" className={() => navClass(isCommissionActive)}>
              Кабинет комиссии
            </NavLink>
          )}
          {user?.role === ROLES.ADMIN && (
            <NavLink to="/admin" className={() => navClass(isAdminActive)}>
              Админ панель
            </NavLink>
          )}
        </nav>

        <div className="navbar__actions">
          {user ? (
            <>
              {user.role === ROLES.STUDENT && <NotificationBell userId={user.id} />}
              <NavLink to="/profile" className="navbar__user" title={formatFullName(user)}>
                <span className="navbar__user-name">{formatFullName(user)}</span>
                <span className="navbar__user-role">{ROLE_LABELS[user.role]}</span>
              </NavLink>
              <button type="button" className="btn btn--ghost btn--sm" onClick={handleLogout}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost btn--sm">
                Вход
              </Link>
              <Link to="/register" className="btn btn--primary btn--sm">
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
