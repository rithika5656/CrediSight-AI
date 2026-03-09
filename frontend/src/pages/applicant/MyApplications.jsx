import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyApplications, deleteApplication } from '../../services/api';
import Layout from '../../components/Layout';
import { StatusBadge, RiskBadge, LoadingSpinner, EmptyState, formatCurrency, formatDate } from '../../components/UI';
import { FileText } from 'lucide-react';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    getMyApplications()
      .then(({ data }) => setApplications(data))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    setDeletingId(id);
    try {
      await deleteApplication(id);
      setApplications((apps) => apps.filter((a) => a.id !== id));
    } catch (err) {
      alert('Failed to delete application.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Applications</h1>
        <p className="text-gray-500 mt-1">Track the status of your loan applications</p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : applications.length === 0 ? (
        <EmptyState title="No applications found" description="Submit a new application to get started." icon={FileText} />
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
                  <td className="px-6 py-4 flex gap-3 items-center">
                    <Link to={`/applicant/applications/${app.id}`} className="text-primary-600 text-sm font-medium hover:text-primary-700">
                      View
                    </Link>
                    <button
                      className="text-red-600 text-sm font-medium hover:text-red-800 disabled:opacity-50"
                      onClick={() => handleDelete(app.id)}
                      disabled={deletingId === app.id}
                    >
                      {deletingId === app.id ? 'Deleting...' : 'Delete'}
                    </button>
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
