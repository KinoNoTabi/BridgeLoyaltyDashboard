import React, { useEffect, useState } from 'react';
import api from './api.js';

export default function ClientConfig() {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [configured, setConfigured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const { data } = await api.get('/auth/client-config');
      setConfigured(Boolean(data.configured));
      if (data.config?.redirectUri) setRedirectUri(data.config.redirectUri);
    } catch (e) {}
  }

  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { clientId, clientSecret };
      if (redirectUri && redirectUri.trim().length > 0) payload.redirectUri = redirectUri.trim();
      await api.post('/auth/client-config', payload);
      setConfigured(true);
    } catch (e) {
      setError('Failed to save. Check values.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-4 text-lg font-semibold">Google OAuth Client Setup</h1>
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">Enter your Google OAuth Client credentials. These are stored only in your session.</p>
      <form onSubmit={save} className="flex flex-col gap-3">
        <input value={clientId} onChange={(e)=>setClientId(e.target.value)} placeholder="Client ID" className="min-w-[220px]" required />
        <input value={clientSecret} onChange={(e)=>setClientSecret(e.target.value)} placeholder="Client Secret" className="min-w-[220px]" required />
        <input value={redirectUri} onChange={(e)=>setRedirectUri(e.target.value)} placeholder="Redirect URI (defaults to server)" className="min-w-[220px]" />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex gap-2">
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          {configured && <a className="btn btn-secondary" href="/auth/login">Sign in with Google</a>}
        </div>
      </form>
    </div>
  );
}


