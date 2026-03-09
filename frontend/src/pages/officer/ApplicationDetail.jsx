import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getApplication, getDocuments, analyzeApplication,
  generateCAM, decideApplication,
} from '../../services/api';
import Layout from '../../components/Layout';
import {
  StatusBadge, RiskBadge, LoadingSpinner, formatCurrency, formatDate,
} from '../../components/UI';
import {
  ArrowLeft, Play, Download, CheckCircle2, XCircle,
  FileText, Shield, AlertTriangle, TrendingUp, Building2,
} from 'lucide-react';

export default function OfficerApplicationDetail() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [appRes, docsRes] = await Promise.all([
        getApplication(id),
        getDocuments(id),
      ]);
      setApplication(appRes.data);
      setDocuments(docsRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load application data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const { data } = await analyzeApplication(id);
      setAnalysisResult(data);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDecision = async (decision) => {
    setDeciding(true);
    setError('');
    try {
      await decideApplication(id, decision);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Decision failed. Please try again.');
    } finally {
      setDeciding(false);
    }
  };

  const handleDownloadCAM = async (format) => {
    try {
      const response = await generateCAM(id, format);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CAM_${id}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'CAM generation failed.');
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (error && !application) return <Layout><p className="text-red-500">{error}</p></Layout>;
  if (!application) return <Layout><p className="text-gray-500">Application not found.</p></Layout>;

  const rec = application.ai_recommendation || analysisResult?.recommendation;
  const fiveCs = application.five_cs_evaluation || analysisResult?.five_cs_evaluation;
  const crossVer = application.cross_verification_results || analysisResult?.cross_verification;
  const research = application.research_insights || analysisResult?.research_insights;

  return (
    <Layout>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}
      <div className="mb-6">
        <Link to="/officer/applications" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to applications
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Application #{application.id}</h1>
            <p className="text-gray-500 mt-1">{application.company_name} -- {application.industry_sector}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={application.status} />
            {application.risk_score != null && (
              <RiskBadge level={application.risk_level} score={application.risk_score} />
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Play className="h-4 w-4" />
              {analyzing ? 'Analyzing...' : 'Run Analysis'}
            </button>
            <button onClick={() => handleDownloadCAM('pdf')} className="btn-secondary flex items-center gap-2 text-sm">
              <Download className="h-4 w-4" /> CAM PDF
            </button>
            <button onClick={() => handleDownloadCAM('docx')} className="btn-secondary flex items-center gap-2 text-sm">
              <Download className="h-4 w-4" /> CAM Word
            </button>
          </div>
          {application.status !== 'approved' && application.status !== 'rejected' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDecision('approve')}
                disabled={deciding}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" /> Approve
              </button>
              <button
                onClick={() => handleDecision('reject')}
                disabled={deciding}
                className="btn-danger flex items-center gap-2 text-sm"
              >
                <XCircle className="h-4 w-4" /> Reject
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Company Info */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold">Company Details</h2>
            </div>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">CIN Number</dt>
                <dd className="text-sm font-medium mt-1">{application.cin_number}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">GST Number</dt>
                <dd className="text-sm font-medium mt-1">{application.gst_number}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Industry Sector</dt>
                <dd className="text-sm font-medium mt-1">{application.industry_sector}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Requested Amount</dt>
                <dd className="text-sm font-medium mt-1">{formatCurrency(application.requested_loan_amount)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sm text-gray-500">Business Description</dt>
                <dd className="text-sm mt-1">{application.business_description || 'N/A'}</dd>
              </div>
            </dl>
          </div>

          {/* Documents */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold">Uploaded Documents ({documents.length})</h2>
            </div>
            {documents.length === 0 ? (
              <p className="text-sm text-gray-400">No documents uploaded by applicant.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{doc.file_name}</p>
                        <p className="text-xs text-gray-500">{doc.document_type}{doc.file_size && ` -- ${(doc.file_size / 1024).toFixed(0)} KB`}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${doc.status === 'processed' ? 'text-green-600' : doc.status === 'failed' ? 'text-red-600' : 'text-gray-500'}`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cross-Verification */}
          {crossVer && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold">Financial Cross-Verification</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Verification Score</p>
                  <p className="text-2xl font-bold mt-1">{crossVer.verification_score}/100</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Revenue Mismatch</p>
                  <p className="text-2xl font-bold mt-1">
                    {crossVer.revenue_mismatch ? `${crossVer.mismatch_percentage}%` : 'None'}
                  </p>
                </div>
              </div>
              {crossVer.suspicious_patterns?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Suspicious Patterns</h3>
                  {crossVer.suspicious_patterns.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-red-600 mb-1">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {p}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Recommendation */}
          {rec && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold">AI Recommendation</h2>
              </div>
              <div className="flex items-center gap-3 mb-4 p-4 rounded-lg bg-gray-50">
                {rec.decision === 'approve' ? (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
                <div>
                  <span className={`text-xl font-bold ${rec.decision === 'approve' ? 'text-green-700' : 'text-red-700'}`}>
                    {rec.decision === 'approve' ? 'APPROVE' : 'REJECT'}
                  </span>
                  <div className="text-sm text-gray-500 mt-1">
                    Limit: {formatCurrency(rec.recommended_loan_limit)} | Rate: {rec.suggested_interest_rate}% p.a.
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Explainable Reasoning</h3>
                <ul className="space-y-1.5">
                  {rec.reasoning?.map((r, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5 flex-shrink-0">--</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              {rec.conditions?.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Conditions</h3>
                  <ul className="space-y-1">
                    {rec.conditions.map((c, i) => (
                      <li key={i} className="text-sm text-gray-600">-- {c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Risk Score Card */}
          {application.risk_score && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Risk Score</h3>
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 ${
                  application.risk_score >= 70 ? 'border-green-500 text-green-700' :
                  application.risk_score >= 40 ? 'border-yellow-500 text-yellow-700' :
                  'border-red-500 text-red-700'
                }`}>
                  <span className="text-2xl font-bold">{application.risk_score}</span>
                </div>
                <div className="mt-3">
                  <RiskBadge level={application.risk_level} />
                </div>
              </div>
            </div>
          )}

          {/* Five Cs */}
          {fiveCs && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Five Cs of Credit</h3>
              <div className="space-y-4">
                {Object.entries(fiveCs).map(([key, data]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="capitalize font-medium">{key}</span>
                      <span className={`font-bold ${
                        data.score >= 70 ? 'text-green-600' : data.score >= 40 ? 'text-yellow-600' : 'text-red-600'
                      }`}>{data.score}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          data.score >= 70 ? 'bg-green-500' : data.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${data.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{data.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Research Insights */}
          {research && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Research Insights</h3>
              <p className="text-sm text-gray-600 mb-3">{research.summary}</p>
              {research.sector_risk && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Sector Risk</p>
                  <p className="text-sm font-medium capitalize">{research.sector_risk.risk_level}</p>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5" />
                <div>
                  <p className="text-sm font-medium">Application Created</p>
                  <p className="text-xs text-gray-500">{formatDate(application.created_at)}</p>
                </div>
              </div>
              {application.risk_score && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5" />
                  <div>
                    <p className="text-sm font-medium">Analysis Completed</p>
                    <p className="text-xs text-gray-500">Risk Score: {application.risk_score}</p>
                  </div>
                </div>
              )}
              {(application.status === 'approved' || application.status === 'rejected') && (
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${application.status === 'approved' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-sm font-medium">Decision: {application.status === 'approved' ? 'Approved' : 'Rejected'}</p>
                    <p className="text-xs text-gray-500">{formatDate(application.updated_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
