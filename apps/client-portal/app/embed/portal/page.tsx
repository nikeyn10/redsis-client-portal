'use client';

import { useEffect, useState } from 'react';
import { useMondayContext } from '@/lib/monday-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { 
  Users, 
  Building2, 
  Ticket, 
  BarChart3, 
  Settings,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Wrench
} from 'lucide-react';

// Tab components
import CompanyManagement from '@/components/portal/CompanyManagement';
import UserManagement from '@/components/portal/UserManagement';
import ServiceProviderManagement from '@/components/portal/ServiceProviderManagement';
import TicketOverview from '@/components/portal/TicketOverview';
import Analytics from '@/components/portal/Analytics';
import PortalSettings from '@/components/portal/PortalSettings';

type Tab = 'overview' | 'companies' | 'users' | 'providers' | 'tickets' | 'analytics' | 'settings';

export default function ManagementPortalPage() {
  const { context } = useMondayContext();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalUsers: 0,
    totalTickets: 0,
    openTickets: 0,
    avgResponseTime: '0h',
    satisfactionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(false);
    // Stats will be loaded by individual components
  };

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: BarChart3 },
    { id: 'companies' as Tab, label: 'Companies', icon: Building2 },
    { id: 'users' as Tab, label: 'Users', icon: Users },
    { id: 'providers' as Tab, label: 'Service Providers', icon: Wrench },
    { id: 'tickets' as Tab, label: 'Tickets', icon: Ticket },
    { id: 'analytics' as Tab, label: 'Analytics', icon: TrendingUp },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Client Portal Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Complete control center for your client portal app
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileText className="w-4 h-4" />
              <span>Board: Client Portal</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex gap-1 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 font-medium'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Companies</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCompanies}</p>
                    <p className="text-xs text-green-600 mt-1">+2 this month</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                    <p className="text-xs text-green-600 mt-1">+5 this week</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.openTickets}</p>
                    <p className="text-xs text-gray-500 mt-1">of {stats.totalTickets} total</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.avgResponseTime}</p>
                    <p className="text-xs text-green-600 mt-1">-15% vs last month</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={() => setActiveTab('companies')}
                  variant="secondary" 
                  size="lg"
                  className="justify-start"
                >
                  <Building2 className="w-5 h-5 mr-2" />
                  Manage Companies
                </Button>
                <Button 
                  onClick={() => setActiveTab('users')}
                  variant="secondary" 
                  size="lg"
                  className="justify-start"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Manage Users
                </Button>
                <Button 
                  onClick={() => setActiveTab('tickets')}
                  variant="secondary" 
                  size="lg"
                  className="justify-start"
                >
                  <Ticket className="w-5 h-5 mr-2" />
                  View All Tickets
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New company "Acme Corp" created</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Ticket className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">5 new tickets created today</p>
                    <p className="text-xs text-gray-500">Various companies</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">3 new users registered</p>
                    <p className="text-xs text-gray-500">Yesterday</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'companies' && <CompanyManagement />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'providers' && <ServiceProviderManagement />}
        {activeTab === 'tickets' && <TicketOverview />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'settings' && <PortalSettings />}
      </div>
    </div>
  );
}
