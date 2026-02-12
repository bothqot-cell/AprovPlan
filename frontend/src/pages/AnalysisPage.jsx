import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { analysisApi } from '../services/api';
import {
  ArrowLeft, Download, AlertTriangle, CheckCircle, XCircle,
  Info, FileText, Shield, AlertOctagon,
} from 'lucide-react';

export default function AnalysisPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState('');

  useEffect(() => {
    analysisApi.get(id)
      .then(setAnalysis)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async (format) => {
    setDownloading(format);
    try {
      if (format === 'json') {
        const data = await analysisApi.downloadJson(id);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `permitpro-report-${id}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = await analysisApi.downloadPdf(id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `permitpro-report-${id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setDownloading('');
    }
  };

  const scoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const scoreBg = (score) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const severityBadge = (severity) => {
    const map = {
      critical: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-blue-100 text-blue-700',
    };
    return map[severity] || 'bg-gray-100 text-gray-700';
  };

  const riskBadge = (prob) => {
    const map = {
      very_high: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700',
    };
    return map[prob] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>;
  }

  if (!analysis) {
    return <div className="text-center py-12 text-gray-500">Analysis not found</div>;
  }

  if (analysis.status !== 'completed') {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto" />
        <p className="mt-4 text-gray-600">Analysis is {analysis.status}...</p>
        <p className="mt-1 text-sm text-gray-400">This page will show results once processing is complete.</p>
      </div>
    );
  }

  const isPaid = user?.tier !== 'free';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link to={`/dashboard/projects/${analysis.project_id}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
          <ArrowLeft className="h-3 w-3" />
          Back to Project
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analysis Report</h1>
            <p className="text-sm text-gray-500 mt-1">{analysis.original_filename}</p>
          </div>
          {isPaid && (
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload('pdf')}
                disabled={!!downloading}
                className="flex items-center gap-2 bg-brand-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {downloading === 'pdf' ? 'Generating...' : 'PDF'}
              </button>
              <button
                onClick={() => handleDownload('json')}
                disabled={!!downloading}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {downloading === 'json' ? 'Generating...' : 'JSON'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Score Card */}
      <div className={`rounded-xl border p-6 mb-6 ${scoreBg(analysis.approval_readiness_score)}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Approval Readiness Score</div>
            <div className={`text-5xl font-bold ${scoreColor(analysis.approval_readiness_score)}`}>
              {analysis.approval_readiness_score}<span className="text-2xl">/100</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-500 mb-1">Risk Level</div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold uppercase ${
              analysis.risk_level === 'low' ? 'bg-green-100 text-green-700' :
              analysis.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              analysis.risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
              'bg-red-100 text-red-700'
            }`}>
              {analysis.risk_level}
            </span>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          Processed in {analysis.processing_time_ms}ms &bull; Pipeline v{analysis.pipeline_version}
        </div>
      </div>

      {/* Compliance Flags */}
      <section className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Shield className="h-5 w-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Code Compliance Flags</h2>
          <span className="text-sm text-gray-500">({(analysis.compliance_flags || []).length})</span>
        </div>
        <div className="divide-y divide-gray-100">
          {(analysis.compliance_flags || []).length === 0 ? (
            <div className="px-5 py-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
              <p className="mt-2 text-green-700 font-medium">No compliance violations detected</p>
            </div>
          ) : (
            (analysis.compliance_flags || []).map((flag, i) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">{flag.description}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Code: {flag.code} &bull; {flag.category}</div>
                      {flag.violations.map((v, j) => (
                        <div key={j} className="mt-1 text-sm text-red-700">&bull; {v}</div>
                      ))}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityBadge(flag.severity)}`}>
                    {flag.severity}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Missing Information */}
      <section className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <h2 className="font-semibold text-gray-900">Missing Information</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {(analysis.missing_information || []).length === 0 ? (
            <div className="px-5 py-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
              <p className="mt-2 text-green-700 font-medium">No missing information detected</p>
            </div>
          ) : (
            (analysis.missing_information || []).map((item, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{item.item}</div>
                  <div className="text-sm text-gray-500">{item.reason}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityBadge(item.severity)}`}>
                  {item.severity}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Rejection Risks */}
      <section className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <AlertOctagon className="h-5 w-5 text-red-600" />
          <h2 className="font-semibold text-gray-900">High-Risk Rejection Indicators</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {(analysis.rejection_risks || []).length === 0 ? (
            <div className="px-5 py-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
              <p className="mt-2 text-green-700 font-medium">No high-risk rejection indicators</p>
            </div>
          ) : (
            (analysis.rejection_risks || []).map((risk, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{risk.risk}</div>
                  <div className="text-sm text-gray-500">{risk.details}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskBadge(risk.probability)}`}>
                  {risk.probability?.replace('_', ' ')}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Recommendations */}
      <section className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Recommendations</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {(analysis.recommendations || []).map((rec, i) => (
            <div key={i} className="px-5 py-3 flex items-start gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${severityBadge(rec.priority)}`}>
                {rec.priority}
              </span>
              <div className="text-sm text-gray-700">{rec.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Interpretation (paid only) */}
      {analysis.llm_interpretation && (
        <section className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900">AI Interpretation</h2>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-gray-700 leading-relaxed">{analysis.llm_interpretation}</p>
          </div>
        </section>
      )}

      {/* Free tier upsell */}
      {!isPaid && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-brand-900">Upgrade for Full Reports</h3>
          <p className="mt-1 text-sm text-brand-700">
            Get detailed rule-by-rule breakdowns, AI interpretation, and downloadable PDF/JSON reports.
          </p>
          <Link
            to="/dashboard/billing"
            className="mt-3 inline-block bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
          >
            Upgrade Now
          </Link>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 text-xs text-gray-400 text-center">
        This report is generated by PermitPro AI for pre-submission review purposes only.
        It does not constitute an official permit review or approval.
      </div>
    </div>
  );
}
