import Navbar from '../components/Navbar';
import { useAppSelector } from '../store/hooks';
import { ROLES } from '../mock/users';
import { Link } from 'react-router-dom';
import { formatDirectionsCount, getActiveDirections } from '../utils/directions';

const ICONS = { book: '📚', science: '🔬', people: '🤝', palette: '🎨', sport: '🏆' };

export default function Directions() {
  const user = useAppSelector((s) => s.auth.user);
  const directions = useAppSelector((s) => s.data.directions);
  const activeDirections = getActiveDirections(directions);
  const isStudent = user?.role === ROLES.STUDENT;

  return (
    <div className="app-shell">
      <Navbar />
      <div className="container page-content">
        <header className="page-header">
          <h1>Направления ПГАС</h1>
          <p>{formatDirectionsCount(activeDirections.length)} для подачи заявлений на повышенную стипендию</p>
        </header>

        <div className="direction-grid">
          {activeDirections.map((d) => (
            <article key={d.id} className="direction-card">
              <h3>
                {ICONS[d.icon] || '📌'} {d.title}
              </h3>
              <p>{d.description}</p>
              <div className="direction-card__meta">
                При оценке учитываются подтвержденные достижения
              </div>
            </article>
          ))}
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
