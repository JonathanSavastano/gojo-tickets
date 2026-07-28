import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

export default function CreateOrgPage() {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.createOrganization({ name, key: key.toUpperCase() });
      await refreshUser();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Gojo Tickets</h1>
        <h2>Create Organization</h2>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: 24, fontSize: 14 }}>
          Set up a new organization to start managing projects.
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="org-name">Organization Name</label>
            <input
              id="org-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="form-input"
              placeholder="My Company"
            />
          </div>
          <div className="form-group">
            <label htmlFor="org-key">Key (e.g. MYCO)</label>
            <input
              id="org-key"
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
              maxLength={10}
              className="form-input"
              placeholder="MYCO"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Organization'}
          </button>
        </form>
        <p className="auth-footer">
          <Link to="/org/join" className="btn btn-secondary btn-block">
            Join an existing organization with an invite code
          </Link>
        </p>
      </div>
    </div>
  );
}
