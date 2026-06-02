import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setNotifications } from '../store/dataSlice';
import { NOTIFICATION_TYPES } from '../utils/notifications';

const TYPE_ICON = {
  [NOTIFICATION_TYPES.APPROVED]: '✅',
  [NOTIFICATION_TYPES.REJECTED]: '❌',
  [NOTIFICATION_TYPES.REVISION]: '✏️',
  [NOTIFICATION_TYPES.DEADLINE]: '⏰',
};

export default function NotificationBell({ userId }) {
  const dispatch = useAppDispatch();
  const all = useAppSelector((s) => s.data.notifications);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const mine = all
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const unread = mine.filter((n) => !n.read).length;

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const markRead = (id) => {
    dispatch(
      setNotifications(
        all.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    );
  };

  const markAllRead = () => {
    dispatch(
      setNotifications(
        all.map((n) => (n.userId === userId ? { ...n, read: true } : n))
      )
    );
  };

  return (
    <div className="notif-bell" ref={ref}>
      <button
        type="button"
        className="notif-bell__btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Уведомления"
      >
        🔔
        {unread > 0 && <span className="notif-bell__badge">{unread}</span>}
      </button>
      {open && (
        <div className="notif-bell__panel">
          <div className="notif-bell__head">
            <strong>Уведомления</strong>
            {unread > 0 && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={markAllRead}>
                Прочитать все
              </button>
            )}
          </div>
          {mine.length === 0 ? (
            <p className="notif-bell__empty">Нет уведомлений</p>
          ) : (
            <ul className="notif-bell__list">
              {mine.map((n) => (
                <li key={n.id} className={n.read ? '' : 'notif-bell__item--unread'}>
                  <Link
                    to={n.link || '/application/workspace'}
                    onClick={() => {
                      markRead(n.id);
                      setOpen(false);
                    }}
                  >
                    <span className="notif-bell__icon">{TYPE_ICON[n.type] || '📌'}</span>
                    <span>
                      <strong>{n.title}</strong>
                      <small>{n.body}</small>
                      <time>{new Date(n.createdAt).toLocaleString('ru-RU')}</time>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
