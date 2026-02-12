import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { Users, FolderOpen, Upload, FileCheck, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    Promise.all([
      adminApi.getStats(),
      adminApi.getUsers(),
      adminApi.getFeatureFlags(),
    ])
      .then(([s, u, f]) => {
        setStats(s);
        setUsers(u.users || []);
        setFlags(f);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleFlag = async (flag) => {
    try {
      const updated = await adminApi.updateFeatureFlag(flag.id, { enabled: !flag.enabled });
      setFlags(flags.map(f => f.id === flag.id ? updated : f));
    } catch (err) {
      alert(err.message);
    }
  };

  const updateUserField = async (userId, field, value) => {
    try {
      await adminApi.updateUser(userId, { [field]: value });
      const refreshed = await adminApi.getUsers();
      setUsers(refreshed.users || []);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {['overview', 'users', 'flags'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'flags' ? 'Feature Flags' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Users} label="Total Users" value={stats.users.total} sub={`${stats.users.recentSignups} this month`} />
            <StatCard icon={FolderOpen} label="Projects" value={stats.projects.total} />
            <StatCard icon={Upload} label="Uploads" value={stats.uploads.total} sub={`${(stats.uploads.totalBytes / 1024 / 1024).toFixed(0)} MB total`} />
            <StatCard icon={FileCheck} label="Analyses" value={stats.analyses.total} sub={`Avg score: ${stats.analyses.avgScore}`} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Analysis Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Completed</span><span className="font-medium text-green-600">{stats.analyses.completed}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Failed</span><span className="font-medium text-red-600">{stats.analyses.failed}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Avg Score</span><span className="font-medium">{stats.analyses.avgScore}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Tier Breakdown</h3>
              <div className="space-y-2 text-sm">
                {(stats.tierBreakdown || []).map((t) => (
                  <div key={t.tier} className="flex justify-between">
                    <span className="text-gray-500 capitalize">{t.tier}</span>
                    <span className="font-medium">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Tier</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Uploads</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Active</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600">{u.full_name}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.tier}
                        onChange={(e) => updateUserField(u.id, 'tier', e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1"
                      >
                        <option value="free">free</option>
                        <option value="pro">pro</option>
                        <option value="enterprise">enterprise</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.uploads_this_month}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => updateUserField(u.id, 'is_active', !u.is_active)}
                        className={`text-xs font-medium ${u.is_active ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {u.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'flags' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="divide-y divide-gray-100">
            {flags.map((flag) => (
              <div key={flag.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 font-mono text-sm">{flag.key}</div>
                  <div className="text-sm text-gray-500">{flag.description}</div>
                </div>
                <button onClick={() => toggleFlag(flag)} className="flex-shrink-0">
                  {flag.enabled ? (
                    <ToggleRight className="h-7 w-7 text-brand-600" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-gray-400" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-50 rounded-lg"><Icon className="h-5 w-5 text-brand-600" /></div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{label}</div>
          {sub && <div className="text-xs text-gray-400">{sub}</div>}
        </div>
      </div>
    </div>
  );
}
