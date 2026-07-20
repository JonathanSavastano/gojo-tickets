import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Project, Ticket, TicketStatus, User, ProjectMember } from '../types';
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
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('board');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [showMembers, setShowMembers] = useState(false);

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

  const loadMembers = useCallback(async () => {
    if (!id) return;
    try {
      const [membersData, usersData] = await Promise.all([
        api.getProjectMembers(id),
        api.getUsers(),
      ]);
      setMembers(membersData);
      setAllUsers(usersData);
    } catch {
      // ignore
    }
  }, [id]);

  useEffect(() => {
    if ((showMembers || showCreateForm) && id) {
      loadMembers();
    }
  }, [showMembers, showCreateForm, id, loadMembers]);

  const handleAddMember = async () => {
    if (!selectedUserId || !id) return;
    try {
      await api.addProjectMember(id, selectedUserId);
      setSelectedUserId('');
      await loadMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id) return;
    if (!confirm('Remove this member?')) return;
    try {
      await api.removeProjectMember(id, userId);
      await loadMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

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
            users={allUsers}
          />
        </div>
      )}

      {user?.role === 'admin' && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div
            className="members-header"
            onClick={() => setShowMembers(!showMembers)}
          >
            <h3>Members</h3>
            <span className="text-muted">{showMembers ? '▲' : '▼'}</span>
          </div>
          {showMembers && (
            <div className="members-panel">
              <div className="members-add">
                <select
                  className="form-input"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Select a user...</option>
                  {allUsers
                    .filter((u) => !members.some((m) => m.id === u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.display_name} ({u.email})
                      </option>
                    ))}
                </select>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleAddMember}
                  disabled={!selectedUserId}
                >
                  Add
                </button>
              </div>
              {members.length === 0 ? (
                <p className="text-muted">No members yet.</p>
              ) : (
                <div className="members-list">
                  {members.map((m) => (
                    <div key={m.id} className="member-row">
                      <span className="member-name">{m.display_name}</span>
                      <span className="member-email">{m.email}</span>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemoveMember(m.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
