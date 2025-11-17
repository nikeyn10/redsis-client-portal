'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { MONDAY_CONFIG, BOARD_IDS, COLUMN_IDS, STATUS_VALUES } from '@/lib/monday-config';

interface Project {
  id: string;
  name: string;
  service_type: string;
  start_date: string;
  end_date: string;
  status: string;
  ticket_board_type: string;
  ticket_board_id: string;
  total_tickets: number;
  notes: string;
  site: any[];
  service_providers: any[];
  project_manager: any[];
}

const ProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    service_type: 'maintenance',
    start_date: '',
    end_date: '',
    status: 'planning',
    ticket_board_type: 'master_tickets',
    ticket_board_id: '',
    notes: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const query = `
        query {
          boards(ids: [${BOARD_IDS.PROJECTS}]) {
            items_page {
              items {
                id
                name
                column_values {
                  id
                  text
                  value
                }
              }
            }
          }
        }
      `;

      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.NEXT_PUBLIC_MONDAY_API_TOKEN || '',
          'API-Version': '2023-10'
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      const items = data.data.boards[0].items_page.items;
      const parsedProjects = items.map((item: any) => parseProject(item));
      setProjects(parsedProjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseProject = (item: any): Project => {
    const getColumnValue = (columnId: string) => {
      const col = item.column_values.find((c: any) => c.id === columnId);
      return col?.text || '';
    };

    const getColumnNumeric = (columnId: string) => {
      const col = item.column_values.find((c: any) => c.id === columnId);
      return col?.text ? parseInt(col.text) : 0;
    };

    const getColumnRelation = (columnId: string) => {
      const col = item.column_values.find((c: any) => c.id === columnId);
      if (col?.value) {
        try {
          const parsed = JSON.parse(col.value);
          return parsed.linkedPulseIds || [];
        } catch {
          return [];
        }
      }
      return [];
    };

    return {
      id: item.id,
      name: item.name,
      service_type: getColumnValue(COLUMN_IDS.PROJECTS.SERVICE_TYPE),
      start_date: getColumnValue(COLUMN_IDS.PROJECTS.START_DATE),
      end_date: getColumnValue(COLUMN_IDS.PROJECTS.END_DATE),
      status: getColumnValue(COLUMN_IDS.PROJECTS.STATUS),
      ticket_board_type: getColumnValue(COLUMN_IDS.PROJECTS.TICKET_BOARD_TYPE),
      ticket_board_id: getColumnValue(COLUMN_IDS.PROJECTS.TICKET_BOARD_ID),
      total_tickets: getColumnNumeric(COLUMN_IDS.PROJECTS.TOTAL_TICKETS),
      notes: getColumnValue(COLUMN_IDS.PROJECTS.NOTES),
      site: getColumnRelation(COLUMN_IDS.PROJECTS.SITE),
      service_providers: getColumnRelation(COLUMN_IDS.PROJECTS.SERVICE_PROVIDERS),
      project_manager: getColumnRelation(COLUMN_IDS.PROJECTS.PROJECT_MANAGER)
    };
  };

  const handleCreateProject = async () => {
    try {
      setLoading(true);
      setError(null);

      const mutation = `
        mutation {
          create_item(
            board_id: ${BOARD_IDS.PROJECTS},
            item_name: "${formData.name}",
            column_values: ${JSON.stringify(JSON.stringify({
              [COLUMN_IDS.PROJECTS.SERVICE_TYPE]: { labels: [formData.service_type] },
              [COLUMN_IDS.PROJECTS.START_DATE]: formData.start_date ? { date: formData.start_date } : null,
              [COLUMN_IDS.PROJECTS.END_DATE]: formData.end_date ? { date: formData.end_date } : null,
              [COLUMN_IDS.PROJECTS.STATUS]: { label: formData.status },
              [COLUMN_IDS.PROJECTS.TICKET_BOARD_TYPE]: { labels: [formData.ticket_board_type] },
              [COLUMN_IDS.PROJECTS.TICKET_BOARD_ID]: formData.ticket_board_id,
              [COLUMN_IDS.PROJECTS.NOTES]: formData.notes
            }))}
          ) {
            id
          }
        }
      `;

      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.NEXT_PUBLIC_MONDAY_API_TOKEN || '',
          'API-Version': '2023-10'
        },
        body: JSON.stringify({ query: mutation })
      });

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      // Reset form and refresh
      setFormData({
        name: '',
        service_type: 'maintenance',
        start_date: '',
        end_date: '',
        status: 'planning',
        ticket_board_type: 'master_tickets',
        ticket_board_id: '',
        notes: ''
      });
      setShowCreateForm(false);
      await fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      console.error('Error creating project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async (projectId: string) => {
    try {
      setLoading(true);
      setError(null);

      const mutation = `
        mutation {
          change_multiple_column_values(
            item_id: ${projectId},
            board_id: ${BOARD_IDS.PROJECTS},
            column_values: ${JSON.stringify(JSON.stringify({
              [COLUMN_IDS.PROJECTS.SERVICE_TYPE]: { labels: [formData.service_type] },
              [COLUMN_IDS.PROJECTS.START_DATE]: formData.start_date ? { date: formData.start_date } : null,
              [COLUMN_IDS.PROJECTS.END_DATE]: formData.end_date ? { date: formData.end_date } : null,
              [COLUMN_IDS.PROJECTS.STATUS]: { label: formData.status },
              [COLUMN_IDS.PROJECTS.TICKET_BOARD_TYPE]: { labels: [formData.ticket_board_type] },
              [COLUMN_IDS.PROJECTS.TICKET_BOARD_ID]: formData.ticket_board_id,
              [COLUMN_IDS.PROJECTS.NOTES]: formData.notes
            }))}
          ) {
            id
          }
        }
      `;

      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.NEXT_PUBLIC_MONDAY_API_TOKEN || '',
          'API-Version': '2023-10'
        },
        body: JSON.stringify({ query: mutation })
      });

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      setEditingProject(null);
      await fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
      console.error('Error updating project:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'active') return 'bg-green-100 text-green-800';
    if (normalizedStatus === 'planning') return 'bg-blue-100 text-blue-800';
    if (normalizedStatus === 'on hold') return 'bg-yellow-100 text-yellow-800';
    if (normalizedStatus === 'completed') return 'bg-gray-100 text-gray-800';
    if (normalizedStatus === 'cancelled') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getTicketBoardTypeLabel = (type: string) => {
    const normalizedType = type.toLowerCase();
    if (normalizedType === 'master_tickets') return 'Master Tickets Board';
    if (normalizedType === 'dedicated_board') return 'Dedicated Board';
    return type;
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Project Management</h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ New Project'}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {showCreateForm && (
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Create New Project</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Project Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., HVAC Installation Phase 1"
              />
              <Select
                label="Service Type"
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
              >
                <option value="maintenance">Maintenance</option>
                <option value="installation">Installation</option>
                <option value="repair">Repair</option>
                <option value="inspection">Inspection</option>
                <option value="emergency">Emergency</option>
                <option value="consultation">Consultation</option>
              </Select>
              <Input
                label="Start Date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
              <Select
                label="Ticket Board Type"
                value={formData.ticket_board_type}
                onChange={(e) => setFormData({ ...formData, ticket_board_type: e.target.value })}
              >
                <option value="master_tickets">Master Tickets Board</option>
                <option value="dedicated_board">Dedicated Board</option>
              </Select>
              {formData.ticket_board_type === 'dedicated_board' && (
                <Input
                  label="Dedicated Board ID"
                  value={formData.ticket_board_id}
                  onChange={(e) => setFormData({ ...formData, ticket_board_id: e.target.value })}
                  placeholder="Enter Monday.com board ID"
                />
              )}
            </div>
            <Textarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this project..."
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={!formData.name}>
                Create Project
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{project.name}</h3>
                  <p className="text-gray-600">{project.service_type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingProject(project);
                      setFormData({
                        name: project.name,
                        service_type: project.service_type,
                        start_date: project.start_date,
                        end_date: project.end_date,
                        status: project.status,
                        ticket_board_type: project.ticket_board_type,
                        ticket_board_id: project.ticket_board_id,
                        notes: project.notes
                      });
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>

              {editingProject?.id === project.id ? (
                <div className="space-y-4 border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Service Type"
                      value={formData.service_type}
                      onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                    >
                      <option value="maintenance">Maintenance</option>
                      <option value="installation">Installation</option>
                      <option value="repair">Repair</option>
                      <option value="inspection">Inspection</option>
                      <option value="emergency">Emergency</option>
                      <option value="consultation">Consultation</option>
                    </Select>
                    <Input
                      label="Start Date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                    <Input
                      label="End Date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                    <Select
                      label="Status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="on hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </Select>
                    <Select
                      label="Ticket Board Type"
                      value={formData.ticket_board_type}
                      onChange={(e) => setFormData({ ...formData, ticket_board_type: e.target.value })}
                    >
                      <option value="master_tickets">Master Tickets Board</option>
                      <option value="dedicated_board">Dedicated Board</option>
                    </Select>
                    {formData.ticket_board_type === 'dedicated_board' && (
                      <Input
                        label="Dedicated Board ID"
                        value={formData.ticket_board_id}
                        onChange={(e) => setFormData({ ...formData, ticket_board_id: e.target.value })}
                        placeholder="Enter Monday.com board ID"
                      />
                    )}
                  </div>
                  <Textarea
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setEditingProject(null)}>
                      Cancel
                    </Button>
                    <Button onClick={() => handleUpdateProject(project.id)}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Start Date:</p>
                    <p>{project.start_date || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">End Date:</p>
                    <p>{project.end_date || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ticket Board:</p>
                    <p>{getTicketBoardTypeLabel(project.ticket_board_type)}</p>
                    {project.ticket_board_type === 'dedicated_board' && project.ticket_board_id && (
                      <p className="text-xs text-gray-500">ID: {project.ticket_board_id}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-600">Total Tickets:</p>
                    <p className="text-2xl font-bold">{project.total_tickets}</p>
                  </div>
                  {project.notes && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Notes:</p>
                      <p className="whitespace-pre-wrap">{project.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {projects.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No projects found. Create your first project to get started.
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
