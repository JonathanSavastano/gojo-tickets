import { useState, type FormEvent } from 'react';
import type { TicketPriority, TicketType, TicketStatus } from '../types';
import { PRIORITY_LABELS, TYPE_LABELS, STATUS_LABELS } from '../types';

interface TicketFormProps {
  initial?: {
    title?: string;
    description?: string;
    priority?: TicketPriority;
    type?: TicketType;
    status?: TicketStatus;
    assignee_id?: string | null;
  };
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  showStatus?: boolean;
}

export default function TicketForm({
  initial = {},
  onSubmit,
  onCancel,
  submitLabel = 'Create Ticket',
  showStatus = false,
}: TicketFormProps) {
  const [title, setTitle] = useState(initial.title || '');
  const [description, setDescription] = useState(initial.description || '');
  const [priority, setPriority] = useState<TicketPriority>(
    initial.priority || 'medium'
  );
  const [type, setType] = useState<TicketType>(initial.type || 'task');
  const [status, setStatus] = useState<TicketStatus>(
    initial.status || 'open'
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data: Record<string, unknown> = {
        title,
        description: description || undefined,
        priority,
        type,
      };
      if (showStatus) data.status = status;
      if (initial.assignee_id !== undefined) data.assignee_id = initial.assignee_id;
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="form-input"
          rows={4}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            className="form-input"
          >
            {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="type">Type</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as TicketType)}
            className="form-input"
          >
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {showStatus && (
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TicketStatus)}
              className="form-input"
            >
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="form-actions">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
