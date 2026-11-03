import React, { useState } from 'react';
import {
  User,
  Upload,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Bell,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface SettingsViewProps {
  onNavigate: (page: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigate }) => {
  const { user, apiFetch, refreshProfile, clearSession } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Editor & Notification preferences persisted in localStorage
  const [prefFontSize, setPrefFontSize] = useState<string>(
    () => localStorage.getItem('attend_ai_pref_font_size') || '13'
  );
  const [prefTabSize, setPrefTabSize] = useState<string>(
    () => localStorage.getItem('attend_ai_pref_tab_size') || '2'
  );
  const [prefWordWrap, setPrefWordWrap] = useState<boolean>(
    () => localStorage.getItem('attend_ai_pref_word_wrap') !== 'false'
  );
  const [notifStreak, setNotifStreak] = useState<boolean>(
    () => localStorage.getItem('attend_ai_notif_streak') !== 'false'
  );
  const [notifAiReview, setNotifAiReview] = useState<boolean>(
    () => localStorage.getItem('attend_ai_notif_ai') !== 'false'
  );

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto bg-[#121420] border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-white">Account Settings</h2>
        <p className="text-xs text-slate-400">
          Please sign in to edit your profile, upload an avatar, configure editor preferences, or update your password.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('login')}
          className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      setSaving(true);
      const res = await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ fullName, username, bio }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update profile.');
        return;
      }
      if (avatarUrl !== user.avatarUrl && avatarUrl.trim()) {
        await apiFetch('/api/profile/avatar', {
          method: 'POST',
          body: JSON.stringify({ avatarUrl }),
        });
      }
      await refreshProfile();
      setMessage('Profile settings updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUri = String(reader.result || '');
      setAvatarUrl(dataUri);
      await apiFetch('/api/profile/avatar', {
        method: 'POST',
        body: JSON.stringify({ avatarUrl: dataUri }),
      });
      await refreshProfile();
      setMessage('Avatar image uploaded and saved!');
    };
    reader.readAsDataURL(file);
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('attend_ai_pref_font_size', prefFontSize);
    localStorage.setItem('attend_ai_pref_tab_size', prefTabSize);
    localStorage.setItem('attend_ai_pref_word_wrap', String(prefWordWrap));
    localStorage.setItem('attend_ai_notif_streak', String(notifStreak));
    localStorage.setItem('attend_ai_notif_ai', String(notifAiReview));
    setMessage('Editor and notification preferences saved.');
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setSaving(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          recoveryCode: 'RECOVERY-ATTEND-2026',
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update password.');
        return;
      }
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Error updating password.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setSaving(true);
      const res = await apiFetch('/api/profile', { method: 'DELETE' });
      if (res.ok) {
        clearSession();
        onNavigate('landing');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete account.');
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Account Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your profile details, developer avatar, Monaco editor preferences, notifications, and security.
        </p>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/70 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/70 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Edit Profile & Avatar */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-[#121420] border border-slate-800/90 rounded-2xl p-6 space-y-5"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <User className="w-4 h-4 text-indigo-400" />
          <h2>Edit Developer Profile</h2>
        </div>

        {/* Avatar Upload */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-slate-800">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar Preview"
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover bg-indigo-600"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-xl font-bold text-white">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="space-y-2 flex-1">
            <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Avatar Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileAvatarUpload}
                className="hidden"
              />
            </label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Or paste an image URL..."
              className="w-full px-3 py-1.5 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-[#0B0C14] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Developer Bio
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell the community what languages and bugs you enjoy solving..."
            className="w-full px-3 py-2 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </form>

      {/* Editor & Notification Preferences */}
      <form
        onSubmit={handleSavePreferences}
        className="bg-[#121420] border border-slate-800/90 rounded-2xl p-6 space-y-5"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h2>Editor &amp; Notification Preferences</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Default Font Size
            </label>
            <select
              value={prefFontSize}
              onChange={(e) => setPrefFontSize(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white"
            >
              <option value="12">12px (Compact)</option>
              <option value="13">13px (Default)</option>
              <option value="14">14px (Comfortable)</option>
              <option value="16">16px (Large)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Tab Indentation
            </label>
            <select
              value={prefTabSize}
              onChange={(e) => setPrefTabSize(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white"
            >
              <option value="2">2 Spaces</option>
              <option value="4">4 Spaces</option>
            </select>
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="flex items-center gap-2 text-xs text-slate-300 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={prefWordWrap}
                onChange={(e) => setPrefWordWrap(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600"
              />
              <span>Enable Word Wrap in Monaco</span>
            </label>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Bell className="w-3.5 h-3.5 text-indigo-400" />
            <span>Notification Preferences</span>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={notifStreak}
              onChange={(e) => setNotifStreak(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-indigo-600"
            />
            <span>Daily debugging streak reminders</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={notifAiReview}
              onChange={(e) => setNotifAiReview(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-indigo-600"
            />
            <span>Automatically generate local AI review on solution submit</span>
          </label>
        </div>

        <button
          type="submit"
          className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
        >
          Save Preferences
        </button>
      </form>

      {/* Password Reset */}
      <form
        onSubmit={handlePasswordUpdate}
        className="bg-[#121420] border border-slate-800/90 rounded-2xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Lock className="w-4 h-4 text-amber-400" />
          <h2>Change Password</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-3 py-2 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3 py-2 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
        >
          Update Password
        </button>
      </form>

      {/* Session & Account Deletion */}
      <div className="bg-[#121420] border border-slate-800/90 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Sign Out of Attend AI</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Securely end your current session and return to the login screen.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearSession();
              onNavigate('login');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-rose-400">Delete Account</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Permanently delete your account, submissions, XP, and achievements.
            </p>
          </div>
          {!confirmDeleteOpen ? (
            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900/70 border border-rose-800/70 text-rose-300 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={saving}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Confirm Permanent Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="px-3 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
