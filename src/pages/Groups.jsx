import { useMemo, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { adminSidebar } from '../config/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setGroups } from '../store/dataSlice';
import { dataApi } from '../api/dataApi';
import SortableHeader from '../components/SortableHeader';
import { sortBySelectors, toggleSortState } from '../utils/tableSort';

export default function Groups() {
  const dispatch = useAppDispatch();
  const groups = useAppSelector((s) => s.data.groups);
  const faculties = useAppSelector((s) => s.data.faculties);
  const [name, setName] = useState('');
  const [facultyId, setFacultyId] = useState(faculties[0]?.id || '');
  const [sortState, setSortState] = useState({ key: 'name', dir: 'asc' });

  const add = async (e) => {
    e.preventDefault();
    const item = { id: 'g' + Date.now(), name: name.trim(), facultyId };
    dispatch(setGroups([...groups, item]));
    await dataApi.createGroup(item).catch(() => null);
    setName('');
  };

  const remove = async (id) => {
    dispatch(setGroups(groups.filter((g) => g.id !== id)));
    await dataApi.deleteGroup(id).catch(() => null);
  };

  const facultyName = (id) => faculties.find((f) => f.id === id)?.name || '—';
  const sortedGroups = useMemo(
    () =>
      sortBySelectors(groups, sortState, {
        name: (g) => g.name,
        faculty: (g) => facultyName(g.facultyId),
      }),
    [groups, sortState, faculties]
  );

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
              <th>
                <SortableHeader
                  label="Группа"
                  sortKey="name"
                  sortState={sortState}
                  onToggle={(key) => setSortState(toggleSortState(sortState, key))}
                />
              </th>
              <th>
                <SortableHeader
                  label="Факультет"
                  sortKey="faculty"
                  sortState={sortState}
                  onToggle={(key) => setSortState(toggleSortState(sortState, key))}
                />
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedGroups.map((g) => (
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
