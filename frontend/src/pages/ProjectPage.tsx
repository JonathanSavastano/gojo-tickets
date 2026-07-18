import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../api/client';
import type { Project, Ticket, TicketStatus } from '../types';
import { STATUS_LABELS } from '../types';
import TicketCard from '../components/TicketCard';
import TicketForm from '../components/TicketForm';

type ViewMode = 'board' | 'list';

const BOARD_COLUMNS: TicketStatus[] = [
  'open',
  'in_progress',
  'in_review',
  'done',
  'cancelled',
];

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('board');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [proj, allTickets] = await Promise.all([
        api.getProject(id),
        api.getTickets(),
      ]);
      setProject(proj);
      setTickets(allTickets.filter((t) => t.project_id === id));
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTicket = async (data: Record<string, unknown>) => {
    await api.createTicket({
      ...data,
      project_id: id!,
    } as import('../types').TicketCreate);
    setShowCreateForm(false);
    await loadData();
  };

  const handleStatusChange = async (
    ticketId: string,
    newStatus: TicketStatus
  ) => {
    await api.updateTicket(ticketId, { status: newStatus });
    await loadData();
  };

  if (loading) return <p className="text-muted">Loading...</p>;
  if (!project) return <p className="text-muted">Project not found.</p>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>
            <span className="project-key">{project.key}</span> {project.name}
          </h1>
        </div>
        <div className="page-actions">
          <div className="view-toggle">
            <button
              className={`btn btn-sm ${view === 'board' ? 'btn-active' : ''}`}
              onClick={() => setView('board')}
            >
              Board
            </button>
            <button
              className={`btn btn-sm ${view === 'list' ? 'btn-active' : ''}`}
              onClick={() => setView('list')}
            >
              List
            </button>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : '+ New Ticket'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="card">
          <TicketForm
            onSubmit={handleCreateTicket}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {view === 'board' ? (
        <div className="board">
          {BOARD_COLUMNS.map((status) => {
            const columnTickets = tickets.filter((t) => t.status === status);
            return (
              <div key={status} className="board-column">
                <div className="board-column-header">
                  <h3>{STATUS_LABELS[status]}</h3>
                  <span className="board-column-count">
                    {columnTickets.length}
                  </span>
                </div>
                <div className="board-column-body">
                  {columnTickets.length === 0 ? (
                    <p className="text-muted text-sm">No tickets</p>
                  ) : (
                    columnTickets.map((ticket) => (
                      <div key={ticket.id} className="board-ticket-wrapper">
                        <TicketCard ticket={ticket} />
                        <select
                          className="status-select"
                          value={ticket.status}
                          onChange={(e) =>
                            handleStatusChange(
                              ticket.id,
                              e.target.value as TicketStatus
                            )
                          }
                        >
                          {BOARD_COLUMNS.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="ticket-list">
          {tickets.length === 0 ? (
            <p className="text-muted">No tickets yet.</p>
          ) : (
            tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
