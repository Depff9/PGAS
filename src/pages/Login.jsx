import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TooltipInfo from '../components/TooltipInfo';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { authenticate } from '../utils/auth';
import { clearError } from '../store/authSlice';
import { ROLES } from '../mock/users';
import { DEMO_PASSWORD } from '../mock/users';

export default function Login() {
  const [email, setEmail] = useState('ivanov@student.brgu.ru');
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const error = useAppSelector((s) => s.auth.error);
  const users = useAppSelector((s) => s.data.users);
  const faculties = useAppSelector((s) => s.data.faculties);

  const from = location.state?.from?.pathname;

  const redirectByRole = (role) => {
    if (from) return navigate(from, { replace: true });
    if (role === ROLES.ADMIN) return navigate('/admin', { replace: true });
    if (role === ROLES.COMMISSION) return navigate('/commission', { replace: true });
    return navigate('/profile', { replace: true });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearError());
    const ok = authenticate(dispatch, users, email, password, faculties);
    if (ok) {
      const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      redirectByRole(user.role);
    }
  };

  return (
    <div className="app-shell">
      <Navbar />
      <div className="auth-page">
        <div className="auth-card">
          <h1>Вход в систему</h1>
          <p className="auth-card__sub">Цифровая среда вуза — подача заявлений на ПГАС</p>
          {error && <div className="alert alert--error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">
                Email <TooltipInfo fieldKey="login.email" />
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">
                Пароль <TooltipInfo fieldKey="login.password" />
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn--primary">
                Войти
              </button>
            </div>
          </form>
          <p className="auth-card__footer">
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
