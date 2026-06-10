import { Fragment, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { adminSidebar } from '../config/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setHistory, setUsers } from '../store/dataSlice';
import { formatFullName, ROLE_LABELS, ROLES } from '../mock/users';
import { getFacultyLabel, findFaculty } from '../mock/faculties';
import { migrateUser } from '../utils/migrateUser';
import { createHistoryEntry } from '../utils/history';

export default function Users() {
  const dispatch = useAppDispatch();
  const users = useAppSelector((s) => s.data.users);
  const faculties = useAppSelector((s) => s.data.faculties);
  const groups = useAppSelector((s) => s.data.groups);
  const directions = useAppSelector((s) => s.data.directions);
  const currentUser = useAppSelector((s) => s.auth.user);
  const history = useAppSelector((s) => s.data.history);

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
      commissionPermissions: {
        canEditRegulations: u.permissions?.canEditRegulations ?? false,
        canEditDirections: u.permissions?.canEditDirections ?? false,
        canEditScoringMatrix: u.permissions?.canEditScoringMatrix ?? false,
        allowedDirectionIds: u.permissions?.allowedDirectionIds || [],
      },
    });
  };

  const saveEdit = () => {
    const editedUser = users.find((u) => u.id === editId);
    const updatedUsers = users.map((u) =>
      u.id === editId
        ? migrateUser(
            {
              ...u,
              ...editForm,
              permissions:
                u.role === ROLES.COMMISSION ? editForm.commissionPermissions : u.permissions,
              group: editForm.group?.trim() || null,
            },
            faculties
          )
        : u
    );
    dispatch(setUsers(updatedUsers));
    dispatch(
      setHistory([
        createHistoryEntry({
          category: 'admin.users',
          action: 'update',
          summary: `Обновлены настройки пользователя: ${formatFullName(editedUser)}`,
          userId: currentUser.id,
          userName: formatFullName(currentUser),
          targetId: editId,
          metadata: { role: editedUser?.role },
        }),
        ...history,
      ])
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
        permissions:
          form.role === ROLES.COMMISSION
            ? {
                canEditRegulations: false,
                canEditDirections: false,
                canEditScoringMatrix: false,
                allowedDirectionIds: [],
              }
            : null,
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
                  permissions:
                    role === ROLES.COMMISSION
                      ? u.permissions || {
                          canEditRegulations: false,
                          canEditDirections: false,
                          canEditScoringMatrix: false,
                          allowedDirectionIds: [],
                        }
                      : null,
                  facultyId: role === ROLES.STUDENT ? u.facultyId : null,
                  group: role === ROLES.STUDENT ? u.group : null,
                  recordBookNumber: role === ROLES.STUDENT ? u.recordBookNumber : null,
                  studentCardNumber: role === ROLES.STUDENT ? u.studentCardNumber : null,
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
                      {(u.role === ROLES.STUDENT || u.role === ROLES.COMMISSION) && (
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => startEdit(u)}
                        >
                          {u.role === ROLES.STUDENT ? 'Учёба' : 'Полномочия'}
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
                        {u.role === ROLES.STUDENT && (
                          <>
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
                                <label>Группа</label>
                                <select
                                  value={editForm.group}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, group: e.target.value })
                                  }
                                >
                                  <option value="">— не назначена —</option>
                                  {facultyGroups(editForm.facultyId).map((g) => (
                                    <option key={g.id} value={g.name}>
                                      {g.name}
                                    </option>
                                  ))}
                                </select>
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
                          </>
                        )}
                        {u.role === ROLES.COMMISSION && (
                          <>
                            <h4>Полномочия члена комиссии</h4>
                            <label style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <input
                                type="checkbox"
                                checked={editForm.commissionPermissions.canEditRegulations}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    commissionPermissions: {
                                      ...editForm.commissionPermissions,
                                      canEditRegulations: e.target.checked,
                                    },
                                  })
                                }
                              />
                              Право изменять регламент
                            </label>
                            <label style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <input
                                type="checkbox"
                                checked={editForm.commissionPermissions.canEditDirections}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    commissionPermissions: {
                                      ...editForm.commissionPermissions,
                                      canEditDirections: e.target.checked,
                                    },
                                  })
                                }
                              />
                              Право изменять направления
                            </label>
                            <label style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                              <input
                                type="checkbox"
                                checked={editForm.commissionPermissions.canEditScoringMatrix}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    commissionPermissions: {
                                      ...editForm.commissionPermissions,
                                      canEditScoringMatrix: e.target.checked,
                                    },
                                  })
                                }
                              />
                              Право изменять матрицу баллов
                            </label>
                            <div className="form-group">
                              <label>Направления для оценки</label>
                              <div className="template-chips">
                                {directions.map((d) => {
                                  const selected = editForm.commissionPermissions.allowedDirectionIds.includes(
                                    d.id
                                  );
                                  return (
                                    <button
                                      key={d.id}
                                      type="button"
                                      className={'direction-tab' + (selected ? ' direction-tab--active' : '')}
                                      onClick={() =>
                                        setEditForm({
                                          ...editForm,
                                          commissionPermissions: {
                                            ...editForm.commissionPermissions,
                                            allowedDirectionIds: selected
                                              ? editForm.commissionPermissions.allowedDirectionIds.filter(
                                                  (id) => id !== d.id
                                                )
                                              : [...editForm.commissionPermissions.allowedDirectionIds, d.id],
                                          },
                                        })
                                      }
                                    >
                                      {d.title}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
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
