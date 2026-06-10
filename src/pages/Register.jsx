import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TooltipInfo from '../components/TooltipInfo';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { registerUser } from '../utils/auth';
import { UNIVERSITY } from '../config/university';

export default function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const users = useAppSelector((s) => s.data.users);
  const faculties = useAppSelector((s) => s.data.faculties);

  const [error, setError] = useState('');
  const [form, setForm] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    email: '',
    password: '',
    confirm: '',
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Пароли не совпадают');
      return;
    }
    if (form.password.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }
    const result = registerUser(dispatch, users, form, faculties);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate('/profile');
  };

  return (
    <div className="app-shell">
      <Navbar />
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: 520 }}>
          <h1>Регистрация студента</h1>
          <p className="auth-card__sub">
            {UNIVERSITY.shortName} — учётная запись для подачи заявлений на ПГАС
          </p>
          {error && <div className="alert alert--error">{error}</div>}
          <div className="alert alert--info">
            После регистрации администратор назначит факультет, группу (например, ЭЭ-22),
            номер зачётной книжки и студенческого билета.
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-row form-row--3">
              <div className="form-group">
                <label>
                  Фамилия <TooltipInfo fieldKey="register.lastName" />
                </label>
                <input value={form.lastName} onChange={set('lastName')} required />
              </div>
              <div className="form-group">
                <label>
                  Имя <TooltipInfo fieldKey="register.firstName" />
                </label>
                <input value={form.firstName} onChange={set('firstName')} required />
              </div>
              <div className="form-group">
                <label>
                  Отчество <TooltipInfo fieldKey="register.middleName" />
                </label>
                <input value={form.middleName} onChange={set('middleName')} />
              </div>
            </div>
            <div className="form-group">
              <label>
                Email <TooltipInfo fieldKey="register.email" />
              </label>
              <input type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-row form-row--2">
              <div className="form-group">
                <label>
                  Пароль <TooltipInfo fieldKey="register.password" />
                </label>
                <input type="password" value={form.password} onChange={set('password')} required />
              </div>
              <div className="form-group">
                <label>Повтор пароля</label>
                <input type="password" value={form.confirm} onChange={set('confirm')} required />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn--primary">
                Зарегистрироваться
              </button>
              <Link to="/login" className="btn btn--ghost">
                Уже есть аккаунт
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
