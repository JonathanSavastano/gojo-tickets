import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Project, Ticket, TicketStatus, User, ProjectMember } from '../types';
import { STATUS_LABELS } from '../types';
import TicketCard from '../components/TicketCard';
import TicketForm from '../components/TicketForm';

type ViewMode = 'board' | 'list';
type SortOrder = 'none' | 'asc' | 'desc';

const BOARD_COLUMNS: TicketStatus[] = [
  'open',
  'in_progress',
  'in_review',
  'done',
  'cancelled',
];

const DEFAULT_SORT: Record<TicketStatus, SortOrder> = {
  open: 'none',
  in_progress: 'none',
  in_review: 'none',
  done: 'none',
  cancelled: 'none',
};

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
  const [sortOrders, setSortOrders] = useState<Record<TicketStatus, SortOrder>>(
    DEFAULT_SORT
  );

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

  const handleDeleteDone = async () => {
    if (!confirm('Delete all tickets in the Done column?')) return;
    try {
      await api.deleteDoneTickets(id!);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete done tickets');
    }
  };

  const handleStatusChange = async (
    ticketId: string,
    newStatus: TicketStatus
  ) => {
    await api.updateTicket(ticketId, { status: newStatus });
    await loadData();
  };

  const cycleSort = (status: TicketStatus) => {
    setSortOrders((prev) => {
      const next =
        prev[status] === 'none' ? 'desc' : prev[status] === 'desc' ? 'asc' : 'none';
      return { ...prev, [status]: next };
    });
  };

  const dragCounters = useRef<Map<TicketStatus, number>>(new Map());

  const handleDragEnter = (e: React.DragEvent, status: TicketStatus) => {
    e.preventDefault();
    const count = (dragCounters.current.get(status) || 0) + 1;
    dragCounters.current.set(status, count);
    if (count === 1) {
      (e.currentTarget as HTMLElement).classList.add('board-column-drag-over');
    }
  };

  const handleDragLeave = (e: React.DragEvent, status: TicketStatus) => {
    const count = (dragCounters.current.get(status) || 1) - 1;
    dragCounters.current.set(status, count);
    if (count === 0) {
      (e.currentTarget as HTMLElement).classList.remove('board-column-drag-over');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: TicketStatus) => {
    e.preventDefault();
    dragCounters.current.set(status, 0);
    (e.currentTarget as HTMLElement).classList.remove('board-column-drag-over');
    const ticketId = e.dataTransfer.getData('application/ticket-id');
    const fromStatus = e.dataTransfer.getData('application/ticket-status');
    if (ticketId && fromStatus !== status) {
      handleStatusChange(ticketId, status);
    }
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
            const sortOrder = sortOrders[status];
            const columnTickets = tickets
              .filter((t) => t.status === status)
              .slice()
              .sort((a, b) => {
                if (sortOrder === 'desc') {
                  return b.created_at.localeCompare(a.created_at);
                }
                if (sortOrder === 'asc') {
                  return a.created_at.localeCompare(b.created_at);
                }
                return 0;
              });
            const sortTitle =
              sortOrder === 'none'
                ? 'Sort by newest first'
                : sortOrder === 'desc'
                  ? 'Sorted newest first — click for oldest first'
                  : 'Sorted oldest first — click for default order';
            return (
              <div
                key={status}
                className="board-column"
                onDragEnter={(e) => handleDragEnter(e, status)}
                onDragOver={handleDragOver}
                onDragLeave={(e) => handleDragLeave(e, status)}
                onDrop={(e) => handleDrop(e, status)}
              >
                <div className="board-column-header">
                  <div className="board-column-title">
                    <h3>{STATUS_LABELS[status]}</h3>
                    <button
                      className={`sort-btn ${sortOrder === 'none' ? '' : 'sort-active'}`}
                      title={sortTitle}
                      onClick={() => cycleSort(status)}
                    >
                      {sortOrder === 'desc' ? '▲' : '▼'}
                    </button>
                  </div>
                  <span className="board-column-count">
                    {columnTickets.length}
                  </span>
                  {status === 'done' && columnTickets.length > 0 && (
                    <button
                      className="btn btn-danger btn-sm"
                      title="Delete all done tickets"
                      onClick={handleDeleteDone}
                    >
                      Delete Done
                    </button>
                  )}
                </div>
                <div className="board-column-body">
                  {columnTickets.length === 0 ? (
                    <p className="text-muted text-sm">No tickets</p>
                  ) : (
                    columnTickets.map((ticket) => (
                      <div key={ticket.id} className="board-ticket-wrapper">
                        <TicketCard ticket={ticket} draggable />
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
