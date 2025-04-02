import  { useState, useEffect } from 'react';
import { AISettings,OllamaSettings } from '../../utils/ai';


const defaultSettings: AISettings = {
  provider: 'ollama',
  settings: {
    model: 'qwen2.5-coder:3b',
    baseURL: 'http://localhost:11434/api'
  }
};



export default function OllamaSettingsPanel() {
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

  const handleSave = async () => {
   
    const newSettings :AISettings = {
      provider: 'ollama',
      settings: {
        model: (aiSettings.settings as OllamaSettings).model,
        baseURL: (aiSettings.settings as OllamaSettings).baseURL
      }
    };
    
    await localStorage.setItem ('aiSettings', JSON.stringify(newSettings));
    alert('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      <div>
         
            
            <div>
              <label className="block mb-2">Model</label>
              <select
                value={(aiSettings.settings as OllamaSettings).model}
                onChange={(e) => {
                  const newSettings = {
                    ...aiSettings,
                    settings: {
                      ...aiSettings.settings,
                      model: e.target.value
                    }
                  };
                  setAiSettings(newSettings);
                }}
                className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600"
              >
                <option value="phi3">phi3</option>
                <option value="qwen2.5-coder:3b">Qwen2.5-Coder</option>
              </select>
            </div>

            
            <div>
              <label className="block mb-2">Base URL</label>
              <input
                type="text"
                value={(aiSettings.settings as OllamaSettings).baseURL}
                onChange={(e) => {
                  const newSettings = {
                    ...aiSettings,
                    settings: {
                      ...aiSettings.settings,
                      baseURL: e.target.value
                    }
                  };
                  setAiSettings(newSettings);
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
export type { OllamaSettings };

