import React, { useState, useEffect } from 'react';
import AmazonBedrockSettingsPanel from './aiproviders/AmazonBedrock';
import OpenAISettingsPanel from './aiproviders/OpenAI';
import AnthropicSettingsPanel from './aiproviders/Anthropic';
import OllamaSettingsPanel from './aiproviders/Ollama';
import { AIProviderSettings } from '../utils/ai';
import GroqSettingsPanel from './aiproviders/Groq';

interface AISettings {
  provider: Provider;
  settings:AIProviderSettings;
}

const defaultSettings: AISettings = {
  provider: 'amazonbedrock',
  settings: {
    model: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    region: '',
    accessKey: '',
    secretAccessKey: ''
  }
};

type Provider = 'openai' | 'groq' | 'anthropic' | 'ollama'|'amazonbedrock';

export default function AISettingsPanel() {
  const [aiSettings, setAiSettings] = useState<AISettings>(defaultSettings);
  const [isExpanded, setIsExpanded] = useState(false);
  const [provider, setProvider] = useState<Provider>('amazonbedrock');
  
  useEffect(() => {
    const loadSettings = async () => {
      const result = await localStorage.getItem('aiSettings');
      if (result) {
        const parsedSettings = JSON.parse(result);
        setAiSettings(parsedSettings);
        setProvider(parsedSettings.provider);
      }
    };

    loadSettings();
  }, []);

  const saveSettings = async (settings: AISettings) => {
    await chrome.storage.local.set({ aiSettings: settings });
    setAiSettings(settings);
  };

  const handleSave = async () => {
    await localStorage.setItem('aiSettings', JSON.stringify(aiSettings));
    alert('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-lg font-medium mb-4 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-md"
        >
          <h2>AI Settings</h2>
          <span className="transform transition-transform duration-200" style={{ 
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>
            ▼
          </span>
        </button>
        
        {isExpanded && (
          <div className="space-y-3">
             <div className="mb-4">
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
          className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-sm"
        >
           <option value="amazonbedrock">Amazon Bedrock</option>
          <option value="openai">OpenAI</option>
          <option value="groq">Groq</option>
          <option value="anthropic">Anthropic</option>
          <option value="ollama">Ollama</option>
        </select>
      </div>
      
            {/* <div>
              <label className="block mb-2">AWS Region</label>
              <input
                type="text"
                value={aiSettings.region}
                onChange={(e) => {
                  const newSettings = { ...aiSettings, region: e.target.value };
                  saveSettings(newSettings);
                }}
                placeholder="e.g. us-east-1"
                className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600"
              />
            </div>
            
            <div>
              <label className="block mb-2">Model</label>
              <select
                value={aiSettings.model}
                onChange={(e) => {
                  const newSettings = { ...aiSettings, model: e.target.value };
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
                value={aiSettings.accessKey}
                onChange={(e) => {
                  const newSettings = { ...aiSettings, accessKey: e.target.value };
                  saveSettings(newSettings);
                }}
                className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block mb-2">AWS Secret Access Key</label>
              <input
                type="password"
                value={aiSettings.secretAccessKey}
                onChange={(e) => {
                  const newSettings = { ...aiSettings, secretAccessKey: e.target.value };
                  saveSettings(newSettings);
                }}
                className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600"
              />
            </div>
            <button 
              onClick={handleSave}
              className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600"
            >
              Save
            </button> */}
          </div>
        )}

      {isExpanded && provider === 'amazonbedrock' && (  <AmazonBedrockSettingsPanel/>)}
      {isExpanded && provider === 'openai' && (  <OpenAISettingsPanel/>)}
      {isExpanded && provider === 'anthropic' && (  <AnthropicSettingsPanel/>)}
      {isExpanded && provider === 'ollama' && (  <OllamaSettingsPanel/>)}
      {isExpanded && provider === 'groq' && (  <GroqSettingsPanel/>)}
      </div>
    </div>
  );
}

// Export the interface and default settings for use in other components
export type { AISettings };
export { defaultSettings };
