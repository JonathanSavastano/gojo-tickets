import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';
import type { User, UserRole } from '../types';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await api.registerUser({
        email,
        password,
        display_name: displayName,
      });
      setEmail('');
      setDisplayName('');
      setPassword('');
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete ${u.display_name}?`)) return;
    try {
      await api.deleteUser(u.id);
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleRoleChange = async (u: User, role: UserRole) => {
    try {
      await api.updateUserRole(u.id, role);
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to change role');
    }
  };

  if (user?.role !== 'admin') {
    return <p className="text-muted">You do not have permission to view this page.</p>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Users</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleCreate} className="form">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="user-name">Display Name</label>
                <input
                  id="user-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="user-email">Email</label>
                <input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="user-password">Password</label>
                <input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-muted">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="text-muted">No users found.</p>
      ) : (
        <div className="card">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="users-table-name">{u.display_name}</td>
                  <td className="users-table-email">{u.email}</td>
                  <td>
                    {u.id === user?.id ? (
                      <span className="role-badge">{ROLE_LABELS[u.role]}</span>
                    ) : (
                      <select
                        className="form-input role-select"
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(u, e.target.value as UserRole)
                        }
                      >
                        {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(
                          ([val, label]) => (
                            <option key={val} value={val}>
                              {label}
                            </option>
                          )
                        )}
                      </select>
                    )}
                  </td>
                  <td className="users-table-date">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    {u.id !== user?.id && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(u)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
