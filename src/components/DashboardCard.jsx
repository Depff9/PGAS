import { Link } from 'react-router-dom';

export default function DashboardCard({ title, value, subtitle, icon, to, onClick }) {
  const className = 'dash-card';
  const inner = (
    <>
      {icon && <span className="dash-card__icon" aria-hidden>{icon}</span>}
      <div className="dash-card__body">
        <span className="dash-card__value">{value}</span>
        <span className="dash-card__title">{title}</span>
        {subtitle && <span className="dash-card__sub">{subtitle}</span>}
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}
