import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyApplications } from '../../services/api';
import { StatusBadge, StatCard, LoadingSpinner, formatCurrency, formatDate } from '../../components/UI';
import { FileText, Plus, Clock, CheckCircle2 } from 'lucide-react';
import Layout from '../../components/Layout';

export default function ApplicantDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyApplications()
      .then(({ data }) => setApplications(data))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      {/* Section 1: Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome, {user?.full_name}</h1>
        <p className="text-gray-500 mt-1">Manage your loan applications</p>
      </div>

      {/* Section 2: Primary Action */}
      <div className="flex items-center justify-between mb-6">
        <div />
        <Link to="/applicant/apply" className="btn-primary flex items-center gap-2 text-base px-6 py-2">
          <Plus className="h-5 w-5" />
          New Loan Application
        </Link>
      </div>

      {/* Section 3: My Applications */}
      {loading ? (
        <LoadingSpinner />
      ) : applications.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900">No applications yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first loan application to get started.</p>
          <Link to="/applicant/apply" className="btn-primary inline-flex items-center gap-2 mt-4 text-sm">
            <Plus className="h-4 w-4" />
            New Loan Application
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Industry</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono">#{app.id}</td>
                  <td className="px-6 py-4 text-sm font-medium">{app.company_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{app.industry_sector}</td>
                  <td className="px-6 py-4 text-sm">{formatCurrency(app.requested_loan_amount)}</td>
                  <td className="px-6 py-4"><StatusBadge status={app.status} /></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(app.created_at)}</td>
                  <td className="px-6 py-4">
                    <Link to={`/applicant/applications/${app.id}`} className="text-primary-600 text-sm font-medium hover:text-primary-700">
                      View
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
