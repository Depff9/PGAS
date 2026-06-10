import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TooltipInfo from '../components/TooltipInfo';
import { useAppSelector } from '../store/hooks';
import { ROLES } from '../mock/users';
import { UNIVERSITY } from '../config/university';

function getDeadlineLabel(regulations) {
  const deadlineSection = regulations.sections?.find((s) => s.id === 'r2');
  const content = deadlineSection?.content || '';
  const explicit = content.match(/по\s+(\d{1,2}\s+\S+)/i)?.[1];
  if (explicit) return explicit;

  const allDates = [...content.matchAll(/(\d{1,2}\s+\S+)/g)].map((m) => m[1]);
  return allDates.at(-1) || '30 ноября';
}

export default function Home() {
  const user = useAppSelector((s) => s.auth.user);
  const regulations = useAppSelector((s) => s.data.regulations);

  const ctaTo =
    user?.role === ROLES.ADMIN
      ? '/admin'
      : user?.role === ROLES.COMMISSION
        ? '/commission'
        : user
          ? '/application/workspace'
          : '/register';

  const deadlineText = getDeadlineLabel(regulations);

  return (
    <div className="app-shell">
      <Navbar />
      <section className="hero">
        <div className="container hero__inner">
          <div>
            <p className="hero__org">{UNIVERSITY.officialName}</p>
            <h1>
              Подача заявлений на повышенную государственную академическую стипендию
              <TooltipInfo fieldKey="home.heroTitle" />
            </h1>
            <p>
              Электронный сервис {UNIVERSITY.shortName} для учёта достижений, подачи заявлений
              и отслеживания рейтинга внутри вашего факультета.
            </p>
            <div className="hero__actions">
              <Link to={ctaTo} className="btn btn--primary">
                <TooltipInfo fieldKey="home.goToSystem" />
                {user ? 'Перейти в систему' : 'Зарегистрироваться'}
              </Link>
              <Link to="/directions" className="btn btn--ghost">
                <TooltipInfo fieldKey="home.goToDirections" />
                Направления ПГАС
              </Link>
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
                <TooltipInfo fieldKey="home.deadline" />
                <span>срок подачи в этом году</span>
              </div>
              <div className="hero__stat">
                <strong>1</strong>
                <span>заявление на студента за семестр</span>
              </div>
              <div className="hero__stat">
                <strong>статусы</strong>
                <span>решения комиссии видны в личном кабинете</span>
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
            культурно-творческая или спортивная деятельность.
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

        <footer className="site-footer">
          <p>{UNIVERSITY.officialName}</p>
        </footer>
      </section>
    </div>
  );
}
