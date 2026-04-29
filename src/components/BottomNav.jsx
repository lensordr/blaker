import { NavLink } from 'react-router-dom'
import { IconHome, IconCalendar, IconBell, IconUser, IconShield } from './Icons'
import useStore from '../store/useStore'

export default function BottomNav() {
  const currentUser = useStore((s) => s.currentUser)
  const getUnreadCount = useStore((s) => s.getUnreadCount)
  const unread = currentUser ? getUnreadCount() : 0

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      <div className="nav-items">
        <NavLink to="/" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} end>
          {({ isActive }) => (
            <>
              {isActive && <span className="nav-active-dot" />}
              <IconHome />
              Home
            </>
          )}
        </NavLink>

        <NavLink to="/events" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          {({ isActive }) => (
            <>
              {isActive && <span className="nav-active-dot" />}
              <IconCalendar />
              Eventos
            </>
          )}
        </NavLink>

        <NavLink to="/notifications" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          {({ isActive }) => (
            <>
              {isActive && <span className="nav-active-dot" />}
              <IconBell />
              {unread > 0 && (
                <span className="nav-badge" aria-label={`${unread} notificaciones`}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
              Avisos
            </>
          )}
        </NavLink>

        {currentUser?.role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            {({ isActive }) => (
              <>
                {isActive && <span className="nav-active-dot" />}
                <IconShield />
                Admin
              </>
            )}
          </NavLink>
        )}

        <NavLink to="/profile" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          {({ isActive }) => (
            <>
              {isActive && <span className="nav-active-dot" />}
              <IconUser />
              Perfil
            </>
          )}
        </NavLink>
      </div>
    </nav>
  )
}
