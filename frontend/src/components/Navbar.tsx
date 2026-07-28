import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';
import type { Organization } from '../types';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [org, setOrg] = useState<Organization | null>(null);

  useEffect(() => {
    if (user?.org_id) {
      api.getMyOrganization().then(setOrg).catch(() => {});
    }
  }, [user?.org_id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          Gojo Tickets
        </Link>
        {org && (
          <span className="navbar-org-name">{org.name}</span>
        )}
      </div>
      {user && (
        <div className="navbar-right">
          {user.org_id ? (
            <Link to="/admin/users" className="navbar-link">
              Users
            </Link>
          ) : (
            <>
              <Link to="/org/join" className="navbar-link">
                Join Organization
              </Link>
              <Link to="/org/create" className="navbar-link">
                Create Organization
              </Link>
            </>
          )}
          <span className="navbar-user">{user.display_name}</span>
          <button onClick={handleLogout} className="btn btn-sm">
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
