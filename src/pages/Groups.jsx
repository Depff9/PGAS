import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { adminSidebar } from '../config/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setGroups } from '../store/dataSlice';

export default function Groups() {
  const dispatch = useAppDispatch();
  const groups = useAppSelector((s) => s.data.groups);
  const faculties = useAppSelector((s) => s.data.faculties);
  const [name, setName] = useState('');
  const [facultyId, setFacultyId] = useState(faculties[0]?.id || '');

  const add = (e) => {
    e.preventDefault();
    dispatch(setGroups([...groups, { id: 'g' + Date.now(), name: name.trim(), facultyId }]));
    setName('');
  };

  const remove = (id) => {
    dispatch(setGroups(groups.filter((g) => g.id !== id)));
  };

  const facultyName = (id) => faculties.find((f) => f.id === id)?.name || '—';

  return (
    <DashboardLayout sidebarItems={adminSidebar} sidebarTitle="Администрирование">
      <header className="page-header">
        <h1>Группы</h1>
        <p>Учебные группы по факультетам</p>
      </header>

      <div className="card">
        <form className="inline-form" onSubmit={add}>
          <div className="form-group">
            <label>Название группы</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Факультет</label>
            <select value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
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
              <th>Группа</th>
              <th>Факультет</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.id}>
                <td>{g.name}</td>
                <td>{facultyName(g.facultyId)}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => remove(g.id)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
