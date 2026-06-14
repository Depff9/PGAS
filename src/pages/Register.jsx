import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TooltipInfo from '../components/TooltipInfo';
import { useAppDispatch } from '../store/hooks';
import { UNIVERSITY } from '../config/university';
import { registerApi } from '../api/authApi';
import { loginSuccess } from '../store/authSlice';
import { reloadData } from '../store/dataSlice';
import { isValidPersonName, sanitizePersonNameInput } from '../utils/personName';

export default function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [hasNoMiddleName, setHasNoMiddleName] = useState(false);
  const [middleNameDraft, setMiddleNameDraft] = useState('');

  const set = (field) => (e) =>
    setForm({
      ...form,
      [field]:
        field === 'lastName' || field === 'firstName' || field === 'middleName'
          ? sanitizePersonNameInput(e.target.value)
          : e.target.value,
    });

  const handleSubmit = async (e) => {
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
    if (!isValidPersonName(form.lastName) || !isValidPersonName(form.firstName)) {
      setError('Фамилия и имя должны содержать только русские буквы (допустим дефис)');
      return;
    }
    if (!hasNoMiddleName && form.middleName.trim() && !isValidPersonName(form.middleName)) {
      setError('Отчество должно содержать только русские буквы (допустим дефис)');
      return;
    }
    try {
      const user = await registerApi({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        middleName: hasNoMiddleName ? '' : form.middleName,
      });
      dispatch(loginSuccess(user));
      await dispatch(reloadData());
      navigate('/profile');
    } catch (error) {
      setError(error.message || 'Ошибка регистрации');
    }
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
                <input value={form.middleName} onChange={set('middleName')} disabled={hasNoMiddleName} />
                <label style={{ marginTop: '0.4rem', display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={hasNoMiddleName}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setHasNoMiddleName(checked);
                      if (checked) {
                        setMiddleNameDraft(form.middleName);
                        setForm({ ...form, middleName: '' });
                      } else {
                        setForm({ ...form, middleName: middleNameDraft });
                        setMiddleNameDraft('');
                      }
                    }}
                  />
                  Нет отчества
                </label>
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
