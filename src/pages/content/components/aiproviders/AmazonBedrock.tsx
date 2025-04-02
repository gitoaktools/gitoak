import React, { useState, useEffect } from 'react';
import { AISettings, AmazonBedrockSettings } from '../../utils/ai';





const defaultSettings: AISettings = {
  provider: 'amazonbedrock',
  settings: {
    model: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    region: '',
    accessKey: '',
    secretAccessKey: ''
  }
};

export default function AmazonBedrockSettingsPanel() {
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
    const newSettings: AISettings = {
      provider: 'amazonbedrock',
      settings: {
        model: (aiSettings.settings as AmazonBedrockSettings).model ,
        region: (aiSettings.settings as AmazonBedrockSettings).region ,
        accessKey: (aiSettings.settings as AmazonBedrockSettings).accessKey ,
        secretAccessKey: (aiSettings.settings as AmazonBedrockSettings).secretAccessKey 
      }
    };
    
    await localStorage.setItem('aiSettings', JSON.stringify(newSettings));
    alert('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      <div>
         
            <div>
              <label className="block mb-2">AWS Region</label>
              <input
                type="text"
                value={(aiSettings.settings as AmazonBedrockSettings).region}
                onChange={(e) => {
                  const newSettings = { ...aiSettings, settings: { ...aiSettings.settings, region: e.target.value } };
                  saveSettings(newSettings);
                }}
                placeholder="e.g. us-east-1"
                className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600"
              />
            </div>
            
            <div>
              <label className="block mb-2">Model</label>
              <select
                value={(aiSettings.settings as AmazonBedrockSettings).model}
                onChange={(e) => {
                  const newSettings = { ...aiSettings, settings: { ...aiSettings.settings, model: e.target.value } };
                  saveSettings(newSettings);
                }}
                className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600"
              >
                <option value="us.deepseek.r1-v1:0">DeepSeek R1</option>
                <option value="us.anthropic.claude-3-7-sonnet-20250219-v1:0">Claude 3.7 Sonnet</option>
                <option value="us.anthropic.claude-3-5-haiku-20240307-v1:0">Claude 3.5 Haiku</option>
               
              </select>
            </div>

            <div>
              <label className="block mb-2">AWS Access Key</label>
              <input
                type="password"
                value={(aiSettings.settings as AmazonBedrockSettings).accessKey}
                onChange={(e) => {
                  const newSettings = { ...aiSettings, settings: { ...aiSettings.settings, accessKey: e.target.value } };
                  saveSettings(newSettings);
                }}
                className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block mb-2">AWS Secret Access Key</label>
              <input
                type="password"
                value={(aiSettings.settings as AmazonBedrockSettings).secretAccessKey}
                onChange={(e) => {
                  const newSettings = { ...aiSettings, settings: { ...aiSettings.settings, secretAccessKey: e.target.value } };
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
export type { AmazonBedrockSettings };

