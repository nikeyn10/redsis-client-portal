'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { MONDAY_CONFIG, BOARD_IDS, COLUMN_IDS } from '@/lib/monday-config';

interface Site {
  id: string;
  name: string;
  organization: string;
  site_address: string;
  site_contact_name: string;
  site_contact_email: string;
  site_contact_phone: string;
  active_projects: number;
  total_tickets: number;
  status: string;
  notes: string;
  service_providers: any[];
  site_manager: any[];
}

const SiteManagement = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    site_address: '',
    site_contact_name: '',
    site_contact_email: '',
    site_contact_phone: '',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      setLoading(true);
      setError(null);

      const query = `
        query {
          boards(ids: [${BOARD_IDS.SITES}]) {
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
      const parsedSites = items.map((item: any) => parseSite(item));
      setSites(parsedSites);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sites');
      console.error('Error fetching sites:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseSite = (item: any): Site => {
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
      organization: getColumnValue(COLUMN_IDS.SITES.ORGANIZATION),
      site_address: getColumnValue(COLUMN_IDS.SITES.SITE_ADDRESS),
      site_contact_name: getColumnValue(COLUMN_IDS.SITES.SITE_CONTACT_NAME),
      site_contact_email: getColumnValue(COLUMN_IDS.SITES.SITE_CONTACT_EMAIL),
      site_contact_phone: getColumnValue(COLUMN_IDS.SITES.SITE_CONTACT_PHONE),
      active_projects: getColumnNumeric(COLUMN_IDS.SITES.ACTIVE_PROJECTS),
      total_tickets: getColumnNumeric(COLUMN_IDS.SITES.TOTAL_TICKETS),
      status: getColumnValue(COLUMN_IDS.SITES.STATUS),
      notes: getColumnValue(COLUMN_IDS.SITES.NOTES),
      service_providers: getColumnRelation(COLUMN_IDS.SITES.SERVICE_PROVIDERS),
      site_manager: getColumnRelation(COLUMN_IDS.SITES.SITE_MANAGER)
    };
  };

  const handleCreateSite = async () => {
    try {
      setLoading(true);
      setError(null);

      const mutation = `
        mutation {
          create_item(
            board_id: ${BOARD_IDS.SITES},
            item_name: "${formData.name}",
            column_values: ${JSON.stringify(JSON.stringify({
              [COLUMN_IDS.SITES.ORGANIZATION]: formData.organization,
              [COLUMN_IDS.SITES.SITE_ADDRESS]: formData.site_address,
              [COLUMN_IDS.SITES.SITE_CONTACT_NAME]: formData.site_contact_name,
              [COLUMN_IDS.SITES.SITE_CONTACT_EMAIL]: { email: formData.site_contact_email, text: formData.site_contact_email },
              [COLUMN_IDS.SITES.SITE_CONTACT_PHONE]: formData.site_contact_phone,
              [COLUMN_IDS.SITES.STATUS]: { label: formData.status },
              [COLUMN_IDS.SITES.NOTES]: formData.notes
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
        organization: '',
        site_address: '',
        site_contact_name: '',
        site_contact_email: '',
        site_contact_phone: '',
        status: 'active',
        notes: ''
      });
      setShowCreateForm(false);
      await fetchSites();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create site');
      console.error('Error creating site:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSite = async (siteId: string) => {
    try {
      setLoading(true);
      setError(null);

      const mutation = `
        mutation {
          change_multiple_column_values(
            item_id: ${siteId},
            board_id: ${BOARD_IDS.SITES},
            column_values: ${JSON.stringify(JSON.stringify({
              [COLUMN_IDS.SITES.ORGANIZATION]: formData.organization,
              [COLUMN_IDS.SITES.SITE_ADDRESS]: formData.site_address,
              [COLUMN_IDS.SITES.SITE_CONTACT_NAME]: formData.site_contact_name,
              [COLUMN_IDS.SITES.SITE_CONTACT_EMAIL]: { email: formData.site_contact_email, text: formData.site_contact_email },
              [COLUMN_IDS.SITES.SITE_CONTACT_PHONE]: formData.site_contact_phone,
              [COLUMN_IDS.SITES.STATUS]: { label: formData.status },
              [COLUMN_IDS.SITES.NOTES]: formData.notes
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

      setEditingSite(null);
      await fetchSites();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update site');
      console.error('Error updating site:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'active') return 'bg-green-100 text-green-800';
    if (normalizedStatus === 'inactive') return 'bg-gray-100 text-gray-800';
    if (normalizedStatus === 'onboarding') return 'bg-blue-100 text-blue-800';
    if (normalizedStatus === 'archived') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading && sites.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Site Management</h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ New Site'}
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
            <h3 className="text-lg font-semibold">Create New Site</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Site Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Downtown Office"
              />
              <Input
                label="Organization"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="e.g., Acme Corp"
              />
              <Input
                label="Site Address"
                value={formData.site_address}
                onChange={(e) => setFormData({ ...formData, site_address: e.target.value })}
                placeholder="123 Main St, City, State"
              />
              <Input
                label="Contact Name"
                value={formData.site_contact_name}
                onChange={(e) => setFormData({ ...formData, site_contact_name: e.target.value })}
                placeholder="John Doe"
              />
              <Input
                label="Contact Email"
                type="email"
                value={formData.site_contact_email}
                onChange={(e) => setFormData({ ...formData, site_contact_email: e.target.value })}
                placeholder="john@example.com"
              />
              <Input
                label="Contact Phone"
                value={formData.site_contact_phone}
                onChange={(e) => setFormData({ ...formData, site_contact_phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="onboarding">Onboarding</option>
                <option value="archived">Archived</option>
              </Select>
            </div>
            <Textarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this site..."
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSite} disabled={!formData.name}>
                Create Site
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {sites.map((site) => (
          <Card key={site.id}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{site.name}</h3>
                  <p className="text-gray-600">{site.organization}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(site.status)}>
                    {site.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingSite(site);
                      setFormData({
                        name: site.name,
                        organization: site.organization,
                        site_address: site.site_address,
                        site_contact_name: site.site_contact_name,
                        site_contact_email: site.site_contact_email,
                        site_contact_phone: site.site_contact_phone,
                        status: site.status,
                        notes: site.notes
                      });
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>

              {editingSite?.id === site.id ? (
                <div className="space-y-4 border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Organization"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    />
                    <Input
                      label="Site Address"
                      value={formData.site_address}
                      onChange={(e) => setFormData({ ...formData, site_address: e.target.value })}
                    />
                    <Input
                      label="Contact Name"
                      value={formData.site_contact_name}
                      onChange={(e) => setFormData({ ...formData, site_contact_name: e.target.value })}
                    />
                    <Input
                      label="Contact Email"
                      type="email"
                      value={formData.site_contact_email}
                      onChange={(e) => setFormData({ ...formData, site_contact_email: e.target.value })}
                    />
                    <Input
                      label="Contact Phone"
                      value={formData.site_contact_phone}
                      onChange={(e) => setFormData({ ...formData, site_contact_phone: e.target.value })}
                    />
                    <Select
                      label="Status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="onboarding">Onboarding</option>
                      <option value="archived">Archived</option>
                    </Select>
                  </div>
                  <Textarea
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setEditingSite(null)}>
                      Cancel
                    </Button>
                    <Button onClick={() => handleUpdateSite(site.id)}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Address:</p>
                    <p>{site.site_address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Contact:</p>
                    <p>{site.site_contact_name || 'N/A'}</p>
                    <p className="text-blue-600">{site.site_contact_email}</p>
                    <p>{site.site_contact_phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Active Projects:</p>
                    <p className="text-2xl font-bold">{site.active_projects}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Tickets:</p>
                    <p className="text-2xl font-bold">{site.total_tickets}</p>
                  </div>
                  {site.notes && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Notes:</p>
                      <p className="whitespace-pre-wrap">{site.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {sites.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No sites found. Create your first site to get started.
        </div>
      )}
    </div>
  );
};

export default SiteManagement;
