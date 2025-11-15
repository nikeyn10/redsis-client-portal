'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Settings, Database, Bell, Lock } from 'lucide-react';

export default function PortalSettings() {
  const [settings, setSettings] = useState({
    portalName: 'IBACS Client Portal',
    portalUrl: 'https://monday-vibe-portal-hg7r9rfa9-mike-habibs-projects.vercel.app',
    userBoardId: '18379351659',
    companyBoardId: '18379404757',
    enableNotifications: true,
    enableFileUploads: true,
    maxFileSize: 10
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Portal Settings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure your client portal settings
        </p>
      </div>

      {/* General Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">General Settings</h3>
        </div>
        <div className="space-y-4">
          <Input
            label="Portal Name"
            value={settings.portalName}
            onChange={(e) => setSettings({ ...settings, portalName: e.target.value })}
          />
          <Input
            label="Portal URL"
            value={settings.portalUrl}
            onChange={(e) => setSettings({ ...settings, portalUrl: e.target.value })}
            disabled
          />
        </div>
      </Card>

      {/* Board Configuration */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Board Configuration</h3>
        </div>
        <div className="space-y-4">
          <Input
            label="User Board ID"
            value={settings.userBoardId}
            onChange={(e) => setSettings({ ...settings, userBoardId: e.target.value })}
            disabled
          />
          <Input
            label="Company Board ID"
            value={settings.companyBoardId}
            onChange={(e) => setSettings({ ...settings, companyBoardId: e.target.value })}
            disabled
          />
          <p className="text-xs text-gray-500">
            Board IDs are set during initial configuration and cannot be changed here.
          </p>
        </div>
      </Card>

      {/* Feature Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Feature Settings</h3>
        </div>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.enableNotifications}
              onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
              className="rounded border-gray-300"
            />
            <div>
              <div className="font-medium text-gray-900">Enable Notifications</div>
              <div className="text-sm text-gray-500">Send email notifications for ticket updates</div>
            </div>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.enableFileUploads}
              onChange={(e) => setSettings({ ...settings, enableFileUploads: e.target.checked })}
              className="rounded border-gray-300"
            />
            <div>
              <div className="font-medium text-gray-900">Enable File Uploads</div>
              <div className="text-sm text-gray-500">Allow clients to attach files to tickets</div>
            </div>
          </label>
          <Input
            label="Max File Size (MB)"
            type="number"
            value={settings.maxFileSize}
            onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
          />
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
