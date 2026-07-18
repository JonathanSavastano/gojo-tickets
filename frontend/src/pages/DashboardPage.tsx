import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api/client';
import type { Project } from '../types';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api
      .getProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const project = await api.createProject({ name, key: key.toUpperCase() });
      setProjects((prev) => [...prev, project]);
      setName('');
      setKey('');
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Projects</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleCreate} className="form">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="proj-name">Project Name</label>
                <input
                  id="proj-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="proj-key">Key (e.g. GOJO)</label>
                <input
                  id="proj-key"
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  required
                  maxLength={10}
                  className="form-input"
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-muted">Loading projects...</p>
      ) : projects.length === 0 ? (
        <p className="text-muted">No projects yet. Create one to get started.</p>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <Link
              to={`/projects/${project.id}`}
              key={project.id}
              className="project-card"
            >
              <div className="project-card-key">{project.key}</div>
              <div className="project-card-name">{project.name}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
