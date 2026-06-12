import { useState } from 'react';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler eşleşmiyor');
      return;
    }

    if (newPassword === currentPassword) {
      setError('Yeni şifre mevcut şifreden farklı olmalı');
      return;
    }

    setLoading(true);
    try {
      await client.patch('/auth/change-password', { currentPassword, newPassword });
      setSuccess('Şifreniz başarıyla güncellendi');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Şifre güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Profil</h2>
        <p>Hesap bilgileri ve şifre yönetimi</p>
      </div>

      <div className="table-card" style={{ maxWidth: 480, marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem' }}>Hesap Bilgileri</h3>
        <div className="form-group">
          <label>Ad Soyad</label>
          <input value={user?.fullName || ''} disabled />
        </div>
        <div className="form-group">
          <label>E-posta</label>
          <input value={user?.email || ''} disabled />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Rol</label>
          <input value={user?.role === 'admin' ? 'Yönetici' : 'Çalışan'} disabled />
        </div>
      </div>

      <div className="table-card" style={{ maxWidth: 480 }}>
        <h3 style={{ margin: '0 0 1rem' }}>Şifre Değiştir</h3>
        {error && <div className="error" style={{ background: '#fee2e2', color: '#dc2626', padding: '0.5rem', borderRadius: 4, marginBottom: '1rem' }}>{error}</div>}
        {success && <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.5rem', borderRadius: 4, marginBottom: '1rem' }}>{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Mevcut Şifre</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Yeni Şifre</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Yeni Şifre (Tekrar)</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
          </button>
        </form>
      </div>
    </div>
  );
}
