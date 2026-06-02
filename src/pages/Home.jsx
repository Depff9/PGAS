import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAppSelector } from '../store/hooks';
import { ROLES } from '../mock/users';
import { UNIVERSITY } from '../config/university';

export default function Home() {
  const user = useAppSelector((s) => s.auth.user);
  const directions = useAppSelector((s) => s.data.directions).filter((d) => d.active);
  const regulations = useAppSelector((s) => s.data.regulations);
  const deadlineSection = regulations.sections?.find((s) => s.id === 'r2');

  const ctaTo =
    user?.role === ROLES.ADMIN
      ? '/admin'
      : user?.role === ROLES.COMMISSION
        ? '/commission'
        : user
          ? '/application/workspace'
          : '/register';

  const deadlineText =
    deadlineSection?.content?.match(/\d{1,2}\s+\w+/)?.[0] || '30 ноября';

  return (
    <div className="app-shell">
      <Navbar />
      <section className="hero">
        <div className="container hero__inner">
          <div>
            <p className="hero__org">{UNIVERSITY.officialName}</p>
            <h1>
              Подача заявлений на повышенную государственную академическую стипендию
            </h1>
            <p>
              Электронный сервис {UNIVERSITY.shortName} для учёта достижений, подачи заявлений
              и отслеживания рейтинга внутри вашего факультета.
            </p>
            <div className="hero__actions">
              <Link to={ctaTo} className="btn btn--primary">
                {user ? 'Перейти в систему' : 'Зарегистрироваться'}
              </Link>
              <a href="#directions" className="btn btn--ghost">
                Направления ПГАС
              </a>
            </div>
          </div>
          <div className="hero__card">
            <h3>Что важно студенту</h3>
            <div className="hero__stats">
              <div className="hero__stat">
                <strong>5</strong>
                <span>направлений для заявлений</span>
              </div>
              <div className="hero__stat">
                <strong>до {deadlineText}</strong>
                <span>срок подачи в этом году</span>
              </div>
              <div className="hero__stat">
                <strong>100+</strong>
                <span>символов в описании достижения</span>
              </div>
              <div className="hero__stat">
                <strong>баллы</strong>
                <span>суммируются в рейтинг факультета</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features container">
        <h2>Как подать заявление</h2>
        <ol className="steps-list">
          <li>
            <strong>Войдите или зарегистрируйтесь</strong> — учётная запись привязывается к
            факультету и группе администратором вуза.
          </li>
          <li>
            <strong>Изучите регламент</strong> — сроки, требования к описанию и документам в
            разделе{' '}
            <Link to="/regulations">«Регламент»</Link>.
          </li>
          <li>
            <strong>Выберите направление</strong> — учебная, научная, общественная,
            культурно-массовая или спортивная деятельность.
          </li>
          <li>
            <strong>Заполните одно заявление</strong> — внутри таблица достижений по
            направлениям (лимит задаёт комиссия в регламенте).
          </li>
          <li>
            <strong>Следите за статусом</strong> — в «Мои заявления» и в{' '}
            <Link to="/rating">рейтинге</Link> факультета.
          </li>
        </ol>

        <div id="directions" className="direction-grid" style={{ marginTop: '2.5rem' }}>
          <h2 style={{ gridColumn: '1 / -1', margin: 0 }}>Направления ПГАС</h2>
          {(directions.length ? directions : [{ title: 'Загрузка…', description: '' }]).map(
            (d) => (
              <div key={d.id || d.title} className="direction-card">
                <h3>{d.title}</h3>
                <p>{d.description}</p>
                {d.maxScore != null && (
                  <div className="direction-card__meta">Макс. балл: {d.maxScore}</div>
                )}
              </div>
            )
          )}
        </div>

        <footer className="site-footer">
          <p>{UNIVERSITY.officialName}</p>
        </footer>
      </section>
    </div>
  );
}
