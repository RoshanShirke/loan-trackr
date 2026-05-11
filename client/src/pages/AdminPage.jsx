import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Shield, Users, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/formatters';
import './Admin.css';

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      navigate('/dashboard');
      return;
    }

    async function fetchUsers() {
      try {
        const res = await api.get('/user/all');
        setUsers(res.users);
      } catch (err) {
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [isAuthenticated, user, navigate]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" style={{ width: 48, height: 48 }} />
      </div>
    );
  }

  return (
    <div className="admin-page animate-fadeIn">
      <header className="admin-header glass-card">
        <div className="admin-header-content">
          <div>
            <button className="btn btn-ghost btn-back" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={18} /> Back to Dashboard
            </button>
            <h1 className="admin-title">
              <Shield className="admin-icon" size={28} />
              Admin's Corner
            </h1>
            <p className="admin-subtitle">Manage registered users on LoanTrackr</p>
          </div>
          <div className="admin-stats">
            <div className="stat-pill">
              <Users size={16} />
              <span>{users.length} Total Users</span>
            </div>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="glass-card table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={u.is_admin ? 'is-admin-row' : ''}>
                  <td>
                    <strong>{u.user_id}</strong>
                    {u.is_admin ? <span className="admin-badge">ADMIN</span> : null}
                  </td>
                  <td>{u.first_name} {u.last_name}</td>
                  <td>{u.email}</td>
                  <td>{u.mobile}</td>
                  <td>
                    {u.is_verified ? (
                      <span className="status-badge verified"><CheckCircle size={14}/> Verified</span>
                    ) : (
                      <span className="status-badge unverified"><XCircle size={14}/> Pending</span>
                    )}
                  </td>
                  <td>{formatDate(u.created_at)}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-state">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
