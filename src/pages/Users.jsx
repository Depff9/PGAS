import { Fragment, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { adminSidebar } from '../config/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setHistory, setUsers } from '../store/dataSlice';
import { formatFullName, ROLE_LABELS, ROLES } from '../mock/users';
import { getFacultyLabel, findFaculty } from '../mock/faculties';
import { migrateUser } from '../utils/migrateUser';
import { createHistoryEntry } from '../utils/history';
import { dataApi } from '../api/dataApi';
import { isValidPersonName, sanitizePersonNameInput } from '../utils/personName';
import SortableHeader from '../components/SortableHeader';
import { sortBySelectors, toggleSortState } from '../utils/tableSort';

function buildCommissionPermissions(permissions) {
  return {
    canEditRegulations: permissions?.canEditRegulations ?? false,
    canEditDirections: permissions?.canEditDirections ?? false,
    allowedDirectionIds: permissions?.allowedDirectionIds || [],
  };
}

export default function Users() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const users = useAppSelector((s) => s.data.users);
  const faculties = useAppSelector((s) => s.data.faculties);
  const groups = useAppSelector((s) => s.data.groups);
  const directions = useAppSelector((s) => s.data.directions);
  const currentUser = useAppSelector((s) => s.auth.user);
  const history = useAppSelector((s) => s.data.history);
  const currentPath = location.pathname;
  const mode =
    currentPath === '/admin/commission'
      ? ROLES.COMMISSION
      : currentPath === '/admin/admins'
        ? ROLES.ADMIN
        : ROLES.STUDENT;
  const filteredUsers = users.filter((u) => {
    if (u.id === currentUser?.id) return false;
    return u.role === mode;
  });
  const [sortState, setSortState] = useState({ key: 'fullName', dir: 'asc' });
  const [requestError, setRequestError] = useState('');
  const sortedUsers = useMemo(
    () =>
      sortBySelectors(filteredUsers, sortState, {
        fullName: (u) => formatFullName(u),
        email: (u) => u.email,
        facultyGroup: (u) =>
          u.role === ROLES.STUDENT
            ? `${getFacultyLabel(findFaculty(faculties, u.facultyId))} ${u.group || ''}`
            : '',
        role: (u) => ROLE_LABELS[u.role],
      }),
    [filteredUsers, sortState, faculties]
  );

  const [form, setForm] = useState({
    email: '',
    password: 'demo123',
    role: ROLES.STUDENT,
    lastName: '',
    firstName: '',
    middleName: '',
  });
  const [hasNoMiddleName, setHasNoMiddleName] = useState(false);
  const [middleNameDraft, setMiddleNameDraft] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editMiddleNameDraft, setEditMiddleNameDraft] = useState('');
  const toggleEditMiddleName = (checked) => {
    if (!editForm) return;
    if (checked) {
      setEditMiddleNameDraft(editForm.middleName);
      setEditForm({
        ...editForm,
        hasNoMiddleName: true,
        middleName: '',
      });
      return;
    }
    setEditForm({
      ...editForm,
      hasNoMiddleName: false,
      middleName: editMiddleNameDraft,
    });
    setEditMiddleNameDraft('');
  };

  const startEdit = (u) => {
    setEditId(u.id);
    setEditForm({
      facultyId: u.facultyId || '',
      group: u.group || '',
      recordBookNumber: u.recordBookNumber || '',
      studentCardNumber: u.studentCardNumber || '',
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      middleName: u.middleName || '',
      hasNoMiddleName: !u.middleName,
      commissionPermissions: {
        canEditRegulations: u.permissions?.canEditRegulations ?? false,
        canEditDirections: u.permissions?.canEditDirections ?? false,
        allowedDirectionIds: u.permissions?.allowedDirectionIds || [],
      },
    });
    setEditMiddleNameDraft('');
  };

  const saveEdit = async () => {
    setRequestError('');
    if (!isValidPersonName(editForm.lastName) || !isValidPersonName(editForm.firstName)) {
      alert('Фамилия и имя должны содержать только русские буквы (допустим дефис)');
      return;
    }
    if (
      !editForm.hasNoMiddleName &&
      editForm.middleName.trim() &&
      !isValidPersonName(editForm.middleName)
    ) {
      alert('Отчество должно содержать только русские буквы (допустим дефис)');
      return;
    }
    const editedUser = users.find((u) => u.id === editId);
    const historyEntry = createHistoryEntry({
      category: 'admin.users',
      action: 'update',
      summary: `Обновлены настройки пользователя: ${formatFullName({
        ...editedUser,
        firstName: editForm.firstName?.trim() || editedUser?.firstName,
        lastName: editForm.lastName?.trim() || editedUser?.lastName,
        middleName: editForm.hasNoMiddleName ? null : editForm.middleName?.trim() || null,
      })}`,
      userId: currentUser.id,
      userName: formatFullName(currentUser),
      targetId: editId,
      metadata: { role: editedUser?.role },
    });
    const updatedUsers = users.map((u) =>
      u.id === editId
        ? migrateUser(
            {
              ...u,
              ...editForm,
              firstName: editForm.firstName?.trim() || u.firstName,
              lastName: editForm.lastName?.trim() || u.lastName,
              middleName: editForm.hasNoMiddleName ? null : editForm.middleName?.trim() || null,
              permissions:
                u.role === ROLES.COMMISSION ? editForm.commissionPermissions : u.permissions,
              group: editForm.group?.trim() || null,
            },
            faculties
          )
        : u
    );
    const nextPermissions = buildCommissionPermissions(editForm.commissionPermissions);
    const nextPayload = {
      ...updatedUsers.find((u) => u.id === editId),
      permissions:
        editedUser?.role === ROLES.COMMISSION ? nextPermissions : editedUser?.permissions,
    };
    dispatch(setUsers(updatedUsers));
    const remoteUpdated = await dataApi
      .updateUser(editId, {
        role: nextPayload.role,
        firstName: nextPayload.firstName,
        lastName: nextPayload.lastName,
        middleName: nextPayload.middleName,
        facultyId: nextPayload.facultyId,
        group: nextPayload.group,
        recordBookNumber: nextPayload.recordBookNumber,
        studentCardNumber: nextPayload.studentCardNumber,
        permissions: nextPayload.permissions,
      })
      .catch((error) => {
        setRequestError(error.message || 'Не удалось сохранить пользователя');
        return null;
      });
    if (remoteUpdated?.id) {
      dispatch(
        setUsers(
          updatedUsers.map((u) =>
            u.id === remoteUpdated.id ? migrateUser(remoteUpdated, faculties) : u
          )
        )
      );
    }
    dispatch(
      setHistory([
        historyEntry,
        ...history,
      ])
    );
    await dataApi.saveHistoryEntry(historyEntry).catch(() => null);
    setEditId(null);
    setEditForm(null);
    setEditMiddleNameDraft('');
  };

  const addUser = async (e) => {
    e.preventDefault();
    setRequestError('');
    if (!isValidPersonName(form.lastName) || !isValidPersonName(form.firstName)) {
      alert('Фамилия и имя должны содержать только русские буквы (допустим дефис)');
      return;
    }
    if (!hasNoMiddleName && form.middleName.trim() && !isValidPersonName(form.middleName)) {
      alert('Отчество должно содержать только русские буквы (допустим дефис)');
      return;
    }
    const newUser = migrateUser(
      {
        id: 'u' + Date.now(),
        ...form,
        role: mode,
        email: form.email.trim().toLowerCase(),
        lastName: form.lastName.trim(),
        firstName: form.firstName.trim(),
        middleName: hasNoMiddleName ? null : form.middleName.trim() || null,
        facultyId: mode === ROLES.STUDENT ? null : null,
        group: mode === ROLES.STUDENT ? null : null,
        permissions:
          mode === ROLES.COMMISSION
            ? {
                canEditRegulations: false,
                canEditDirections: false,
                allowedDirectionIds: [],
              }
            : null,
        recordBookNumber: null,
        studentCardNumber: null,
      },
      faculties
    );
    dispatch(setUsers([...users, newUser]));
    const createdRemote = await dataApi
      .createUser({
        ...newUser,
        password: form.password || 'demo123',
      })
      .catch((error) => {
        setRequestError(error.message || 'Не удалось создать пользователя');
        return null;
      });
    if (createdRemote?.id) {
      dispatch(
        setUsers([
          ...users.filter((u) => u.id !== newUser.id && u.id !== createdRemote.id),
          migrateUser(createdRemote, faculties),
        ])
      );
    }
    const historyEntry = createHistoryEntry({
      category: 'admin.users',
      action: 'create',
      summary: `Создан пользователь: ${formatFullName(newUser)} (${ROLE_LABELS[mode]})`,
      userId: currentUser.id,
      userName: formatFullName(currentUser),
      targetId: createdRemote?.id || newUser.id,
      metadata: { role: mode, email: newUser.email },
    });
    dispatch(setHistory([historyEntry, ...history]));
    await dataApi.saveHistoryEntry(historyEntry).catch(() => null);
    setForm({
      email: '',
      password: 'demo123',
      role: ROLES.STUDENT,
      lastName: '',
      firstName: '',
      middleName: '',
    });
    setHasNoMiddleName(false);
    setMiddleNameDraft('');
  };

  const removeUser = async (id) => {
    if (id === currentUser?.id) {
      alert('Нельзя удалить текущего администратора');
      return;
    }
    if (!confirm('Удалить пользователя?')) return;
    const removed = users.find((u) => u.id === id);
    dispatch(setUsers(users.filter((u) => u.id !== id)));
    setRequestError('');
    await dataApi.deleteUser(id).catch((error) => {
      setRequestError(error.message || 'Не удалось удалить пользователя');
      return null;
    });
    if (removed) {
      const historyEntry = createHistoryEntry({
        category: 'admin.users',
        action: 'delete',
        summary: `Удалён пользователь: ${formatFullName(removed)} (${ROLE_LABELS[removed.role]})`,
        userId: currentUser.id,
        userName: formatFullName(currentUser),
        targetId: id,
        metadata: { role: removed.role, email: removed.email },
      });
      dispatch(setHistory([historyEntry, ...history]));
      await dataApi.saveHistoryEntry(historyEntry).catch(() => null);
    }
  };

  const facultyGroups = (facultyId) =>
    groups.filter((g) => g.facultyId === facultyId);

  return (
    <DashboardLayout sidebarItems={adminSidebar} sidebarTitle="Администрирование">
      <header className="page-header">
        <h1>
          {mode === ROLES.STUDENT
            ? 'Студенты'
            : mode === ROLES.COMMISSION
              ? 'Члены комиссии'
              : 'Администраторы'}
        </h1>
        <p>
          {mode === ROLES.STUDENT
            ? 'Учётные записи студентов. Факультет, группа, зачётная книжка и студенческий билет задаются здесь.'
            : mode === ROLES.COMMISSION
              ? 'Учётные записи членов комиссии и их полномочия.'
              : 'Учётные записи администраторов системы.'}
        </p>
      </header>
      {requestError && <div className="alert alert--error">{requestError}</div>}

      <div className="card editor-block">
        <h3 style={{ marginTop: 0 }}>
          {mode === ROLES.STUDENT
            ? 'Добавить студента'
            : mode === ROLES.COMMISSION
              ? 'Добавить члена комиссии'
              : 'Добавить администратора'}
        </h3>
        <form className="inline-form inline-form--users" onSubmit={addUser}>
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
              onChange={(e) =>
                setForm({ ...form, lastName: sanitizePersonNameInput(e.target.value) })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Имя</label>
            <input
              value={form.firstName}
              onChange={(e) =>
                setForm({ ...form, firstName: sanitizePersonNameInput(e.target.value) })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Отчество</label>
            <input
              value={form.middleName}
              onChange={(e) =>
                setForm({ ...form, middleName: sanitizePersonNameInput(e.target.value) })
              }
              disabled={hasNoMiddleName}
            />
            <label
              className="form-group__checkbox"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.45rem',
              }}
            >
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
          <div className="form-group">
            <label>Роль</label>
            <input value={ROLE_LABELS[mode]} disabled />
          </div>
          <button type="submit" className="btn btn--primary btn--sm inline-form__submit">
            Добавить
          </button>
        </form>
      </div>

      <div className="table-wrap" style={{ marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <SortableHeader
                  label="ФИО"
                  sortKey="fullName"
                  sortState={sortState}
                  onToggle={(key) => setSortState(toggleSortState(sortState, key))}
                />
              </th>
              <th>
                <SortableHeader
                  label="Email"
                  sortKey="email"
                  sortState={sortState}
                  onToggle={(key) => setSortState(toggleSortState(sortState, key))}
                />
              </th>
              <th>
                <SortableHeader
                  label="Факультет / группа"
                  sortKey="facultyGroup"
                  sortState={sortState}
                  onToggle={(key) => setSortState(toggleSortState(sortState, key))}
                />
              </th>
              <th>
                <SortableHeader
                  label="Роль"
                  sortKey="role"
                  sortState={sortState}
                  onToggle={(key) => setSortState(toggleSortState(sortState, key))}
                />
              </th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  Список пуст
                </td>
              </tr>
            )}
            {sortedUsers.map((u) => (
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
                  <td>{ROLE_LABELS[u.role]}</td>
                  <td>
                    <div className="table-actions">
                      {(u.role === ROLES.STUDENT ||
                        u.role === ROLES.COMMISSION ||
                        u.role === ROLES.ADMIN) && (
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => startEdit(u)}
                        >
                          {u.role === ROLES.STUDENT
                            ? 'Учёба'
                            : u.role === ROLES.COMMISSION
                              ? 'Полномочия'
                              : 'Настройки'}
                        </button>
                      )}
                      {u.id !== currentUser?.id && (
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          onClick={() => removeUser(u.id)}
                        >
                          Удалить
                        </button>
                      )}
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
                            <div className="form-row form-row--3">
                              <div className="form-group">
                                <label>Фамилия</label>
                                <input
                                  value={editForm.lastName}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      lastName: sanitizePersonNameInput(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div className="form-group">
                                <label>Имя</label>
                                <input
                                  value={editForm.firstName}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      firstName: sanitizePersonNameInput(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div className="form-group">
                                <label>Отчество</label>
                                <input
                                  value={editForm.middleName}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      middleName: sanitizePersonNameInput(e.target.value),
                                    })
                                  }
                                  disabled={editForm.hasNoMiddleName}
                                />
                                <label
                                  style={{
                                    marginTop: '0.4rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={editForm.hasNoMiddleName}
                                    onChange={(e) => toggleEditMiddleName(e.target.checked)}
                                  />
                                  Нет отчества
                                </label>
                              </div>
                            </div>
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
                            <div className="form-row form-row--3">
                              <div className="form-group">
                                <label>Фамилия</label>
                                <input
                                  value={editForm.lastName}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      lastName: sanitizePersonNameInput(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div className="form-group">
                                <label>Имя</label>
                                <input
                                  value={editForm.firstName}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      firstName: sanitizePersonNameInput(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div className="form-group">
                                <label>Отчество</label>
                                <input
                                  value={editForm.middleName}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      middleName: sanitizePersonNameInput(e.target.value),
                                    })
                                  }
                                  disabled={editForm.hasNoMiddleName}
                                />
                                <label
                                  style={{
                                    marginTop: '0.4rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={editForm.hasNoMiddleName}
                                    onChange={(e) => toggleEditMiddleName(e.target.checked)}
                                  />
                                  Нет отчества
                                </label>
                              </div>
                            </div>
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
                        {u.role === ROLES.ADMIN && (
                          <>
                            <div className="form-row form-row--3">
                              <div className="form-group">
                                <label>Фамилия</label>
                                <input
                                  value={editForm.lastName}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      lastName: sanitizePersonNameInput(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div className="form-group">
                                <label>Имя</label>
                                <input
                                  value={editForm.firstName}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      firstName: sanitizePersonNameInput(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div className="form-group">
                                <label>Отчество</label>
                                <input
                                  value={editForm.middleName}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      middleName: sanitizePersonNameInput(e.target.value),
                                    })
                                  }
                                  disabled={editForm.hasNoMiddleName}
                                />
                                <label
                                  style={{
                                    marginTop: '0.4rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={editForm.hasNoMiddleName}
                                    onChange={(e) => toggleEditMiddleName(e.target.checked)}
                                  />
                                  Нет отчества
                                </label>
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
