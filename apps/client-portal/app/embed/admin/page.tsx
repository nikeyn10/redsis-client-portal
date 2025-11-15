'use client';

import { useEffect, useState } from 'react';
import { useMondayContext } from '@/lib/monday-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Plus, ExternalLink, RefreshCw, Link as LinkIcon } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  ticketBoardId: string;
  status: string;
  createdDate: string;
}

export default function AdminManagementPage() {
  const { context, executeMondayQuery } = useMondayContext();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [showLinkBoard, setShowLinkBoard] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [boardIdToLink, setBoardIdToLink] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [creating, setCreating] = useState(false);
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
            createdDate: item.created_at
          };
        });

        setCompanies(companiesList);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
      alert('Failed to load companies');
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

      alert(`Board ${boardIdToLink} linked to ${selectedCompany.name} successfully!`);
      
      setShowLinkBoard(false);
      setSelectedCompany(null);
      setBoardIdToLink('');
      loadCompanies();

    } catch (err) {
      console.error('Failed to link board:', err);
      alert('Failed to link board: ' + (err instanceof Error ? err.message : 'Unknown error'));
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

      // Step 1: Create the ticket board for this company
      const createBoardMutation = `
        mutation CreateBoard($boardName: String!, $boardKind: BoardKind!) {
          create_board(
            board_name: $boardName,
            board_kind: $boardKind
          ) {
            id
            name
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

      console.log('✅ Created ticket board:', newBoardId);

      // Step 2: Add standard columns to the new ticket board
      const addColumnMutations = [
        {
          title: 'Client Email',
          columnType: 'email'
        },
        {
          title: 'Priority',
          columnType: 'status'
        },
        {
          title: 'Description',
          columnType: 'long_text'
        }
      ];

      for (const col of addColumnMutations) {
        const addColumnMutation = `
          mutation AddColumn($boardId: ID!, $title: String!, $columnType: ColumnType!) {
            create_column(
              board_id: $boardId,
              title: $title,
              column_type: $columnType
            ) {
              id
              title
            }
          }
        `;

        await executeMondayQuery(addColumnMutation, {
          boardId: newBoardId,
          title: col.title,
          columnType: col.columnType
        });
      }

      console.log('✅ Added standard columns to ticket board');

      // Step 3: Create company entry in Company board
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

      const columnValues = {
        status: { label: 'Active' },
        dropdown_mkxpakmh: { label: newBoardId }
      };

      await executeMondayQuery(createCompanyMutation, {
        boardId: '18379404757', // Company board
        itemName: companyName,
        columnValues: JSON.stringify(columnValues)
      });

      console.log('✅ Created company entry');

      alert(`Company "${companyName}" created successfully!\nTicket Board ID: ${newBoardId}`);
      
      setShowNewCompany(false);
      setCompanyName('');
      loadCompanies();

    } catch (err) {
      console.error('Failed to create company:', err);
      alert('Failed to create company: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setCreating(false);
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Management</h1>
          <p className="text-gray-600 mt-1">
            Manage companies and their ticket boards
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={loadCompanies} variant="secondary" size="lg">
            <RefreshCw className="w-5 h-5 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowNewCompany(true)} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            New Company
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 mt-0.5">ℹ️</div>
          <div className="text-sm text-blue-800">
            <strong>Two Workflows:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Portal Creation:</strong> Click "New Company" button above to create company + board programmatically</li>
              <li><strong>Monday Automation:</strong> Use button_mkxpx5k6 in Monday.com to create boards, then click "Link Board" to connect them</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-sm font-medium text-gray-600">Total Companies</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {companies.length}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-gray-600">With Boards Linked</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {companies.filter(c => c.ticketBoardId).length}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-gray-600">Missing Boards</div>
          <div className="text-3xl font-bold text-red-600 mt-2">
            {companies.filter(c => !c.ticketBoardId).length}
          </div>
        </Card>
      </div>

      {/* Companies List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Company Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ticket Board ID
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{company.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      company.status === 'Active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {company.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {company.ticketBoardId ? (
                      <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {company.ticketBoardId}
                      </code>
                    ) : (
                      <span className="text-sm text-red-600 font-medium">Not linked ⚠️</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(company.createdDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {company.ticketBoardId ? (
                      <a
                        href={`https://redsisrgh.monday.com/boards/${company.ticketBoardId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Board
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedCompany(company);
                          setShowLinkBoard(true);
                        }}
                        className="text-green-600 hover:text-green-800 inline-flex items-center font-medium"
                      >
                        <LinkIcon className="w-4 h-4 mr-1" />
                        Link Board
                      </button>
                    )}
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
          <Card className="max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Link Board to {selectedCompany.name}</h2>
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Instructions:</strong>
                </p>
                <ol className="text-sm text-yellow-700 mt-2 space-y-1 list-decimal list-inside">
                  <li>Click the "Create Board" button in Monday.com for {selectedCompany.name}</li>
                  <li>Wait for the automation to create the board</li>
                  <li>Copy the board ID from the Monday.com URL</li>
                  <li>Paste it below and click "Link Board"</li>
                </ol>
              </div>

              <Input
                label="Ticket Board ID"
                value={boardIdToLink}
                onChange={(e) => setBoardIdToLink(e.target.value)}
                placeholder="e.g., 18379446736"
                disabled={linking}
              />

              <div className="flex justify-end gap-3 pt-4">
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
                  {linking ? (
                    <>
                      <Loader size="sm" />
                      <span className="ml-2">Linking...</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Link Board
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* New Company Modal */}
      {showNewCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Create New Company</h2>
            <div className="space-y-4">
              <Input
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Acme Corporation"
                disabled={creating}
              />
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>What will be created:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                  <li>New ticket board: "{companyName} - Tickets"</li>
                  <li>Standard columns (Email, Priority, Description)</li>
                  <li>Company entry in Company board</li>
                  <li>Board ID auto-linked to company</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-4">
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
                  {creating ? (
                    <>
                      <Loader size="sm" />
                      <span className="ml-2">Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Company
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
