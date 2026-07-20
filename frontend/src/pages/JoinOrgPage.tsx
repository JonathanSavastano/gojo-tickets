import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

export default function JoinOrgPage() {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.joinOrganization(inviteCode);
      await refreshUser();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Gojo Tickets</h1>
        <h2>Join Organization</h2>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: 24, fontSize: 14 }}>
          Enter an invite code to join an existing organization.
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="invite-code">Invite Code</label>
            <input
              id="invite-code"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
              className="form-input"
              placeholder="Paste invite code here"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Organization'}
          </button>
        </form>
        <p className="auth-footer">
          Want to create your own? <Link to="/org/create">Create an organization</Link>
        </p>
      </div>
    </div>
  );
}
