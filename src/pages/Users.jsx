import { Fragment, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { adminSidebar } from '../config/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setUsers } from '../store/dataSlice';
import { formatFullName, ROLE_LABELS, ROLES } from '../mock/users';
import { getFacultyLabel, findFaculty } from '../mock/faculties';
import { migrateUser } from '../utils/migrateUser';

export default function Users() {
  const dispatch = useAppDispatch();
  const users = useAppSelector((s) => s.data.users);
  const faculties = useAppSelector((s) => s.data.faculties);
  const groups = useAppSelector((s) => s.data.groups);

  const [form, setForm] = useState({
    email: '',
    password: 'demo123',
    role: ROLES.STUDENT,
    lastName: '',
    firstName: '',
    middleName: '',
  });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const startEdit = (u) => {
    setEditId(u.id);
    setEditForm({
      facultyId: u.facultyId || '',
      group: u.group || '',
      recordBookNumber: u.recordBookNumber || '',
      studentCardNumber: u.studentCardNumber || '',
    });
  };

  const saveEdit = () => {
    dispatch(
      setUsers(
        users.map((u) =>
          u.id === editId
            ? migrateUser(
                {
                  ...u,
                  ...editForm,
                  group: editForm.group?.trim() || null,
                },
                faculties
              )
            : u
        )
      )
    );
    setEditId(null);
    setEditForm(null);
  };

  const addUser = (e) => {
    e.preventDefault();
    const newUser = migrateUser(
      {
        id: 'u' + Date.now(),
        ...form,
        email: form.email.trim().toLowerCase(),
        facultyId: form.role === ROLES.STUDENT ? null : null,
        group: form.role === ROLES.STUDENT ? null : null,
        recordBookNumber: null,
        studentCardNumber: null,
      },
      faculties
    );
    dispatch(setUsers([...users, newUser]));
    setForm({
      email: '',
      password: 'demo123',
      role: ROLES.STUDENT,
      lastName: '',
      firstName: '',
      middleName: '',
    });
  };

  const removeUser = (id) => {
    if (!confirm('Удалить пользователя?')) return;
    dispatch(setUsers(users.filter((u) => u.id !== id)));
  };

  const updateRole = (id, role) => {
    dispatch(
      setUsers(
        users.map((u) =>
          u.id === id
            ? migrateUser(
                {
                  ...u,
                  role,
                  facultyId: role === ROLES.STUDENT ? u.facultyId : null,
                  group: role === ROLES.STUDENT ? u.group : null,
                  recordBookNumber:
                    role === ROLES.STUDENT ? u.recordBookNumber : null,
                  studentCardNumber:
                    role === ROLES.STUDENT ? u.studentCardNumber : null,
                },
                faculties
              )
            : u
        )
      )
    );
  };

  const facultyGroups = (facultyId) =>
    groups.filter((g) => g.facultyId === facultyId);

  return (
    <DashboardLayout sidebarItems={adminSidebar} sidebarTitle="Администрирование">
      <header className="page-header">
        <h1>Пользователи</h1>
        <p>
          Учётные записи. Для студентов факультет, группа (формат ЭЭ-22), зачётная книжка и
          студенческий билет задаются здесь.
        </p>
      </header>

      <div className="card editor-block">
        <h3 style={{ marginTop: 0 }}>Добавить пользователя</h3>
        <form className="inline-form" onSubmit={addUser}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Фамилия</label>
            <input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Имя</label>
            <input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Роль</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn--primary btn--sm">
            Добавить
          </button>
        </form>
      </div>

      <div className="table-wrap" style={{ marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Email</th>
              <th>Факультет / группа</th>
              <th>Роль</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <Fragment key={u.id}>
                <tr>
                  <td>{formatFullName(u)}</td>
                  <td>{u.email}</td>
                  <td>
                    {u.role === ROLES.STUDENT ? (
                      <>
                        {u.facultyId
                          ? getFacultyLabel(findFaculty(faculties, u.facultyId))
                          : 'Факультет не назначен'}
                        <br />
                        <span className="form-hint">{u.group || 'Группа не назначена'}</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                    >
                      {Object.entries(ROLE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="table-actions">
                      {u.role === ROLES.STUDENT && (
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => startEdit(u)}
                        >
                          Учёба
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn--danger btn--sm"
                        onClick={() => removeUser(u.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
                {editId === u.id && editForm && (
                  <tr key={`${u.id}-edit`}>
                    <td colSpan={5}>
                      <div className="editor-block">
                        <h4>Учебные данные студента</h4>
                        <div className="form-row form-row--2">
                          <div className="form-group">
                            <label>Факультет</label>
                            <select
                              value={editForm.facultyId}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  facultyId: e.target.value,
                                  group: '',
                                })
                              }
                            >
                              <option value="">— не назначен —</option>
                              {faculties.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {getFacultyLabel(f)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Группа (формат ЭЭ-22)</label>
                            <input
                              list={`groups-${u.id}`}
                              placeholder="ЭЭ-22"
                              value={editForm.group}
                              onChange={(e) =>
                                setEditForm({ ...editForm, group: e.target.value })
                              }
                            />
                            <datalist id={`groups-${u.id}`}>
                              {facultyGroups(editForm.facultyId).map((g) => (
                                <option key={g.id} value={g.name} />
                              ))}
                            </datalist>
                          </div>
                        </div>
                        <div className="form-row form-row--2">
                          <div className="form-group">
                            <label>Зачётная книжка</label>
                            <input
                              value={editForm.recordBookNumber}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  recordBookNumber: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>Студенческий билет</label>
                            <input
                              value={editForm.studentCardNumber}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  studentCardNumber: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="form-actions">
                          <button
                            type="button"
                            className="btn btn--primary btn--sm"
                            onClick={saveEdit}
                          >
                            Сохранить
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => setEditId(null)}
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
