import React, { useState, useEffect } from 'react';
import { AISettings, GroqSettings } from '../../utils/ai';

const defaultSettings: AISettings = {
  provider: 'openai',
  settings: {
    apiKey: '',
    model: 'gemma2-9b-it',
    baseURL: 'https://api.groq.com/openai/v1'
  }
};



export default function GroqSettingsPanel() {
  const [aiSettings, setAiSettings] = useState<AISettings>(defaultSettings);
  
  useEffect(() => {
    const loadSettings = async () => {
      const result = await localStorage.getItem('aiSettings');
      if (result) {
        const parsedSettings = JSON.parse(result);
        if (parsedSettings.provider === defaultSettings.provider) {
          setAiSettings(parsedSettings);
        }
      }
    };

    loadSettings();
  }, []);

  const saveSettings = async (settings: AISettings) => {
    setAiSettings(settings);
  };

  const handleSave = async () => {
    await localStorage.setItem ('aiSettings', JSON.stringify(aiSettings));
    alert('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      <div>
            <div>
              <label className="block mb-2">Model</label>
              <select
                value={aiSettings.settings.model}
                onChange={(e) => {
                  const newSettings = { ...aiSettings, settings: { ...aiSettings.settings, model: e.target.value } };
                  saveSettings(newSettings);
                }}
                className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600"
              >
                <option value="gemma2-9b-it">Gemma2-9b-it</option>
                <option value="qwen-2.5-32b">Qwen-2.5-32b</option>
                <option value="llama-3.3-70b-versatile">Llama-3.1-70b-versatile</option>
              </select>
            </div>

            <div>
              <label className="block mb-2">API Key</label>
              <input
                type="password"
                value={(aiSettings.settings as GroqSettings).apiKey}
                onChange={(e) => {
                  const newSettings = { ...aiSettings, settings: { ...aiSettings.settings, apiKey: e.target.value } };
                  saveSettings(newSettings);
                }}
                className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block mb-2">Base URL</label>
              <input
                type="text"
                value={(aiSettings.settings as GroqSettings).baseURL}
                onChange={(e) => {
                  const newSettings = { ...aiSettings, apiKey: e.target.value };
                  saveSettings(newSettings);
                }}
                className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600"
              />
            </div>

           
            <button 
              onClick={handleSave}
              className="mt-2 w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600"
            >
              Save
            </button>
          </div>
       
      </div>
 
  );
}

// Export the interface and default settings for use in other components
export type { GroqSettings };

