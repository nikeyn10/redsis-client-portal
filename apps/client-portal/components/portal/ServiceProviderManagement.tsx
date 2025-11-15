'use client';

import { useEffect, useState } from 'react';
import { useMondayContext } from '@/lib/monday-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui/Select';
import { Plus, RefreshCw, Mail, User as UserIcon, Edit, Trash2, CheckCircle } from 'lucide-react';

interface ServiceProvider {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  specialization: string;
  assignedTickets: number;
  createdDate: string;
}

interface EditServiceProvider extends ServiceProvider {
  password?: string;
}

const SERVICE_PROVIDER_BOARD_ID = '18379446736'; // Create this board or use existing one

export default function ServiceProviderManagement() {
  const { executeMondayQuery } = useMondayContext();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [showNewProvider, setShowNewProvider] = useState(false);
  const [showEditProvider, setShowEditProvider] = useState(false);
  const [editingProvider, setEditingProvider] = useState<EditServiceProvider | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    specialization: 'General Support',
    status: 'Active'
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);

      const query = `
        query GetServiceProviders($boardId: [ID!]!) {
          boards(ids: $boardId) {
            items_page(limit: 500) {
              items {
                id
                name
                column_values {
                  id
                  text
                  value
                }
                created_at
              }
            }
          }
        }
      `;

      const response = await executeMondayQuery(query, {
        boardId: [SERVICE_PROVIDER_BOARD_ID]
      });

      if (response.data?.boards?.[0]?.items_page?.items) {
        const items = response.data.boards[0].items_page.items;
        
        const providersList: ServiceProvider[] = items.map((item: any) => {
          const cols = item.column_values.reduce((acc: any, col: any) => {
            acc[col.id] = col.text || col.value;
            return acc;
          }, {});

          return {
            id: item.id,
            name: item.name,
            email: cols.email_mkxpawg3 || '',
            phone: cols.phone_mkxpec5j || '',
            status: cols.status || 'Active',
            specialization: cols.dropdown_mkxpdbxw || 'General Support',
            assignedTickets: parseInt(cols.numeric_mkxp72jc) || 0,
            createdDate: item.created_at
          };
        });

        setProviders(providersList);
      }
    } catch (err) {
      console.error('Failed to load service providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const createProvider = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);

      const mutation = `
        mutation CreateServiceProvider($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
          create_item(
            board_id: $boardId,
            item_name: $itemName,
            column_values: $columnValues
          ) {
            id
          }
        }
      `;

      await executeMondayQuery(mutation, {
        boardId: SERVICE_PROVIDER_BOARD_ID,
        itemName: formData.name,
        columnValues: JSON.stringify({
          email_mkxpawg3: { email: formData.email, text: formData.email },
          phone_mkxpec5j: formData.phone.replace(/\D/g, ''),
          text_mkxpb7j4: formData.password,
          dropdown_mkxpdbxw: { labels: [formData.specialization] },
          numeric_mkxp72jc: 0
        })
      });

      alert(`Service Provider "${formData.name}" created successfully!`);
      
      setShowNewProvider(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        specialization: 'General Support',
        status: 'Active'
      });
      loadProviders();

    } catch (err) {
      console.error('Failed to create service provider:', err);
      alert('Failed to create service provider');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (provider: ServiceProvider) => {
    setEditingProvider({ ...provider, password: '' });
    setShowEditProvider(true);
  };

  const updateProvider = async () => {
    if (!editingProvider) return;

    try {
      setUpdating(true);

      const mutation = `
        mutation UpdateServiceProvider($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
          change_multiple_column_values(
            board_id: $boardId,
            item_id: $itemId,
            column_values: $columnValues
          ) {
            id
          }
        }
      `;

      const columnValues: any = {
        email_mkxpawg3: { email: editingProvider.email, text: editingProvider.email },
        phone_mkxpec5j: editingProvider.phone.replace(/\D/g, ''),
        dropdown_mkxpdbxw: { labels: [editingProvider.specialization] }
      };

      if (formData.password) {
        columnValues.text_mkxpb7j4 = formData.password;
      }

      await executeMondayQuery(mutation, {
        boardId: SERVICE_PROVIDER_BOARD_ID,
        itemId: editingProvider.id,
        columnValues: JSON.stringify(columnValues)
      });

      // Update name separately if changed
      if (editingProvider.name !== providers.find(p => p.id === editingProvider.id)?.name) {
        const updateNameMutation = `
          mutation UpdateItemName($boardId: ID!, $itemId: ID!, $value: String!) {
            change_simple_column_value(
              board_id: $boardId,
              item_id: $itemId,
              column_id: "name",
              value: $value
            ) {
              id
            }
          }
        `;

        await executeMondayQuery(updateNameMutation, {
          boardId: SERVICE_PROVIDER_BOARD_ID,
          itemId: editingProvider.id,
          value: editingProvider.name
        });
      }

      alert('Service Provider updated successfully!');
      
      setShowEditProvider(false);
      setEditingProvider(null);
      loadProviders();

    } catch (err) {
      console.error('Failed to update service provider:', err);
      alert('Failed to update service provider');
    } finally {
      setUpdating(false);
    }
  };

  const deleteProvider = async (provider: ServiceProvider) => {
    if (!confirm(`Are you sure you want to delete "${provider.name}"?`)) {
      return;
    }

    try {
      const mutation = `
        mutation DeleteItem($itemId: ID!) {
          delete_item(item_id: $itemId) {
            id
          }
        }
      `;

      await executeMondayQuery(mutation, {
        itemId: provider.id
      });

      alert('Service Provider deleted successfully!');
      loadProviders();

    } catch (err) {
      console.error('Failed to delete service provider:', err);
      alert('Failed to delete service provider');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Service Provider Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage technicians and support staff who handle tickets
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={loadProviders} variant="secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowNewProvider(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Provider
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Total Providers</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{providers.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Active</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {providers.filter(p => p.status === 'Active').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">On Leave</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {providers.filter(p => p.status === 'On Leave').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Inactive</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {providers.filter(p => p.status === 'Inactive').length}
          </div>
        </Card>
      </div>

      {/* Providers Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Specialization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {providers.map((provider) => (
                <tr key={provider.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{provider.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{provider.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {provider.phone || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {provider.specialization}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      provider.status === 'Active' 
                        ? 'bg-green-100 text-green-800'
                        : provider.status === 'On Leave'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {provider.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(provider)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteProvider(provider)}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Provider Modal */}
      {showNewProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Create New Service Provider</h3>
            <div className="space-y-4">
              <Input
                label="Full Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                disabled={creating}
              />
              <Input
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
                disabled={creating}
              />
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                disabled={creating}
              />
              <Input
                label="Password *"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                disabled={creating}
              />
              <Select
                label="Specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                disabled={creating}
              >
                <option value="General Support">General Support</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Network Specialist">Network Specialist</option>
                <option value="Software Specialist">Software Specialist</option>
                <option value="Hardware Specialist">Hardware Specialist</option>
              </Select>
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={creating}
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowNewProvider(false);
                  setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    password: '',
                    specialization: 'General Support',
                    status: 'Active'
                  });
                }}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button onClick={createProvider} disabled={creating}>
                {creating ? 'Creating...' : 'Create Provider'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Provider Modal */}
      {showEditProvider && editingProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Edit Service Provider</h3>
            <div className="space-y-4">
              <Input
                label="Full Name *"
                value={editingProvider.name}
                onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                disabled={updating}
              />
              <Input
                label="Email *"
                type="email"
                value={editingProvider.email}
                onChange={(e) => setEditingProvider({ ...editingProvider, email: e.target.value })}
                disabled={updating}
              />
              <Input
                label="Phone"
                type="tel"
                value={editingProvider.phone}
                onChange={(e) => setEditingProvider({ ...editingProvider, phone: e.target.value })}
                disabled={updating}
              />
              <Input
                label="New Password (leave blank to keep current)"
                type="password"
                value={editingProvider.password || ''}
                onChange={(e) => setEditingProvider({ ...editingProvider, password: e.target.value })}
                placeholder="••••••••"
                disabled={updating}
              />
              <Select
                label="Specialization"
                value={editingProvider.specialization}
                onChange={(e) => setEditingProvider({ ...editingProvider, specialization: e.target.value })}
                disabled={updating}
              >
                <option value="General Support">General Support</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Network Specialist">Network Specialist</option>
                <option value="Software Specialist">Software Specialist</option>
                <option value="Hardware Specialist">Hardware Specialist</option>
              </Select>
              <Select
                label="Status"
                value={editingProvider.status}
                onChange={(e) => setEditingProvider({ ...editingProvider, status: e.target.value })}
                disabled={updating}
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditProvider(false);
                  setEditingProvider(null);
                }}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button onClick={updateProvider} disabled={updating}>
                {updating ? 'Updating...' : 'Update Provider'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
