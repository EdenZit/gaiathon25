import { User } from '@/models/user.model';

interface MetricsData {
  totalUsers: number;
  unverifiedUsers: number;
  adminUsers: number;
  recentUsers: User[];
  recentActivity: {
    _id: string;
    activityLog: {
      type: string;
      timestamp: Date;
      ipAddress?: string;
      userAgent?: string;
    };
  }[];
}

interface SystemMetricsProps {
  getMetrics: () => Promise<MetricsData>;
}

export async function SystemMetrics({ getMetrics }: SystemMetricsProps) {
  const metrics = await getMetrics();

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Total Users</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {metrics.totalUsers}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Unverified Users</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {metrics.unverifiedUsers}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Admin Users</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {metrics.adminUsers}
          </dd>
        </div>
      </div>

      {/* Recent Users */}
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Recent Users
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {metrics.recentUsers.map((user) => (
              <li key={user.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      user.status.isVerified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.status.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Recent Activity
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {metrics.recentActivity.map((activity) => (
              <li key={activity._id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-900">
                      {activity.activityLog.type}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.activityLog.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {activity.activityLog.ipAddress && (
                    <div className="text-xs text-gray-500">
                      {activity.activityLog.ipAddress}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 