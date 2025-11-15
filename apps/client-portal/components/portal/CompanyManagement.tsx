'use client';

import { useEffect, useState } from 'react';
import { useMondayContext } from '@/lib/monday-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Loader } from '@/components/ui/Loader';
import { Plus, ExternalLink, RefreshCw, Link as LinkIcon, Trash2, Edit } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  ticketBoardId: string;
  status: string;
  createdDate: string;
  userCount?: number;
  ticketCount?: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export default function CompanyManagement() {
  const { executeMondayQuery } = useMondayContext();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [showLinkBoard, setShowLinkBoard] = useState(false);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [boardIdToLink, setBoardIdToLink] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);

      const query = `
        query GetCompanies($boardId: [ID!]!) {
          boards(ids: $boardId) {
            items_page(limit: 100) {
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
        boardId: ['18379404757'] // Company board
      });

      if (response.data?.boards?.[0]?.items_page?.items) {
        const items = response.data.boards[0].items_page.items;
        
        const companiesList: Company[] = items.map((item: any) => {
          const cols = item.column_values.reduce((acc: any, col: any) => {
            acc[col.id] = col.text || col.value;
            return acc;
          }, {});

          return {
            id: item.id,
            name: item.name,
            ticketBoardId: cols.dropdown_mkxpakmh || '',
            status: cols.status || 'Active',
            contactName: cols.text_mkxqv75c || '',
            contactEmail: cols.email_mkxqs6z4 || '',
            contactPhone: cols.phone_mkxqb808 || '',
            createdDate: item.created_at
          };
        });

        setCompanies(companiesList);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const linkBoardToCompany = async () => {
    if (!selectedCompany || !boardIdToLink.trim()) {
      alert('Please enter a board ID');
      return;
    }

    try {
      setLinking(true);

      const mutation = `
        mutation UpdateBoardId($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
          change_column_value(
            board_id: $boardId,
            item_id: $itemId,
            column_id: $columnId,
            value: $value
          ) {
            id
          }
        }
      `;

      await executeMondayQuery(mutation, {
        boardId: '18379404757',
        itemId: selectedCompany.id,
        columnId: 'dropdown_mkxpakmh',
        value: JSON.stringify({ label: boardIdToLink })
      });

      alert(`Board ${boardIdToLink} linked successfully!`);
      
      setShowLinkBoard(false);
      setSelectedCompany(null);
      setBoardIdToLink('');
      loadCompanies();

    } catch (err) {
      console.error('Failed to link board:', err);
      alert('Failed to link board');
    } finally {
      setLinking(false);
    }
  };

  const createCompanyAndBoard = async () => {
    if (!companyName.trim()) {
      alert('Please enter a company name');
      return;
    }

    try {
      setCreating(true);

      // Create ticket board
      const createBoardMutation = `
        mutation CreateBoard($boardName: String!, $boardKind: BoardKind!) {
          create_board(
            board_name: $boardName,
            board_kind: $boardKind
          ) {
            id
          }
        }
      `;

      const boardResponse = await executeMondayQuery(createBoardMutation, {
        boardName: `${companyName} - Tickets`,
        boardKind: 'public'
      });

      const newBoardId = boardResponse.data?.create_board?.id;

      if (!newBoardId) {
        throw new Error('Failed to create ticket board');
      }

      // Add columns
      const columns = [
        { title: 'Client Email', columnType: 'email' },
        { title: 'Priority', columnType: 'status' },
        { title: 'Description', columnType: 'long_text' },
        { title: 'Files', columnType: 'file' },
        { title: 'Response Time', columnType: 'numbers' }
      ];

      for (const col of columns) {
        const addColumnMutation = `
          mutation AddColumn($boardId: ID!, $title: String!, $columnType: ColumnType!) {
            create_column(
              board_id: $boardId,
              title: $title,
              column_type: $columnType
            ) {
              id
            }
          }
        `;

        await executeMondayQuery(addColumnMutation, {
          boardId: newBoardId,
          title: col.title,
          columnType: col.columnType
        });
      }

      // Create company entry
      const createCompanyMutation = `
        mutation CreateCompany($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
          create_item(
            board_id: $boardId,
            item_name: $itemName,
            column_values: $columnValues
          ) {
            id
          }
        }
      `;

      await executeMondayQuery(createCompanyMutation, {
        boardId: '18379404757',
        itemName: companyName,
        columnValues: JSON.stringify({
          text_mkxqv75c: editingCompany?.contactName || '',
          email_mkxqs6z4: { email: editingCompany?.contactEmail || '', text: editingCompany?.contactEmail || '' },
          phone_mkxqb808: editingCompany?.contactPhone ? editingCompany.contactPhone.replace(/\D/g, '') : ''
        })
      });

      alert(`Company "${companyName}" created!\nBoard ID: ${newBoardId}`);
      
      setShowNewCompany(false);
      setCompanyName('');
      loadCompanies();

    } catch (err) {
      console.error('Failed to create company:', err);
      alert('Failed to create company');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (company: Company) => {
    setEditingCompany({ ...company });
    setShowEditCompany(true);
  };

  const updateCompany = async () => {
    if (!editingCompany) return;

    try {
      setUpdating(true);

      const mutation = `
        mutation UpdateCompany($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
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
        text_mkxqv75c: editingCompany.contactName || '',
        email_mkxqs6z4: { email: editingCompany.contactEmail || '', text: editingCompany.contactEmail || '' },
        phone_mkxqb808: editingCompany.contactPhone ? editingCompany.contactPhone.replace(/\D/g, '') : ''
      };

      if (editingCompany.ticketBoardId) {
        columnValues.dropdown_mkxpakmh = { labels: [editingCompany.ticketBoardId] };
      }

      await executeMondayQuery(mutation, {
        boardId: '18379404757',
        itemId: editingCompany.id,
        columnValues: JSON.stringify(columnValues)
      });

      // Update name separately if changed
      if (editingCompany.name !== companies.find(c => c.id === editingCompany.id)?.name) {
        const updateNameMutation = `
          mutation UpdateItemName($itemId: ID!) {
            change_simple_column_value(
              item_id: $itemId,
              column_id: "name",
              value: "${editingCompany.name}"
            ) {
              id
            }
          }
        `;

        await executeMondayQuery(updateNameMutation, {
          itemId: editingCompany.id
        });
      }

      alert('Company updated successfully!');
      
      setShowEditCompany(false);
      setEditingCompany(null);
      loadCompanies();

    } catch (err) {
      console.error('Failed to update company:', err);
      alert('Failed to update company');
    } finally {
      setUpdating(false);
    }
  };

  const deleteCompany = async (company: Company) => {
    if (!confirm(`Are you sure you want to delete "${company.name}"? This will NOT delete the ticket board.`)) {
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
        itemId: company.id
      });

      alert('Company deleted successfully!');
      loadCompanies();

    } catch (err) {
      console.error('Failed to delete company:', err);
      alert('Failed to delete company');
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
          <h2 className="text-xl font-bold text-gray-900">Company Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage all companies and their ticket boards
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={loadCompanies} variant="secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowNewCompany(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Company
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Total Companies</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{companies.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">With Boards</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {companies.filter(c => c.ticketBoardId).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Missing Boards</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {companies.filter(c => !c.ticketBoardId).length}
          </div>
        </Card>
      </div>

      {/* Companies Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Board ID
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
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{company.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      company.status === 'Active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {company.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {company.ticketBoardId ? (
                      <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {company.ticketBoardId}
                      </code>
                    ) : (
                      <span className="text-xs text-red-600 font-medium">Not linked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(company.createdDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {company.ticketBoardId ? (
                        <a
                          href={`https://redsisrgh.monday.com/boards/${company.ticketBoardId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Open Board"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedCompany(company);
                            setShowLinkBoard(true);
                          }}
                          className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                          title="Link Board"
                        >
                          <LinkIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(company)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteCompany(company)}
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

      {/* Link Board Modal */}
      {showLinkBoard && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Link Board to {selectedCompany.name}</h3>
            <Input
              label="Board ID"
              value={boardIdToLink}
              onChange={(e) => setBoardIdToLink(e.target.value)}
              placeholder="e.g., 18379446736"
              disabled={linking}
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowLinkBoard(false);
                  setSelectedCompany(null);
                  setBoardIdToLink('');
                }}
                disabled={linking}
              >
                Cancel
              </Button>
              <Button onClick={linkBoardToCompany} disabled={linking}>
                {linking ? 'Linking...' : 'Link Board'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* New Company Modal */}
      {showNewCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Create New Company</h3>
            <Input
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g., Acme Corporation"
              disabled={creating}
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowNewCompany(false);
                  setCompanyName('');
                }}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button onClick={createCompanyAndBoard} disabled={creating}>
                {creating ? 'Creating...' : 'Create Company'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Company Modal */}
      {showEditCompany && editingCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Edit Company</h3>
            <div className="space-y-4">
              <Input
                label="Company Name"
                value={editingCompany.name}
                onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                disabled={updating}
              />
              <Input
                label="Contact Name"
                value={editingCompany.contactName || ''}
                onChange={(e) => setEditingCompany({ ...editingCompany, contactName: e.target.value })}
                placeholder="John Doe"
                disabled={updating}
              />
              <Input
                label="Contact Email"
                type="email"
                value={editingCompany.contactEmail || ''}
                onChange={(e) => setEditingCompany({ ...editingCompany, contactEmail: e.target.value })}
                placeholder="contact@company.com"
                disabled={updating}
              />
              <Input
                label="Contact Phone"
                type="tel"
                value={editingCompany.contactPhone || ''}
                onChange={(e) => setEditingCompany({ ...editingCompany, contactPhone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                disabled={updating}
              />
              <Input
                label="Ticket Board ID"
                value={editingCompany.ticketBoardId || ''}
                onChange={(e) => setEditingCompany({ ...editingCompany, ticketBoardId: e.target.value })}
                placeholder="e.g., 18379446736"
                disabled={updating}
              />
              <Select
                label="Status"
                value={editingCompany.status}
                onChange={(e) => setEditingCompany({ ...editingCompany, status: e.target.value })}
                disabled={updating}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </Select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditCompany(false);
                  setEditingCompany(null);
                }}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button onClick={updateCompany} disabled={updating}>
                {updating ? 'Updating...' : 'Update Company'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
