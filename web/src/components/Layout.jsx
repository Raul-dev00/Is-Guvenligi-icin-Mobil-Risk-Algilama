import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Layout.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', roles: ['admin', 'employee'] },
  { path: '/devices', label: 'Cihazlar', roles: ['admin', 'employee'] },
  { path: '/alarms', label: 'Alarmlar', roles: ['admin', 'employee'] },
  { path: '/map', label: 'Harita İzleme', roles: ['admin'] },
  { path: '/zones', label: 'Tehlikeli Bölgeler', roles: ['admin'] },
  { path: '/profile', label: 'Profil', roles: ['admin', 'employee'] },
];

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <h1>ISG Risk</h1>
          <p>Mobil Risk Algılama</p>
        </div>
        <nav>
          {navItems
            .filter((item) => item.roles.includes(user?.role))
            .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={location.pathname.startsWith(item.path) ? 'active' : ''}
              >
                {item.label}
              </Link>
            ))}
        </nav>
        <div className="user-info">
          <Link to="/profile" style={{ color: '#fff', textDecoration: 'none' }}>{user?.fullName}</Link>
          <small>{isAdmin ? 'Admin' : 'Çalışan'}</small>
          <button onClick={handleLogout}>Çıkış</button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
