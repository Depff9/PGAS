import { NavLink } from 'react-router-dom';

export default function Sidebar({ items, title }) {
  return (
    <aside className="sidebar">
      {title && <h2 className="sidebar__title">{title}</h2>}
      <nav className="sidebar__nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              'sidebar__link' + (isActive ? ' sidebar__link--active' : '')
            }
          >
            {item.icon && <span className="sidebar__icon">{item.icon}</span>}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
