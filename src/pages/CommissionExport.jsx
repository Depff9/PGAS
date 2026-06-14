import DashboardLayout from '../layouts/DashboardLayout';
import { commissionSidebar } from '../config/navigation';
import { useAppSelector } from '../store/hooks';
import { useMemo, useState } from 'react';
import { buildExportRows, downloadDoc, downloadXlsx, printPdfReport } from '../utils/exportReport';

export default function CommissionExport() {
  const submissions = useAppSelector((s) => s.data.submissions);
  const achievements = useAppSelector((s) => s.data.achievements);
  const users = useAppSelector((s) => s.data.users);
  const directions = useAppSelector((s) => s.data.directions);
  const faculties = useAppSelector((s) => s.data.faculties);

  const rows = buildExportRows(submissions, achievements, users, directions, faculties);
  const columnDefs = [
    { id: 'student', label: 'Студент' },
    { id: 'group', label: 'Группа' },
    { id: 'faculty', label: 'Факультет' },
    { id: 'submissionStatus', label: 'Статус заявления' },
    { id: 'totalScore', label: 'Сумма баллов' },
    { id: 'direction', label: 'Направление' },
    { id: 'slot', label: '№ достижения' },
    { id: 'title', label: 'Достижение' },
    { id: 'achievementStatus', label: 'Статус достижения' },
    { id: 'score', label: 'Баллы комиссии' },
    { id: 'level', label: 'Уровень достижения' },
  ];
  const [enabledColumns, setEnabledColumns] = useState(
    columnDefs.map((c) => c.id)
  );

  const filteredRows = useMemo(
    () => rows,
    [rows]
  );
  const selectedColumns = columnDefs.filter((c) => enabledColumns.includes(c.id));
  const canExport = selectedColumns.length > 0;
  const exportGuard = (fn) => {
    if (!canExport) {
      alert('Выберите хотя бы одно поле для экспорта');
      return;
    }
    fn();
  };

  return (
    <DashboardLayout sidebarItems={commissionSidebar} sidebarTitle="Кабинет комиссии">
      <header className="page-header">
        <h1>Экспорт ведомости</h1>
        <p>Выгрузка заявлений на ПГАС для комиссии и профкома. Включает все направления и периоды вне зависимости от ваших прав на рассмотрение.</p>
      </header>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Редактор таблицы экспорта</h3>
        <div className="template-chips" style={{ marginBottom: '1rem' }}>
          {columnDefs.map((col) => {
            const selected = enabledColumns.includes(col.id);
            return (
              <button
                key={col.id}
                type="button"
                className={'direction-tab' + (selected ? ' direction-tab--active' : '')}
                onClick={() =>
                  setEnabledColumns((prev) =>
                    selected ? prev.filter((id) => id !== col.id) : [...prev, col.id]
                  )
                }
              >
                {col.label}
              </button>
            );
          })}
        </div>
        <p>
          Строк в ведомости: <strong>{filteredRows.length}</strong> (достижения внутри заявлений)
        </p>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() =>
              exportGuard(() =>
                downloadXlsx(
                `pgas-vedomost-${new Date().toISOString().slice(0, 10)}.xlsx`,
                filteredRows,
                selectedColumns
                )
              )
            }
          >
            Скачать Excel (.xlsx)
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => exportGuard(() => printPdfReport(filteredRows, selectedColumns))}
          >
            PDF (печать)
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() =>
              exportGuard(() =>
                downloadDoc(
                `pgas-vedomost-${new Date().toISOString().slice(0, 10)}.docx`,
                filteredRows,
                selectedColumns
                )
              )
            }
          >
            Word (.docx)
          </button>
        </div>
        <p className="form-hint">
          Excel (.xlsx), PDF через печать браузера и Word-документ для дальнейшего редактирования.
        </p>
      </div>
    </DashboardLayout>
  );
}
