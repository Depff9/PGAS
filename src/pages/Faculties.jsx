import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { adminSidebar } from '../config/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setFaculties } from '../store/dataSlice';
import { dataApi } from '../api/dataApi';

export default function Faculties() {
  const dispatch = useAppDispatch();
  const faculties = useAppSelector((s) => s.data.faculties);
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');

  const add = async (e) => {
    e.preventDefault();
    const item = { id: 'f' + Date.now(), name: name.trim(), shortName: shortName.trim() };
    dispatch(
      setFaculties([
        ...faculties,
        item,
      ])
    );
    await dataApi.createFaculty(item).catch(() => null);
    setName('');
    setShortName('');
  };

  const remove = async (id) => {
    dispatch(setFaculties(faculties.filter((f) => f.id !== id)));
    await dataApi.deleteFaculty(id).catch(() => null);
  };

  const update = async (id, field, value) => {
    const updated = faculties.map((f) => (f.id === id ? { ...f, [field]: value } : f));
    dispatch(
      setFaculties(updated)
    );
    const changed = updated.find((f) => f.id === id);
    await dataApi.updateFaculty(id, changed).catch(() => null);
  };

  return (
    <DashboardLayout sidebarItems={adminSidebar} sidebarTitle="Администрирование">
      <header className="page-header">
        <h1>Факультеты</h1>
        <p>Справочник факультетов и институтов</p>
      </header>

      <div className="card">
        <form className="inline-form" onSubmit={add}>
          <div className="form-group">
            <label>Название</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Краткое</label>
            <input value={shortName} onChange={(e) => setShortName(e.target.value)} required />
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
              <th>Название</th>
              <th>Краткое имя</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {faculties.map((f) => (
              <tr key={f.id}>
                <td>
                  <input
                    value={f.name}
                    onChange={(e) => update(f.id, 'name', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={f.shortName}
                    onChange={(e) => update(f.id, 'shortName', e.target.value)}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => remove(f.id)}
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
