import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAppSelector } from '../store/hooks';
import { ROLES } from '../mock/users';

const ICONS = { book: '📚', science: '🔬', people: '🤝', palette: '🎨', sport: '🏆' };

export default function Directions() {
  const user = useAppSelector((s) => s.auth.user);
  const directions = useAppSelector((s) => s.data.directions);
  const regulations = useAppSelector((s) => s.data.regulations);
  const isStudent = user?.role === ROLES.STUDENT;

  return (
    <div className="app-shell">
      <Navbar />
      <div className="container page-content">
        <header className="page-header">
          <h1>Направления ПГАС</h1>
          <p>
            {directions.length} направлений для подачи заявлений на повышенную стипендию
          </p>
        </header>

        <div className="direction-grid">
          {directions.map((d) => (
            <article
              key={d.id}
              className={'direction-card' + (d.active ? '' : ' direction-card--inactive')}
            >
              <h3>
                {ICONS[d.icon] || '📌'} {d.title}
              </h3>
              <p>{d.description}</p>
              <div className="direction-card__meta">
                {d.active
                  ? 'При оценке учитываются подтвержденные достижения'
                  : 'Направление временно закрыто'}
              </div>
            </article>
          ))}
        </div>

        <div className="card" style={{ marginTop: '1.5rem' }}>
          {regulations ? (
            <>
              <h2 style={{ marginTop: 0 }}>{regulations.title}</h2>
              <p className="form-hint">
                Обновлено: {new Date(regulations.updatedAt).toLocaleDateString('ru-RU')}
              </p>
              {regulations.sections?.slice(0, 2).map((s) => (
                <div key={s.id} className="regulation-section regulation-section--readonly">
                  <h3>{s.heading}</h3>
                  <p>{s.content}</p>
                </div>
              ))}
            </>
          ) : (
            <p className="form-hint">Регламент загружается…</p>
          )}
          <Link to="/regulations" className="btn btn--ghost btn--sm">
            Полный регламент →
          </Link>
        </div>

        {isStudent && (
          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <Link to="/application/workspace" className="btn btn--primary">
              Таблица заявления
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
