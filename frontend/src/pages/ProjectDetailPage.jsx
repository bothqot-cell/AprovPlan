import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsApi, uploadsApi, analysisApi } from '../services/api';
import { Upload, FileText, AlertTriangle, CheckCircle, Clock, ArrowLeft } from 'lucide-react';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const loadProject = useCallback(() => {
    Promise.all([
      projectsApi.get(id),
      analysisApi.getByProject(id),
    ])
      .then(([proj, anal]) => {
        setProject(proj);
        setAnalyses(anal);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(loadProject, [loadProject]);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      await uploadsApi.upload(id, file);
      // Reload after a delay to allow analysis to start
      setTimeout(loadProject, 2000);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const onFileInput = (e) => {
    handleUpload(e.target.files[0]);
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleUpload(file);
  };

  const scoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const statusIcon = (status) => {
    if (status === 'completed') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'failed') return <AlertTriangle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>;
  }

  if (!project) {
    return <div className="text-center py-12 text-gray-500">Project not found</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link to="/dashboard/projects" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
          <ArrowLeft className="h-3 w-3" />
          Back to Projects
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <div className="mt-1 text-sm text-gray-500">
              <span className="capitalize">{project.project_type?.replace('_', ' ')}</span>
              {project.address && <span> &bull; {project.address}</span>}
              {project.jurisdiction && <span> &bull; {project.jurisdiction}</span>}
            </div>
          </div>
        </div>
        {project.description && (
          <p className="mt-2 text-sm text-gray-600">{project.description}</p>
        )}
      </div>

      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition mb-6 ${
          dragOver ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <Upload className="h-8 w-8 text-gray-400 mx-auto" />
        <p className="mt-3 text-gray-600">
          {uploading ? 'Uploading and analyzing...' : 'Drag and drop your plan file here, or'}
        </p>
        {!uploading && (
          <label className="mt-2 inline-block bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 cursor-pointer transition">
            Browse Files
            <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif" onChange={onFileInput} />
          </label>
        )}
        <p className="mt-2 text-xs text-gray-400">PDF, PNG, JPEG, or TIFF</p>
        {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
      </div>

      {/* Uploads & Analyses */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Uploads & Analyses</h2>
        </div>

        {(!project.uploads || project.uploads.length === 0) ? (
          <div className="p-8 text-center">
            <FileText className="h-10 w-10 text-gray-300 mx-auto" />
            <p className="mt-3 text-gray-500">No files uploaded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {project.uploads.map((upload) => {
              const analysis = analyses.find((a) => a.upload_id === upload.id);
              return (
                <div key={upload.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{upload.originalFilename}</div>
                        <div className="text-xs text-gray-500">
                          {(upload.fileSizeBytes / 1024 / 1024).toFixed(2)} MB &bull; {new Date(upload.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {analysis ? (
                        <>
                          <div className="flex items-center gap-1">
                            {statusIcon(analysis.status)}
                            <span className="text-xs capitalize text-gray-500">{analysis.status}</span>
                          </div>
                          {analysis.approval_readiness_score !== null && analysis.approval_readiness_score !== undefined && (
                            <span className={`text-sm font-bold px-2 py-1 rounded ${scoreColor(analysis.approval_readiness_score)}`}>
                              {analysis.approval_readiness_score}/100
                            </span>
                          )}
                          {analysis.status === 'completed' && (
                            <Link
                              to={`/dashboard/analysis/${analysis.id}`}
                              className="text-sm text-brand-600 font-medium hover:underline"
                            >
                              View Report
                            </Link>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">Processing...</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
