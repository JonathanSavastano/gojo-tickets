import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Gojo Tickets
      </Link>
      {user && (
        <div className="navbar-right">
          <span className="navbar-user">{user.display_name}</span>
          <button onClick={handleLogout} className="btn btn-sm">
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
