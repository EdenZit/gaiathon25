import { Suspense } from 'react';
import { UserModel } from '@/models/user.model';
import { SystemMetrics } from '@/components/admin/metrics/SystemMetrics';

async function getMetrics() {
  const totalUsers = await UserModel.countDocuments();
  const unverifiedUsers = await UserModel.countDocuments({ 'status.isVerified': false });
  const adminUsers = await UserModel.countDocuments({ role: 'ADMIN' });
  const recentUsers = await UserModel.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('-password');

  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentActivity = await UserModel.aggregate([
    { $unwind: '$activityLog' },
    { $match: { 'activityLog.timestamp': { $gte: last24Hours } } },
    { $sort: { 'activityLog.timestamp': -1 } },
    { $limit: 10 },
  ]);

  return {
    totalUsers,
    unverifiedUsers,
    adminUsers,
    recentUsers,
    recentActivity,
  };
}

export default async function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          System overview and recent activity
        </p>
      </div>

      <Suspense fallback={<div>Loading metrics...</div>}>
        <SystemMetrics getMetrics={getMetrics} />
      </Suspense>
    </div>
  );
} 