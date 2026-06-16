import { NavLink } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { ROLES } from '../mock/users';

export default function Sidebar({ items, title }) {
  const user = useAppSelector((s) => s.auth.user);
  const filteredItems =
    user?.role === ROLES.COMMISSION
      ? items.filter((item) => {
          if (item.to === '/commission/regulations') {
            return user.permissions?.canEditRegulations;
          }
          if (item.to === '/commission/directions') {
            return user.permissions?.canEditDirections;
          }
          return true;
        })
      : items;

  return (
    <aside className="sidebar">
      {title && <h2 className="sidebar__title">{title}</h2>}
      <nav className="sidebar__nav">
        {filteredItems.map((item) => (
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
