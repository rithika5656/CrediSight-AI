import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getApplication, getDocuments, uploadDocument, generateCAM } from '../../services/api';
import Layout from '../../components/Layout';
import { StatusBadge, RiskBadge, LoadingSpinner, formatCurrency, formatDate } from '../../components/UI';
import { Upload, FileText, Download, ArrowLeft, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const DOC_TYPES = [
  { value: 'gst_filing', label: 'GST Filing' },
  { value: 'income_tax_return', label: 'Income Tax Return' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'annual_report', label: 'Annual Report' },
  { value: 'legal_document', label: 'Legal Document' },
];

export default function ApplicationDetail() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('gst_filing');
  const [uploadError, setUploadError] = useState('');
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

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError('');
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('application_id', id);
    formData.append('document_type', uploadType);

    try {
      await uploadDocument(formData);
      await fetchData();
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
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
    } catch {
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (error) return <Layout><p className="text-red-500">{error}</p></Layout>;
  if (!application) return <Layout><p className="text-gray-500">Application not found.</p></Layout>;

  // Remove AI recommendation, risk, and internal fields for applicants

  return (
    <Layout>
      <div className="mb-6">
        <Link to="/applicant/applications" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to applications
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Application #{application.id}</h1>
            <p className="text-gray-500 mt-1">{application.company_name}</p>
          </div>
          <StatusBadge status={application.status} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <Link to="/applicant/applications" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to applications
        </Link>
        <div className="card p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">{application.company_name}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">CIN Number</div>
              <div className="text-base font-medium mb-2">{application.cin_number}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">GST Number</div>
              <div className="text-base font-medium mb-2">{application.gst_number}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Industry</div>
              <div className="text-base font-medium mb-2">{application.industry_sector}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Requested Loan Amount</div>
              <div className="text-base font-medium mb-2">{formatCurrency(application.requested_loan_amount)}</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-500">Business Description</div>
            <div className="text-base mb-2">{application.business_description || 'N/A'}</div>
          </div>
        </div>

        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Uploaded Documents</h2>
          {/* Upload Document Button */}
          <div className="flex items-center gap-3 mb-4">
            <select
              className="input-field w-auto"
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value)}
            >
              <option value="gst_filing">GST Filing</option>
              <option value="bank_statement">Bank Statement (last 6 months)</option>
              <option value="income_tax_return">Income Tax Return</option>
              <option value="annual_report">Annual Report</option>
              <option value="legal_document">Legal Document</option>
              <option value="balance_sheet">Balance Sheet</option>
              <option value="profit_loss">Profit & Loss Statement</option>
              <option value="registration_certificate">Company Registration Certificate</option>
              <option value="collateral">Collateral Documents</option>
            </select>
            <label className="btn-primary flex items-center gap-2 text-sm cursor-pointer">
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload Document'}
              <input type="file" className="hidden" accept="application/pdf" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
          {uploadError && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">{uploadError}</div>
          )}
          {/* Document Table */}
          {documents.length === 0 ? (
            <p className="text-sm text-gray-400">No documents uploaded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2 text-left">Document Type</th>
                    <th className="px-4 py-2 text-left">File Name</th>
                    <th className="px-4 py-2 text-left">Upload Date</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b">
                      <td className="px-4 py-2">{DOC_TYPES.find((d) => d.value === doc.document_type)?.label || doc.document_type}</td>
                      <td className="px-4 py-2">{doc.file_name}</td>
                      <td className="px-4 py-2">{formatDate(doc.created_at)}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs font-medium ${doc.status === 'processed' ? 'text-green-600' : doc.status === 'failed' ? 'text-red-600' : 'text-gray-500'}`}>{doc.status}</span>
                      </td>
                      <td className="px-4 py-2">
                        <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">View</a>
                        {/* Optionally add Download button */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Application Status</h2>
          <StatusBadge status={application.status} />
          <p className="text-xs text-gray-500 mt-2">Applied {formatDate(application.created_at)}</p>
          {/* If approved, show approved details */}
          {application.status === 'approved' && (
            <div className="mt-4 space-y-2">
              <div className="text-sm text-gray-500">Approved Loan Amount</div>
              <div className="text-base font-medium">{formatCurrency(application.approved_loan_amount)}</div>
              <div className="text-sm text-gray-500">Interest Rate</div>
              <div className="text-base font-medium">{application.interest_rate}% p.a.</div>
              <div className="text-sm text-gray-500">Approval Date</div>
              <div className="text-base font-medium">{formatDate(application.approval_date)}</div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
