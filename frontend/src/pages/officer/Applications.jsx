import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllApplications } from '../../services/api';
import Layout from '../../components/Layout';
import { StatusBadge, RiskBadge, LoadingSpinner, EmptyState, formatCurrency, formatDate } from '../../components/UI';
import { FileText, Search } from 'lucide-react';

export default function OfficerApplications() {
  const [applications, setApplications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    getAllApplications()
      .then(({ data }) => {
        setApplications(data);
        setFiltered(data);
      })
      .catch(() => { setApplications([]); setFiltered([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = applications;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.company_name.toLowerCase().includes(q) ||
          a.industry_sector.toLowerCase().includes(q) ||
          String(a.id).includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter);
    }
    setFiltered(result);
  }, [search, statusFilter, applications]);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">All Applications</h1>
        <p className="text-gray-500 mt-1">Review and analyze corporate loan applications</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by company, industry, or ID..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState title="No applications found" description="Adjust your search or filters." icon={FileText} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Industry</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Risk Score</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono">#{app.id}</td>
                  <td className="px-6 py-4 text-sm font-medium">{app.company_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{app.industry_sector}</td>
                  <td className="px-6 py-4 text-sm">{formatCurrency(app.requested_loan_amount)}</td>
                  <td className="px-6 py-4">
                    {app.risk_score != null ? <RiskBadge level={app.risk_level} score={app.risk_score} /> : <span className="text-gray-400 text-sm">--</span>}
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={app.status} /></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(app.created_at)}</td>
                  <td className="px-6 py-4">
                    <Link to={`/officer/applications/${app.id}`} className="text-primary-600 text-sm font-medium hover:text-primary-700">
                      View / Analyze
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
