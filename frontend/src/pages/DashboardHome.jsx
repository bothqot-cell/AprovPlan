import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { projectsApi, analysisApi } from '../services/api';
import { FolderOpen, Upload, FileCheck, Plus, ArrowRight } from 'lucide-react';

export default function DashboardHome() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([projectsApi.list()])
      .then(([projectData]) => {
        setProjects(projectData);
        // Load analyses for the most recent projects
        if (projectData.length > 0) {
          const promises = projectData.slice(0, 3).map(p => analysisApi.getByProject(p.id).catch(() => []));
          Promise.all(promises).then(results => {
            setRecentAnalyses(results.flat().slice(0, 5));
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tierLimits = user?.tierLimits || {};

  const scoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.fullName || user?.email}</p>
        </div>
        <Link
          to="/dashboard/projects"
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><FolderOpen className="h-5 w-5 text-blue-600" /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{projects.length}</div>
              <div className="text-sm text-gray-500">Projects</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><Upload className="h-5 w-5 text-green-600" /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{user?.uploadsThisMonth || 0}</div>
              <div className="text-sm text-gray-500">
                Uploads this month
                {tierLimits.maxUploadsPerMonth > 0 && (
                  <span className="text-gray-400"> / {tierLimits.maxUploadsPerMonth}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg"><FileCheck className="h-5 w-5 text-purple-600" /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{recentAnalyses.length}</div>
              <div className="text-sm text-gray-500">Analyses</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Projects</h2>
          <Link to="/dashboard/projects" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="p-8 text-center">
            <FolderOpen className="h-10 w-10 text-gray-300 mx-auto" />
            <p className="mt-3 text-gray-500">No projects yet</p>
            <Link
              to="/dashboard/projects"
              className="mt-3 inline-block text-sm text-brand-600 font-medium hover:underline"
            >
              Create your first project
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {projects.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                to={`/dashboard/projects/${p.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
              >
                <div>
                  <div className="font-medium text-gray-900">{p.name}</div>
                  <div className="text-sm text-gray-500">
                    {p.project_type} {p.address && `\u2022 ${p.address}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">{p.upload_count || 0} uploads</div>
                  <div className="text-xs text-gray-400">{new Date(p.updated_at).toLocaleDateString()}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Analyses */}
      {recentAnalyses.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Analyses</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentAnalyses.map((a) => (
              <Link
                key={a.id}
                to={`/dashboard/analysis/${a.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
              >
                <div>
                  <div className="font-medium text-gray-900">{a.original_filename}</div>
                  <div className="text-sm text-gray-500 capitalize">{a.status}</div>
                </div>
                <div className="text-right">
                  {a.approval_readiness_score !== null && (
                    <div className={`text-lg font-bold ${scoreColor(a.approval_readiness_score)}`}>
                      {a.approval_readiness_score}/100
                    </div>
                  )}
                  <div className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString()}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
