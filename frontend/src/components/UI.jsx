export function StatusBadge({ status }) {
  const styles = {
    draft: 'badge-neutral',
    submitted: 'badge-info',
    under_review: 'badge-warning',
    approved: 'badge-success',
    rejected: 'badge-danger',
  };

  const labels = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
  };

  return (
    <span className={styles[status] || 'badge-neutral'}>
      {labels[status] || status}
    </span>
  );
}

export function RiskBadge({ level, score }) {
  const styles = {
    low: 'badge-success',
    medium: 'badge-warning',
    high: 'badge-danger',
    critical: 'badge-danger',
  };

  return (
    <span className={styles[level] || 'badge-neutral'}>
      {score !== undefined && `${score} - `}
      {level ? level.charAt(0).toUpperCase() + level.slice(1) : 'N/A'}
    </span>
  );
}

export function StatCard({ title, value, icon: Icon, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-primary-50 text-primary-600',
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colors[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  );
}

export function EmptyState({ title, description, icon: Icon }) {
  return (
    <div className="text-center py-12">
      {Icon && <Icon className="h-12 w-12 text-gray-300 mx-auto mb-4" />}
      <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
  );
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
