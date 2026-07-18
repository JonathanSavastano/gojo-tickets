import { Link } from 'react-router-dom';
import type { Ticket } from '../types';
import { STATUS_LABELS, PRIORITY_LABELS, TYPE_LABELS } from '../types';

const PRIORITY_COLORS: Record<string, string> = {
  low: '#6b7280',
  medium: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444',
};

const STATUS_COLORS: Record<string, string> = {
  open: '#6b7280',
  in_progress: '#3b82f6',
  in_review: '#a855f7',
  done: '#22c55e',
  cancelled: '#94a3b8',
};

interface TicketCardProps {
  ticket: Ticket;
}

export default function TicketCard({ ticket }: TicketCardProps) {
  return (
    <Link to={`/tickets/${ticket.id}`} className="ticket-card">
      <div className="ticket-card-header">
        <span className="ticket-key">{ticket.key}</span>
        <span
          className="ticket-priority-dot"
          style={{ backgroundColor: PRIORITY_COLORS[ticket.priority] }}
          title={PRIORITY_LABELS[ticket.priority]}
        />
      </div>
      <div className="ticket-card-title">{ticket.title}</div>
      <div className="ticket-card-footer">
        <span
          className="ticket-status-badge"
          style={{ backgroundColor: STATUS_COLORS[ticket.status] }}
        >
          {STATUS_LABELS[ticket.status]}
        </span>
        <span className="ticket-type-badge">{TYPE_LABELS[ticket.type]}</span>
      </div>
    </Link>
  );
}
