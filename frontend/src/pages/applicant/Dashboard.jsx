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

  const submitted = applications.filter((a) => a.status === 'submitted').length;
  const underReview = applications.filter((a) => a.status === 'under_review').length;
  const approved = applications.filter((a) => a.status === 'approved').length;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome, {user?.full_name}</h1>
        <p className="text-gray-500 mt-1">Manage your loan applications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Applications" value={applications.length} icon={FileText} color="primary" />
        <StatCard title="Submitted" value={submitted} icon={Clock} color="blue" />
        <StatCard title="Under Review" value={underReview} icon={Clock} color="yellow" />
        <StatCard title="Approved" value={approved} icon={CheckCircle2} color="green" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Applications</h2>
        <Link to="/applicant/apply" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4" />
          New Application
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : applications.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900">No applications yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first loan application to get started.</p>
          <Link to="/applicant/apply" className="btn-primary inline-flex items-center gap-2 mt-4 text-sm">
            <Plus className="h-4 w-4" />
            New Application
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
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
