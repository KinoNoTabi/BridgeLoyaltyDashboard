import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import SheetDetail from './SheetDetail.jsx';
import ClientConfig from './ClientConfig.jsx';
import api from './api.js';

function Navbar({ user, onSignOut }) {
  const [configured, setConfigured] = useState(false);
  useEffect(() => {
    if (user) return; // not needed when signed in
    (async () => {
      try {
        const { data } = await api.get('/auth/client-config');
        setConfigured(Boolean(data.configured));
      } catch (e) {
        setConfigured(false);
      }
    })();
  }, [user]);
  return (
    <nav className="sticky top-0 z-10 border-b border-indigo-100 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow dark:from-indigo-700 dark:to-violet-700">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link to="/" className="text-base font-semibold tracking-tight text-white">Sheets Dashboard</Link>
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              {user.photo && (
                <img src={user.photo} alt="profile" className="h-8 w-8 rounded-full ring-2 ring-white/40" />
              )}
              <span className="text-sm text-white/90">{user.name}</span>
              <button className="btn btn-outline !border-white/40 !bg-transparent !text-white hover:!bg-white/10" onClick={onSignOut}>Sign out</button>
            </>
          ) : (
            <>
              <Link to="/setup"><button className="btn btn-outline">Setup OAuth</button></Link>
              {configured && (
                <a href="/auth/login"><button className="btn btn-primary">Sign in with Google</button></a>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function SheetCard({ sheet, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [tabs, setTabs] = useState([]);
  const [tabsLoading, setTabsLoading] = useState(false);
  const openUrl = `https://docs.google.com/spreadsheets/d/${sheet.id}/edit`;
  async function toggleExpand() {
    if (!expanded) {
      setTabsLoading(true);
      try {
        const { data } = await api.get(`/api/sheets/${sheet.id}/tabs`);
        setTabs(data.items || []);
      } catch (e) {
        setTabs([]);
      } finally {
        setTabsLoading(false);
      }
    }
    setExpanded((v) => !v);
  }
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <Link to={`/sheet/${sheet.id}`} target="_blank" rel="noreferrer" className="font-semibold hover:underline">{sheet.name}</Link>
        <div className="text-xs text-gray-500">Last modified: {sheet.modifiedTime ? new Date(sheet.modifiedTime).toLocaleString() : '—'}</div>
      </div>
      <div className="text-xs text-gray-700 dark:text-gray-300">Owner(s): {sheet.owners?.join(', ') || '—'}</div>
      <div className="overflow-x-auto">
        {sheet.preview && sheet.preview.length ? (
          <table className="min-w-[300px] border-collapse">
            <tbody>
              {sheet.preview.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="border border-gray-200 p-1 text-xs dark:border-gray-700">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-xs text-gray-500">Preview unavailable</div>
        )}
      </div>
      <div className="flex gap-2">
        <a href={openUrl} target="_blank" rel="noreferrer"><button className="btn btn-primary">Open</button></a>
        <button className="btn btn-outline" onClick={() => onRefresh(sheet.id)}>Refresh preview</button>
        <Link to={`/sheet/${sheet.id}`} target="_blank" rel="noreferrer"><button className="btn btn-secondary">Open details</button></Link>
      </div>
      {expanded && (
        <div className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-2 dark:border-gray-700">
          <div className="font-semibold">Inner sheets</div>
          {tabsLoading ? (
            <div className="text-xs text-gray-500">Loading inner sheets…</div>
          ) : tabs.length === 0 ? (
            <div className="text-xs text-gray-500">No inner sheets</div>
          ) : (
            tabs.map((t, i) => {
              const tabUrl = `https://docs.google.com/spreadsheets/d/${sheet.id}/edit?gid=${t.gid}#gid=${t.gid}`;
              return (
                <div key={i} className="flex flex-col gap-2 rounded-lg border border-gray-200 p-2 dark:border-gray-700">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold">{t.title}</div>
                    <a href={tabUrl} target="_blank" rel="noreferrer"><button>Open tab</button></a>
                  </div>
                  <div className="overflow-x-auto">
                    {t.preview && t.preview.length ? (
                      <table className="min-w-[300px] border-collapse">
                        <tbody>
                          {t.preview.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="border border-gray-200 p-1 text-xs dark:border-gray-700">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-xs text-gray-500">Preview unavailable</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);

  const navigate = useNavigate();

  const filtered = useMemo(() => sheets, [sheets]);

  async function fetchMe() {
    try {
      const { data } = await api.get('/api/me');
      setUser(data);
    } catch (e) {
      setUser(null);
    }
  }

  async function fetchSheets({ pageArg = page, pageSizeArg = pageSize, queryArg = query } = {}) {
    setLoading(true);
    try {
      const { data } = await api.get('/api/sheets', { params: { page: pageArg, pageSize: pageSizeArg, query: queryArg } });
      setSheets(data.items);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
      setSheets([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  async function refreshPreview(id) {
    try {
      await api.post(`/api/sheets/${id}/refresh`);
      fetchSheets();
    } catch (e) {
      console.error(e);
    }
  }

  function onSignOut() {
    window.location.href = '/auth/logout';
  }

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    fetchSheets({ pageArg: 1, pageSizeArg: pageSize, queryArg: query });
    setPage(1);
  }, [query, pageSize]);

  useEffect(() => {
    fetchSheets({ pageArg: page });
  }, [page]);

  return (
    <div className="min-h-screen">
      <Navbar user={user} onSignOut={onSignOut} />
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4">
        <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search by title" className="min-w-[220px]" />
        <button className="btn btn-outline" onClick={()=>fetchSheets()}>Refresh all</button>
        <div className="ml-auto text-xs text-gray-600 dark:text-gray-400">Total: {total} • Showing: {filtered.length}</div>
      </div>
      {loading ? (
        <div className="px-4 py-4">Loading…</div>
      ) : (
        <div className="mx-auto grid max-w-7xl grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 px-4 pb-6">
          {filtered.map((s)=> (
            <div className="tile tile-accent">
              <SheetCard key={s.id} sheet={s} onRefresh={refreshPreview} />
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-center gap-3 px-4 py-4">
        <button className="btn btn-outline" onClick={()=> setPage((p)=> Math.max(1, p - 1))} disabled={page===1}>Prev</button>
        <div>Page {page}</div>
        <button className="btn btn-primary" onClick={()=> setPage((p)=> p + 1)} disabled={filtered.length === 0}>Next</button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/sheet/:id" element={<SheetDetail />} />
      <Route path="/setup" element={<ClientConfig />} />
    </Routes>
  );
}


