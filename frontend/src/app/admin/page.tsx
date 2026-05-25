'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldAlert, UserPlus, Trash2, Shield, X, Check, Download } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { AdminUser } from '../../types/api';
import { Button } from '../../components/ui/Button';
import apiClient from '../../lib/api';

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, isAuthenticated, user: currentUser } = useUserStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create user form state
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.replace('/');
      return;
    }
    loadUsers();
  }, [isAuthenticated, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiClient.adminListUsers();
      setUsers(data);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (u: AdminUser) => {
    setTogglingId(u.id);
    try {
      const updated = await apiClient.adminSetRole(u.id, !u.is_admin);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    } catch {
      setError('Failed to update role.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    setDeletingId(userId);
    try {
      await apiClient.adminDeleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setConfirmDeleteId(null);
    } catch {
      setError('Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const created = await apiClient.adminCreateUser({
        email: newEmail,
        username: newUsername,
        password: newPassword,
        is_admin: newIsAdmin,
      });
      setUsers((prev) => [...prev, created]);
      setNewEmail('');
      setNewUsername('');
      setNewPassword('');
      setNewIsAdmin(false);
      setShowCreate(false);
    } catch (err: any) {
      setCreateError(err?.response?.data?.detail ?? 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="page-container max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShieldAlert size={22} className="text-accent-gold" />
          <h1 className="text-xl font-bold text-text-primary">Admin — User Management</h1>
        </div>
        <a
          href={apiClient.exportEtymologyOverridesUrl()}
          download="etymology_overrides.json"
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary border border-border-default rounded-lg px-3 py-2 hover:bg-bg-elevated transition-colors"
          title="Download DB etymology overrides as etymology_overrides.json"
        >
          <Download size={13} />
          Export overrides
        </a>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-color-error/10 border border-color-error/30 text-color-error text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {/* Create user */}
      <div className="bg-bg-surface border border-border-default rounded-xl mb-5">
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="w-full flex items-center justify-between p-4 text-sm font-medium text-text-primary hover:bg-bg-elevated transition-colors rounded-xl"
        >
          <div className="flex items-center gap-2">
            <UserPlus size={16} className="text-accent-blue" />
            Create new user
          </div>
          <span className="text-text-muted">{showCreate ? '▲' : '▼'}</span>
        </button>

        {showCreate && (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleCreate}
            className="px-4 pb-4 space-y-3 border-t border-border-default pt-4"
          >
            {createError && (
              <p className="text-sm text-color-error">{createError}</p>
            )}
            <input
              required
              type="email"
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border-default bg-bg-input text-text-primary text-sm focus:outline-none focus:border-border-focus"
            />
            <input
              required
              type="text"
              placeholder="Username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border-default bg-bg-input text-text-primary text-sm focus:outline-none focus:border-border-focus"
            />
            <input
              required
              type="password"
              placeholder="Password (min 8 chars)"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border-default bg-bg-input text-text-primary text-sm focus:outline-none focus:border-border-focus"
            />
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={newIsAdmin}
                onChange={(e) => setNewIsAdmin(e.target.checked)}
                className="rounded"
              />
              Grant admin role
            </label>
            <Button type="submit" variant="primary" size="sm" disabled={creating}>
              {creating ? 'Creating…' : 'Create User'}
            </Button>
          </motion.form>
        )}
      </div>

      {/* User list */}
      <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border-default">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest">
            Users ({users.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-text-muted text-sm">Loading…</div>
        ) : (
          <ul className="divide-y divide-border-default">
            {users.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-text-primary truncate">
                      {u.username}
                    </span>
                    {u.id === currentUser?.id && (
                      <span className="text-xs text-text-muted">(you)</span>
                    )}
                    {u.is_admin && (
                      <Shield size={12} className="text-accent-gold flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-text-muted truncate">{u.email}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {u.id !== currentUser?.id && (
                    <>
                      <button
                        onClick={() => handleToggleRole(u)}
                        disabled={togglingId === u.id}
                        title={u.is_admin ? 'Remove admin' : 'Make admin'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.is_admin
                            ? 'text-accent-gold hover:bg-accent-gold/10'
                            : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                        }`}
                      >
                        {togglingId === u.id ? (
                          <Check size={14} />
                        ) : (
                          <Shield size={14} />
                        )}
                      </button>

                      {confirmDeleteId === u.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(u.id)}
                            disabled={deletingId === u.id}
                            className="text-xs px-2 py-1 rounded-lg bg-color-error text-white hover:opacity-90"
                          >
                            {deletingId === u.id ? '…' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs px-2 py-1 rounded-lg border border-border-default text-text-muted hover:text-text-primary"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(u.id)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-color-error hover:bg-color-error/10 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
