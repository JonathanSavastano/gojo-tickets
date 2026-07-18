import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Ticket, TicketStatus, TicketPriority, TicketType } from '../types';
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  TYPE_LABELS,
} from '../types';

const STATUSES: TicketStatus[] = [
  'open',
  'in_progress',
  'in_review',
  'done',
  'cancelled',
];
const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'critical'];
const TYPES: TicketType[] = ['bug', 'task', 'story', 'improvement'];

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TicketStatus>('open');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [type, setType] = useState<TicketType>('task');
  const [saving, setSaving] = useState(false);

  const loadTicket = useCallback(async () => {
    if (!id) return;
    try {
      const t = await api.getTicket(id);
      setTicket(t);
      setTitle(t.title);
      setDescription(t.description || '');
      setStatus(t.status);
      setPriority(t.priority);
      setType(t.type);
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateTicket(id!, {
        title,
        description: description || undefined,
        status,
        priority,
        type,
      });
      setEditing(false);
      await loadTicket();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this ticket?')) return;
    await api.deleteTicket(id!);
    navigate(-1);
  };

  if (loading) return <p className="text-muted">Loading...</p>;
  if (!ticket) return <p className="text-muted">Ticket not found.</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>
          <span className="ticket-key">{ticket.key}</span>{' '}
          {editing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input inline-input"
            />
          ) : (
            ticket.title
          )}
        </h1>
        <div className="page-actions">
          {editing ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setEditing(false);
                  setTitle(ticket.title);
                  setDescription(ticket.description || '');
                  setStatus(ticket.status);
                  setPriority(ticket.priority);
                  setType(ticket.type);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                Edit
              </button>
              {user && (
                <button className="btn btn-danger" onClick={handleDelete}>
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="ticket-detail-grid">
        <div className="ticket-detail-main">
          <div className="card">
            <h3>Description</h3>
            {editing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input"
                rows={6}
                placeholder="Add a description..."
              />
            ) : (
              <p className="ticket-description">
                {ticket.description || 'No description provided.'}
              </p>
            )}
          </div>
        </div>

        <div className="ticket-detail-sidebar">
          <div className="card">
            <div className="detail-field">
              <label>Status</label>
              {editing ? (
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TicketStatus)}
                  className="form-input"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="status-badge">{STATUS_LABELS[ticket.status]}</span>
              )}
            </div>

            <div className="detail-field">
              <label>Priority</label>
              {editing ? (
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="form-input"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              ) : (
                <span>{PRIORITY_LABELS[ticket.priority]}</span>
              )}
            </div>

            <div className="detail-field">
              <label>Type</label>
              {editing ? (
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TicketType)}
                  className="form-input"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              ) : (
                <span>{TYPE_LABELS[ticket.type]}</span>
              )}
            </div>

            <div className="detail-field">
              <label>Reporter</label>
              <span>{ticket.reporter_id.slice(0, 8)}...</span>
            </div>

            <div className="detail-field">
              <label>Created</label>
              <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
            </div>

            <div className="detail-field">
              <label>Updated</label>
              <span>{new Date(ticket.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
