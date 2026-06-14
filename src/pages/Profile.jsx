import { useState } from 'react';
import Navbar from '../components/Navbar';
import TooltipInfo from '../components/TooltipInfo';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateProfile } from '../store/authSlice';
import { setUsers } from '../store/dataSlice';
import { formatFullName, ROLE_LABELS, isStudent } from '../mock/users';
import { findFaculty, getFacultyLabel } from '../mock/faculties';
import { UNIVERSITY } from '../config/university';
import { dataApi } from '../api/dataApi';

export default function Profile() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const users = useAppSelector((s) => s.data.users);
  const faculties = useAppSelector((s) => s.data.faculties);
  const student = isStudent(user);
  const faculty = findFaculty(faculties, user?.facultyId);

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    lastName: user?.lastName || '',
    firstName: user?.firstName || '',
    middleName: user?.middleName || '',
  });

  if (!user) return null;

  const initials =
    (user.firstName?.[0] || '') + (user.lastName?.[0] || '');

  const handleSave = async (e) => {
    e.preventDefault();
    const patch = {
      lastName: form.lastName.trim(),
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
    };
    try {
      const saved = await dataApi.updateOwnProfile({
        firstName: patch.firstName,
        lastName: patch.lastName,
        middleName: patch.middleName,
      });
      dispatch(updateProfile(saved || patch));
      const updatedUsers = users.map((u) => (u.id === user.id ? { ...u, ...patch } : u));
      dispatch(setUsers(updatedUsers));
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert(error.message || 'Не удалось сохранить профиль');
    }
  };

  return (
    <div className="app-shell">
      <Navbar />
      <div className="container page-content">
        <header className="page-header">
          <h1>Профиль</h1>
          <p>
            {student
              ? 'Личные данные. Учебная информация назначается администратором ' +
                UNIVERSITY.shortName
              : 'Личные данные сотрудника'}
          </p>
        </header>

        {saved && <div className="alert alert--success">Изменения сохранены</div>}

        <div className="profile-grid">
          <div className="card">
            <div className="profile-avatar">{initials.toUpperCase()}</div>
            <dl className="profile-meta">
              <dt>Роль</dt>
              <dd>{ROLE_LABELS[user.role]}</dd>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </dl>
          </div>

          <div className="card">
            {!editing ? (
              <>
                <h2 style={{ marginTop: 0 }}>{formatFullName(user)}</h2>
                <dl className="profile-meta">
                  {student && (
                    <>
                      <dt>
                        Факультет <TooltipInfo fieldKey="profile.faculty" />
                      </dt>
                      <dd>{faculty ? getFacultyLabel(faculty) : 'Не назначен'}</dd>
                      <dt>
                        Группа <TooltipInfo fieldKey="profile.group" />
                      </dt>
                      <dd>{user.group || 'Не назначена'}</dd>
                      <dt>
                        Зачётная книжка <TooltipInfo fieldKey="profile.recordBook" />
                      </dt>
                      <dd>{user.recordBookNumber || '—'}</dd>
                      <dt>
                        Студенческий билет <TooltipInfo fieldKey="profile.studentCard" />
                      </dt>
                      <dd>{user.studentCardNumber || '—'}</dd>
                    </>
                  )}
                </dl>
                <button type="button" className="btn btn--primary" onClick={() => setEditing(true)}>
                  Редактировать ФИО
                </button>
              </>
            ) : (
              <form onSubmit={handleSave}>
                <h2 style={{ marginTop: 0 }}>Редактирование ФИО</h2>
                <div className="form-row form-row--3">
                  <div className="form-group">
                    <label>
                      Фамилия <TooltipInfo fieldKey="profile.lastName" />
                    </label>
                    <input
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      Имя <TooltipInfo fieldKey="profile.firstName" />
                    </label>
                    <input
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      Отчество <TooltipInfo fieldKey="profile.middleName" />
                    </label>
                    <input
                      value={form.middleName}
                      onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                    />
                  </div>
                </div>
                {student && (
                  <p className="form-hint">
                    Факультет, группа и номера документов изменяет только администратор.
                  </p>
                )}
                <div className="form-actions">
                  <button type="submit" className="btn btn--primary">
                    Сохранить
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => setEditing(false)}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
