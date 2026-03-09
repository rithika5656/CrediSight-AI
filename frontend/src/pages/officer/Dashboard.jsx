import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, getAllApplications } from '../../services/api';
import Layout from '../../components/Layout';
import { StatCard, StatusBadge, RiskBadge, LoadingSpinner, formatCurrency, formatDate } from '../../components/UI';
import { FileText, AlertTriangle, BarChart3, FileCheck2, CheckCircle2, XCircle } from 'lucide-react';

export default function OfficerDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getAllApplications()])
      .then(([statsRes, appsRes]) => {
        setStats(statsRes.data);
        setRecent(appsRes.data.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Credit Officer Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of loan applications and risk assessments</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard title="Total Applications" value={stats.total_applications} icon={FileText} color="primary" />
          <StatCard title="Under Review" value={stats.under_review} icon={BarChart3} color="yellow" />
          <StatCard title="High Risk" value={stats.high_risk} icon={AlertTriangle} color="red" />
          <StatCard title="CAM Reports" value={stats.cam_reports_generated} icon={FileCheck2} color="purple" />
          <StatCard title="Approved" value={stats.approved} icon={CheckCircle2} color="green" />
          <StatCard title="Rejected" value={stats.rejected} icon={XCircle} color="red" />
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Applications</h2>
        <Link to="/officer/applications" className="text-primary-600 text-sm font-medium hover:text-primary-700">
          View all
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">No applications to display.</p>
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
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Risk</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recent.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono">#{app.id}</td>
                  <td className="px-6 py-4 text-sm font-medium">{app.company_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{app.industry_sector}</td>
                  <td className="px-6 py-4 text-sm">{formatCurrency(app.requested_loan_amount)}</td>
                  <td className="px-6 py-4">
                    {app.risk_score ? <RiskBadge level={app.risk_level} score={app.risk_score} /> : <span className="text-gray-400 text-sm">--</span>}
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={app.status} /></td>
                  <td className="px-6 py-4 flex gap-2">
                    <Link to={`/officer/applications/${app.id}`} className="text-primary-600 text-sm font-medium hover:text-primary-700">
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
