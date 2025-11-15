'use client';

import { Card } from '@/components/ui/Card';
import { BarChart3, TrendingUp, Clock, Users } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Analytics & Reports</h2>
        <p className="text-sm text-gray-600 mt-1">
          Performance metrics and insights
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Ticket Trends</h3>
              <p className="text-sm text-gray-500">Last 30 days</p>
            </div>
          </div>
          <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-400">Chart coming soon</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Resolution Rate</h3>
              <p className="text-sm text-gray-500">Monthly performance</p>
            </div>
          </div>
          <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-400">Chart coming soon</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Response Times</h3>
              <p className="text-sm text-gray-500">Average by company</p>
            </div>
          </div>
          <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-400">Chart coming soon</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">User Activity</h3>
              <p className="text-sm text-gray-500">Login statistics</p>
            </div>
          </div>
          <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-400">Chart coming soon</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
