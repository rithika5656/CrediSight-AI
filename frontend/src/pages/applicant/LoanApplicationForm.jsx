import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createApplication } from '../../services/api';
import Layout from '../../components/Layout';
import { FileText, Send } from 'lucide-react';

const SECTORS = [
  'Technology', 'Healthcare', 'Manufacturing', 'Real Estate', 'Retail',
  'Agriculture', 'Pharmaceuticals', 'Education', 'Construction', 'Logistics',
  'Textile', 'Automotive', 'FMCG', 'Telecom', 'Media', 'Mining',
  'Oil and Gas', 'Hospitality', 'Banking', 'Insurance', 'Utilities', 'Other',
];

export default function LoanApplicationForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company_name: '',
    cin_number: '',
    gst_number: '',
    industry_sector: '',
    requested_loan_amount: '',
    business_description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        requested_loan_amount: parseFloat(form.requested_loan_amount),
      };
      const { data } = await createApplication(payload);
      navigate(`/applicant/applications/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">New Loan Application</h1>
              <p className="text-gray-500 text-sm mt-1">Fill in company details and loan requirements</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                name="company_name"
                required
                className="input-field"
                value={form.company_name}
                onChange={handleChange}
                placeholder="Acme Pvt Ltd"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CIN Number</label>
              <input
                type="text"
                name="cin_number"
                required
                className="input-field"
                value={form.cin_number}
                onChange={handleChange}
                placeholder="U12345MH2020PTC123456"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
              <input
                type="text"
                name="gst_number"
                required
                className="input-field"
                value={form.gst_number}
                onChange={handleChange}
                placeholder="27AABCU9603R1ZM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry Sector</label>
              <select
                name="industry_sector"
                required
                className="input-field"
                value={form.industry_sector}
                onChange={handleChange}
              >
                <option value="">Select sector</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Requested Loan Amount (INR)</label>
              <input
                type="number"
                name="requested_loan_amount"
                required
                min="1"
                className="input-field"
                value={form.requested_loan_amount}
                onChange={handleChange}
                placeholder="10000000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
            <textarea
              name="business_description"
              rows={4}
              className="input-field"
              value={form.business_description}
              onChange={handleChange}
              placeholder="Describe your business, operations, and purpose of this loan..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
              {!loading && <Send className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
