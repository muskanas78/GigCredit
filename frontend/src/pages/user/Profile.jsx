// pages/user/Profile.jsx
// Edit profile (name + phone) and change password.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { ErrorBox } from '../../components/ui/States.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { fmtDateTime } from '../../utils/format';

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [employerName, setEmployerName] = useState(user?.employerName || '');
  const [employmentType, setEmploymentType] = useState(user?.employmentType || 'salaried');
  const [monthlyIncome, setMonthlyIncome] = useState(user?.monthlyIncome ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setEmployerName(user?.employerName || '');
    setEmploymentType(user?.employmentType || 'salaried');
    setMonthlyIncome(user?.monthlyIncome ?? '');
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    if (name.trim().length < 2) return setProfileError('Name must be at least 2 characters.');
    setSavingProfile(true);
    try {
      await api.users.updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        employerName: employerName.trim() || undefined,
        employmentType,
        monthlyIncome: monthlyIncome === '' ? undefined : Number(monthlyIncome),
      });
      await refreshUser();
      toast.ok('Profile updated');
    } catch (err) { setProfileError(err.message); } finally { setSavingProfile(false); }
  };

  const changePwd = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (newPassword.length < 6) return setPwdError('New password must be at least 6 characters.');
    if (newPassword !== confirmPwd) return setPwdError('New passwords do not match.');
    setSavingPwd(true);
    try {
      await api.auth.changePassword({ oldPassword, newPassword });
      setOldPassword(''); setNewPassword(''); setConfirmPwd('');
      toast.ok('Password changed');
    } catch (err) { setPwdError(err.message); } finally { setSavingPwd(false); }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeletingAccount(true);
    try {
      await api.users.deleteProfile();
      toast.ok('Account deleted');
      logout();
      navigate('/');
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Profile & security"
        subtitle="Update your contact details or rotate your password."
      />

      <div className="grid grid-2" style={{ gap: 22 }}>
        <div className="card">
          <h3 className="card-title">Profile</h3>
          <ErrorBox message={profileError} />
          <form onSubmit={saveProfile}>
            <div className="field"><label>Name</label>
              <input className="input" required minLength={2} maxLength={80}
                value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="field"><label>Phone</label>
              <input className="input" maxLength={30}
                value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 …" /></div>
            <div className="field"><label>Employer name</label>
              <input className="input" maxLength={120}
                value={employerName} onChange={(e) => setEmployerName(e.target.value)}
                placeholder="Company or business name" /></div>
            <div className="field"><label>Employment type</label>
              <select className="select" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
                <option value="salaried">Salaried</option>
                <option value="contract">Contract</option>
                <option value="self_employed">Self-employed</option>
                <option value="student">Student</option>
                <option value="other">Other</option>
              </select></div>
            <div className="field"><label>Monthly income</label>
              <input className="input" type="number" min="0" step="1000"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="Estimated salary or income" /></div>
            <div className="field"><label>Email</label>
              <input className="input" value={user?.email || ''} disabled
                style={{ background: 'rgba(255,255,255,.07)' }} /></div>
            <button className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? <span className="spinner" /> : 'Save profile'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">Change password</h3>
          <ErrorBox message={pwdError} />
          <form onSubmit={changePwd}>
            <div className="field"><label>Current password</label>
              <input className="input" type="password" required value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)} /></div>
            <div className="field"><label>New password</label>
              <input className="input" type="password" required minLength={6} maxLength={80}
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
            <div className="field"><label>Confirm new password</label>
              <input className="input" type="password" required
                value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} /></div>
            <button className="btn btn-primary" disabled={savingPwd}>
              {savingPwd ? <span className="spinner" /> : 'Update password'}
            </button>
          </form>
        </div>
      </div>

      <div className="card flat" style={{ marginTop: 22 }}>
        <h3 className="card-title">Account info</h3>
        <div className="grid grid-3">
          <Info label="Role" value={user?.role || '—'} />
          <Info label="Status" value={user?.status || '—'} />
          <Info label="Member since" value={fmtDateTime(user?.createdAt)} />
          <Info label="Last login" value={user?.lastLogin ? fmtDateTime(user.lastLogin) : '—'} />
          <Info label="Password changed" value={user?.passwordChangedAt ? fmtDateTime(user.passwordChangedAt) : '—'} />
          <Info label="Employer" value={user?.employerName || '—'} />
          <Info label="Employment" value={user?.employmentType || '—'} />
          <Info label="Monthly income" value={user?.monthlyIncome ? `PKR ${Number(user.monthlyIncome).toLocaleString('en-PK')}` : '—'} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 22, borderColor: 'rgba(242,95,92,.25)' }}>
        <h3 className="card-title" style={{ color: 'var(--err)' }}>Delete account</h3>
        <p className="muted">This action is permanent. All data associated with your account will be removed.</p>
        <button
          className="btn"
          style={{ background: 'var(--err)', color: 'white', marginTop: 12 }}
          onClick={() => setShowDeleteModal(true)}
        >
          Delete my account
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => !deletingAccount && setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 10, color: 'var(--err)' }}>Delete account?</h3>
            <p className="muted">
              This will permanently delete your account, wallet, and all transaction history.
              This action <strong>cannot be undone</strong>.
            </p>
            <ErrorBox message={deleteError} />
            <div className="row" style={{ gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingAccount}
              >
                Cancel
              </button>
              <button
                className="btn"
                style={{ background: 'var(--err)', color: 'white' }}
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? <span className="spinner" /> : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999;
        }
        .modal {
          background: var(--surface);
          border: 1px solid var(--line);
          padding: 28px;
          border-radius: 12px;
          max-width: 420px;
          box-shadow: var(--shadow-pop);
        }
      `}</style>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="kpi-label">{label}</div>
      <div style={{ marginTop: 4 }}>{value}</div>
    </div>
  );
}
