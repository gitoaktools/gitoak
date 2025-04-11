import { useState, useEffect } from 'react';
import { Server,Trash2 } from 'lucide-react';

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import mcpLogo from '../../../assets/img/mcp.svg';

const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean, onToggle: () => void }) => (
  <div
    onClick={onToggle}
    className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer ${
      enabled ? 'bg-green-500' : 'bg-gray-300'
    }`}
  >
    <div
      className={`bg-white w-4 h-4 rounded-full shadow-md transform ${
        enabled ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </div>
);

export default function MCPSettingsPanel() {
  const [serverUrl, setServerUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTested, setIsTested] = useState(false);
  const [serverList, setServerList] = useState<Array<{url: string, enabled: boolean}>>([]);

  useEffect(() => {
    const loadSettings = async () => {
      const result = await chrome.storage.local.get([ 'mcpServerList']);
      setServerUrl(result.mcpServerUrl || '');
      setServerList(result.mcpServerList || []);
      if (result.mcpServerUrl) {
        checkConnection(result.mcpServerUrl);
      }
    };

    loadSettings();
  }, []);

  const saveSettings = async (key: string, value: any) => {
    await chrome.storage.local.set({ [key]: value });
  };

  const checkConnection = async (url: string) => {
    setIsLoading(true);
    try {
      
        const transport = new StreamableHTTPClientTransport(
            new URL(url)
          );
      
      const client = new Client(
        {
          name: "example-client",
          version: "1.0.0"
        }
      );
      
      await client.connect(transport);

      const tools = await client.listTools();

      if (tools ) {
        setIsConnected(true);
        setIsTested(true);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleServer = async (index: number) => {
    const newList = [...serverList];
    newList[index].enabled = !newList[index].enabled;
    setServerList(newList);
    await saveSettings('mcpServerList', newList);
  };

  const addServer = async (url: string) => {
    if (url && !serverList.some(server => server.url === url)) {
      const newList = [...serverList, { url, enabled: true }];
      setServerList(newList);
      await saveSettings('mcpServerList', newList);
    }
  };

  const deleteServer = async (index: number) => {
    const newList = serverList.filter((_, i) => i !== index);
    setServerList(newList);
    await saveSettings('mcpServerList', newList);
  };

  const handleServerUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setServerUrl(url);
    if (url) {
      checkConnection(url);
      addServer(url);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-lg font-medium mb-4 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-md"
        >
          <div className="flex items-center">
            <img src={mcpLogo} className="w-4 h-4 mr-2" />
            <h4>MCP Server</h4>
          </div>
          <span className="transform transition-transform duration-200" style={{ 
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>
            ▼
          </span>
        </button>
        
        {isExpanded && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={serverUrl}
                  onChange={handleServerUrlChange}
                  placeholder="Enter Streamable HTTPMCP server URL (e.g., http://localhost:3000)"
                  className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600"
                />
                {isLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300"></div>
                  </div>
                )}
                {!isLoading && serverUrl && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                )}
              </div>
              
              <button
                onClick={() => addServer(serverUrl)}
                disabled={!isTested}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Add
              </button>
            </div>
            
            {serverUrl && (
              <div className="flex items-center gap-2 text-sm">
                <Server size={16} />
                <span>Status: {isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            )}

            {serverList.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium mb-2">Server List</h5>
                <div className="space-y-2">
                  {serverList.map((server, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <span className="text-sm">{server.url}</span>
                      <div className="flex gap-2">
                        <ToggleSwitch
                          enabled={server.enabled}
                          onToggle={() => toggleServer(index)}
                        />
                        <button
                          onClick={() => deleteServer(index)}
                          className="px-1 py-1 bg-red-500 text-white rounded-md text-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 