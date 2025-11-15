'use client';

import { useEffect, useState } from 'react';
import { useMondayContext } from '@/lib/monday-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui/Select';
import { Plus, RefreshCw, Mail, Building2, Key, Edit, Trash2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  company: string;
  companyId: string;
  status: string;
  createdDate: string;
  lastLogin?: string;
  phone?: string;
}

export default function UserManagement() {
  const { executeMondayQuery } = useMondayContext();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [showNewUser, setShowNewUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Active');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadUsers();
    loadCompanies();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const query = `
        query GetUsers($boardId: [ID!]!) {
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
        boardId: ['18379351659'] // User board
      });

      if (response.data?.boards?.[0]?.items_page?.items) {
        const items = response.data.boards[0].items_page.items;
        
        const usersList: User[] = items.map((item: any) => {
          const cols = item.column_values.reduce((acc: any, col: any) => {
            acc[col.id] = col.text || col.value;
            return acc;
          }, {});

          return {
            id: item.id,
            email: cols.email_mkxpm2m0 || item.name,
            phone: cols.phone || '',
            company: cols.dropdown_mkxpsjwd || '',
            companyId: '',
            status: cols.status || 'Active',
            createdDate: item.created_at
          };
        });

        setUsers(usersList);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const query = `
        query GetCompanies($boardId: [ID!]!) {
          boards(ids: $boardId) {
            items_page(limit: 100) {
              items {
                id
                name
              }
            }
          }
        }
      `;

      const response = await executeMondayQuery(query, {
        boardId: ['18379404757']
      });

      if (response.data?.boards?.[0]?.items_page?.items) {
        setCompanies(
          response.data.boards[0].items_page.items.map((item: any) => ({
            id: item.id,
            name: item.name
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  };

  const createUser = async () => {
    if (!userEmail.trim() || !userPassword.trim() || !selectedCompanyId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);

      const mutation = `
        mutation CreateUser($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
          create_item(
            board_id: $boardId,
            item_name: $itemName,
            column_values: $columnValues
          ) {
            id
          }
        }
      `;

      const selectedCompany = companies.find(c => c.id === selectedCompanyId);

      await executeMondayQuery(mutation, {
        boardId: '18379351659',
        itemName: userEmail,
        columnValues: JSON.stringify({
          email_mkxpm2m0: { email: userEmail, text: userEmail },
          text_mkxpxyrr: userPassword,
          dropdown_mkxpsjwd: { labels: [selectedCompany?.name || ''] }
        })
      });

      alert(`User "${userEmail}" created successfully!`);
      
      setShowNewUser(false);
      setUserEmail('');
      setUserPhone('');
      setUserPassword('');
      setSelectedCompanyId('');
      setSelectedStatus('Active');
      loadUsers();

    } catch (err) {
      console.error('Failed to create user:', err);
      alert('Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (user: User) => {
    const company = companies.find(c => c.name === user.company);
    setEditingUser({ ...user });
    setSelectedCompanyId(company?.id || '');
    setUserPassword(''); // Clear password field for optional update
    setShowEditUser(true);
  };

  const updateUser = async () => {
    if (!editingUser) return;

    try {
      setUpdating(true);

      const mutation = `
        mutation UpdateUser($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
          change_multiple_column_values(
            board_id: $boardId,
            item_id: $itemId,
            column_values: $columnValues
          ) {
            id
          }
        }
      `;

      const selectedCompany = companies.find(c => c.id === selectedCompanyId);

      const columnValues: any = {
        email_mkxpm2m0: { email: editingUser.email, text: editingUser.email },
        dropdown_mkxpsjwd: { labels: [selectedCompany?.name || ''] }
      };

      if (userPassword) {
        columnValues.text_mkxpxyrr = userPassword;
      }

      await executeMondayQuery(mutation, {
        boardId: '18379351659',
        itemId: editingUser.id,
        columnValues: JSON.stringify(columnValues)
      });

      alert('User updated successfully!');
      
      setShowEditUser(false);
      setEditingUser(null);
      setUserPassword('');
      setSelectedCompanyId('');
      loadUsers();

    } catch (err) {
      console.error('Failed to update user:', err);
      alert('Failed to update user');
    } finally {
      setUpdating(false);
    }
  };

  const deleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete "${user.email}"?`)) {
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
        itemId: user.id
      });

      alert('User deleted successfully!');
      loadUsers();

    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user');
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
          <h2 className="text-xl font-bold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage client portal users and access
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={loadUsers} variant="secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowNewUser(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Total Users</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{users.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Active Users</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {users.filter(u => u.status === 'Active').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Companies</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{companies.length}</div>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {user.phone || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{user.company || 'Not assigned'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.status === 'Active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.createdDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteUser(user)}
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

      {/* New User Modal */}
      {showNewUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Create New User</h3>
            <div className="space-y-4">
              <Input
                label="Email *"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="user@company.com"
                disabled={creating}
              />
              <Input
                label="Phone"
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                disabled={creating}
              />
              <Input
                label="Password *"
                type="password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="••••••••"
                disabled={creating}
              />
              <Select
                label="Company *"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                disabled={creating}
              >
                <option value="">Select a company...</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </Select>
              <Select
                label="Status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                disabled={creating}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </Select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowNewUser(false);
                  setUserEmail('');
                  setUserPhone('');
                  setUserPassword('');
                  setSelectedCompanyId('');
                  setSelectedStatus('Active');
                }}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button onClick={createUser} disabled={creating}>
                {creating ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Edit User</h3>
            <div className="space-y-4">
              <Input
                label="Email *"
                type="email"
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                disabled={updating}
              />
              <Input
                label="Phone"
                type="tel"
                value={editingUser.phone || ''}
                onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                disabled={updating}
              />
              <Input
                label="New Password (leave blank to keep current)"
                type="password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="••••••••"
                disabled={updating}
              />
              <Select
                label="Company *"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                disabled={updating}
              >
                <option value="">Select a company...</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </Select>
              <Select
                label="Status"
                value={editingUser.status}
                onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                disabled={updating}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </Select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditUser(false);
                  setEditingUser(null);
                  setUserPassword('');
                  setSelectedCompanyId('');
                }}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button onClick={updateUser} disabled={updating}>
                {updating ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
