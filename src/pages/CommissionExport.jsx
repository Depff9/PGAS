import DashboardLayout from '../layouts/DashboardLayout';
import { commissionSidebar } from '../config/navigation';
import { useAppSelector } from '../store/hooks';
import { buildExportRows, downloadXlsx, printPdfReport } from '../utils/exportReport';

export default function CommissionExport() {
  const submissions = useAppSelector((s) => s.data.submissions);
  const achievements = useAppSelector((s) => s.data.achievements);
  const users = useAppSelector((s) => s.data.users);
  const directions = useAppSelector((s) => s.data.directions);
  const faculties = useAppSelector((s) => s.data.faculties);

  const rows = buildExportRows(submissions, achievements, users, directions, faculties);

  return (
    <DashboardLayout sidebarItems={commissionSidebar} sidebarTitle="Комиссия">
      <header className="page-header">
        <h1>Экспорт ведомости</h1>
        <p>Выгрузка заявлений на ПГАС для комиссии и профкома</p>
      </header>

      <div className="card">
        <p>
          Строк в ведомости: <strong>{rows.length}</strong> (достижения внутри заявлений)
        </p>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() =>
              downloadXlsx(`pgas-vedomost-${new Date().toISOString().slice(0, 10)}.xlsx`, rows)
            }
          >
            Скачать Excel (.xlsx)
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => printPdfReport(rows)}
          >
            PDF (печать)
          </button>
        </div>
        <p className="form-hint">
          Файл Excel в формате .xlsx. PDF — через диалог печати браузера («Сохранить как PDF»).
        </p>
      </div>
    </DashboardLayout>
  );
}
