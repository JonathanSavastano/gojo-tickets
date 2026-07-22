import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';
import type { User, UserRole, Organization } from '../types';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAdmin = user?.role === 'admin';

  const loadData = async () => {
    try {
      const [usersData, orgData] = await Promise.all([
        api.getUsers(),
        api.getMyOrganization(),
      ]);
      setUsers(usersData);
      setOrg(orgData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await api.createUser({
        email,
        password,
        display_name: displayName,
        role,
      });
      setEmail('');
      setDisplayName('');
      setPassword('');
      setRole('member');
      setShowForm(false);
      await loadData();
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
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleRoleChange = async (u: User, newRole: UserRole) => {
    try {
      await api.updateUserRole(u.id, newRole);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to change role');
    }
  };

  const copyInviteCode = async () => {
    if (!org) return;
    try {
      await navigator.clipboard.writeText(org.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      prompt('Copy this invite code:', org.invite_code);
    }
  };

  if (!user?.org_id) {
    return <p className="text-muted">You are not in an organization.</p>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Users</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {/* Invite Code Section */}
      {org && (
        <div className="card invite-card">
          <div className="invite-header">
            <h3>Invite Code</h3>
            <p className="text-muted">Share this code with people you want to invite to {org.name}.</p>
          </div>
          <div className="invite-code-row">
            <code className="invite-code">{org.invite_code}</code>
            <button className="btn btn-secondary btn-sm" onClick={copyInviteCode}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Create User Form */}
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
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="user-role">Role</label>
                <select
                  id="user-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="form-input"
                >
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                  {isAdmin && <option value="admin">Admin</option>}
                </select>
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

      {/* Users Table */}
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
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="users-table-name">{u.display_name}</td>
                  <td className="users-table-email">{u.email}</td>
                  <td>
                    {u.id === user?.id || !isAdmin ? (
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
                  {isAdmin && (
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
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
