import { useState, useEffect } from 'react';
import { Github,Trash2 } from 'lucide-react';
import AISettingsPanel from './AISettings';
import MCPSettingsPanel from './MCPSettingsPanel';

export default function SettingsPanel() {
  const [showSidebarOnHover, setShowSidebarOnHover] = useState(false);
  const [displayIn, setDisplayIn] = useState('Code & pulls');
  const [accessToken, setAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<{ avatar_url?: string; login?: string } | null>(null);

  const fetchUserProfile = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
        },
      });
      const data = await response.json();
      setUserProfile(data);
      localStorage.setItem('userProfile', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

    const _accessToken = localStorage.getItem('accessToken');
    if (_accessToken) {
      setAccessToken(_accessToken);
      fetchUserProfile(_accessToken);
    }
    // Add message listener for OAuth popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'oauth_token') {
        setAccessToken(event.data.token);
        saveSettings('githubToken', event.data.token);
        localStorage.setItem('accessToken', event.data.token);
        fetchUserProfile(event.data.token);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const saveSettings = async (key: string, value: any) => {
    await chrome.storage.local.set({ [key]: value });
  };

  const handleAccessTokenChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const token = e.target.value;
    setAccessToken(token);
    if (token) {
      try {
        await fetchUserProfile(token);
        localStorage.setItem('accessToken', token);
      } catch (error) {
        console.error('Invalid access token');
        // 可以在这里添加错误提示UI
      }
    } else {
      handleLogout();
    }
  };

  const handleGithubLogin = () => {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      `https://github.com/login/oauth/authorize?client_id=Ov23liM5hNM6O0u0xjvx&scope=repo,user`,
      'GitHub OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Watch for popup window close
    const checkPopup = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkPopup);
      }
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userProfile');
    setAccessToken('');
    setUserProfile(null);
  };

  return (
    <div className="p-4">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium mb-4">Authentication</h2>
          {accessToken ? (
            <div className="mb-4">
              {userProfile && (
                <div className="flex items-center gap-3 mb-2">
                  <img 
                    src={userProfile.avatar_url} 
                    alt={userProfile.login}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm">{userProfile.login}</span>  <button className="ml-auto" onClick={handleLogout}><Trash2 size={16}/></button>
                </div>
              )}
             
            </div>
          ) : (
            <button 
              onClick={handleGithubLogin}
            className="w-full flex items-center justify-center gap-2 bg-[#2da44e] text-white py-2 px-4 rounded-md hover:bg-[#2c974b]"
          >
            <Github size={20} />
            Login with Github
          </button>)}
          {!accessToken && (  
          <div className="mt-3">
            <div className="relative">
              <input
                type="text"
                value={accessToken}
                onChange={handleAccessTokenChange}
                placeholder="Or enter access token"
                className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600"
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300"></div>
                </div>
              )}
            </div>
          </div>)}
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
      {!accessToken && (
        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-md">
          <h3 className="font-medium mb-2">Login to unlock:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>File search</li>
            <li>Bookmarking</li>
            <li>Display options</li>
            <li>Large repo support</li>
            <li>Expand/collapse tree</li>
           </ul>
        </div>
      )}

      <AISettingsPanel />
      <MCPSettingsPanel />
      </div>
    </div>
  );
} 