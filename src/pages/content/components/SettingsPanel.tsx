import { useState, useEffect } from 'react';
import { Github } from 'lucide-react';

export default function SettingsPanel() {
  const [showSidebarOnHover, setShowSidebarOnHover] = useState(false);
  const [displayIn, setDisplayIn] = useState('Code & pulls');

  useEffect(() => {
    const loadSettings = async () => {
      const result = await chrome.storage.local.get([
        'showSidebarOnHover',
        'displayIn'
      ]);
      
      setShowSidebarOnHover(result.showSidebarOnHover || false);
      setDisplayIn(result.displayIn || 'Code & pulls');
    };

    loadSettings();
  }, []);

  const saveSettings = async (key: string, value: any) => {
    await chrome.storage.local.set({ [key]: value });
  };

  return (
    <div className="p-4">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium mb-4">Authentication</h2>
          <button className="w-full flex items-center justify-center gap-2 bg-[#2da44e] text-white py-2 px-4 rounded-md hover:bg-[#2c974b]">
            <Github size={20} />
            Login with Github
          </button>
          <div className="mt-3">
            <input
              type="text"
              placeholder="Or enter access token"
              className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600"
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-4">Display</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showSidebarOnHover}
                onChange={(e) => {
                  setShowSidebarOnHover(e.target.checked);
                  saveSettings('showSidebarOnHover', e.target.checked);
                }}
                className="rounded"
              />
              Show sidebar on hover
            </label>

            <div className="space-y-2">
              <label className="block">Show in</label>
              <select
                value={displayIn}
                onChange={(e) => {
                  setDisplayIn(e.target.value);
                  saveSettings('displayIn', e.target.value);
                }}
                className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600"
              >
                <option>Code & pulls</option>
                <option>Code only</option>
                <option>Issues</option>
                <option>All pages</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-md">
          <h3 className="font-medium mb-2">Login to unlock:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>File search</li>
            <li>Bookmarking</li>
            <li>Display options</li>
            <li>Large repo support</li>
            <li>Expand/collapse tree</li>
            <li>15-day Pro trial</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 