import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from './api.js';

export default function SheetDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [tabs, setTabs] = useState([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/api/sheets/${id}/tabs`);
      setTabs(data.items || []);
    } catch (e) {
      setError('Failed to load inner sheets');
      setTabs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const openSheetUrl = `https://docs.google.com/spreadsheets/d/${id}/edit`;

  const filteredTabs = useMemo(() => {
    if (!query) return tabs;
    const q = query.toLowerCase();
    return tabs.filter(t => (t.title || '').toLowerCase().includes(q));
  }, [tabs, query]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4">
      <div className="flex items-center gap-3">
        <Link to="/" className="btn btn-outline">← Back</Link>
        <a href={openSheetUrl} target="_blank" rel="noreferrer"><button className="btn btn-primary">Open spreadsheet</button></a>
        <button className="btn btn-secondary" onClick={load}>Refresh</button>
      </div>
      <h2 className="text-lg font-semibold">Inner sheets</h2>
      <div className="flex items-center gap-3">
        <input
          value={query}
          onChange={(e)=> setQuery(e.target.value)}
          placeholder="Search by title"
          className="min-w-[220px]"
        />
        <div className="text-xs text-gray-600 dark:text-gray-400">Showing: {filteredTabs.length}</div>
      </div>
      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div style={{color:'#b91c1c'}}>{error}</div>
      ) : tabs.length === 0 ? (
        <div>No inner sheets</div>
      ) : filteredTabs.length === 0 ? (
        <div>No results for "{query}"</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3">
          {filteredTabs.map((t, i) => {
            const tabUrl = `https://docs.google.com/spreadsheets/d/${id}/edit?gid=${t.gid}#gid=${t.gid}`;
            return (
              <div key={i} className="tile-sub">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="font-semibold">{t.title}</div>
                  <a href={tabUrl} target="_blank" rel="noreferrer"><button className="btn btn-secondary">Open tab</button></a>
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
          })}
        </div>
      )}
    </div>
  );
}


