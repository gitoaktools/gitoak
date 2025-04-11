import { useState, useEffect } from 'react';
import { generateText ,experimental_createMCPClient} from 'ai';
import { AISettings, getModel } from '../utils/ai';
import ReactMarkdown from 'react-markdown';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

type AIProvider = 'anthropic' | 'openai' | 'ollama' | 'amazonbedrock';

interface ChatWindowProps {
  repoOwner: string;
  repoName: string;
  defaultBranch: string;
  onClose: () => void;
  showSettings?: ()=>void;
}


export function ChatWindow({ repoOwner, repoName, defaultBranch,onClose,showSettings}: ChatWindowProps) {
 
  const [message, setMessage] = useState('');
  const [hasSettings, setHasSettings] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ text: string; isUser: boolean }>>([{text:'Hello, I am a AI assistant for GitHub, how can I help you today?',isUser:false}]);
  const [page,setPage] = useState<string>(window.location.href);
  const [aiSettings, setAiSettings] = useState<AISettings>();
  const [aiClient, setAiClient] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [includePageContent, setIncludePageContent] = useState(false);
  const [pageContent, setPageContent] = useState<string>('');
  const [useJinaReader, setUseJinaReader] = useState(true);
  const [mcpServerList, setMcpServerList] = useState<Array<{url: string}>>([]);
  const [tools, setTools] = useState<any>();
  
  useEffect(() => {
    const loadAiSettings = async () => {
      const aiSettings = await localStorage.getItem('aiSettings');
      if (aiSettings) {
        const aiSettingsObject:AISettings = JSON.parse(aiSettings);
        setAiSettings(aiSettingsObject);
        const _aiClient = await getModel(aiSettingsObject.provider as AIProvider, aiSettingsObject.settings);
        setAiClient(_aiClient);
        setHasSettings(true);
      }
    };
    loadAiSettings();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      
      const result = await chrome.storage.local.get(['mcpServerUrl', 'mcpServerList']);
      if (result.mcpServerList) {
        const enabledServers = result.mcpServerList
          .filter((server: { url: string; enabled: boolean }) => server.enabled)
          .map((server: { url: string; enabled: boolean }) => ({ url: server.url }
          ));

        
       await enabledServers.map(async (server: { url: string }) => {
          const transport = new StreamableHTTPClientTransport(
            new URL(server.url)
          );
          const client= await experimental_createMCPClient({
            transport,
          });
          const tool = await client.tools();
          console.log(tool)
          setTools((prev:any)=>({...prev,...tool}))
        })
        
      }

     
      
    };

    loadSettings();
  }, []);

  // Add new function to fetch page content
  const fetchPageContent = async () => {
    try {
      
      let pageURL = '';
      if (useJinaReader) {
        const baseUrl: string = 'https://r.jina.ai';
        pageURL = `${baseUrl}/${encodeURIComponent(window.location.href)}`;
      } else {
        pageURL = window.location.href;
      }
      
      console.log(pageURL)
      // 发送请求
      const response = await fetch(pageURL);
      const text = await response.text();
      console.log(text)
      setPageContent(text);
    } catch (error) {
      console.error('Error fetching page content:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setChatHistory(prev => [...prev, { text: message, isUser: true }]);
    setMessage('');
    setIsLoading(true);
    
    try {
      let prompt = message;
     
      if (includePageContent && pageContent) {
        console.log(pageContent)
        prompt = `Page content:\n${pageContent}\n\nUser message:\n${message}`;
      }

      const { text } = await generateText({
        model: aiClient,
        prompt: prompt,
        tools: tools,
        maxSteps: 10
      });

      console.log(text)

      setChatHistory(prev => [...prev, { text, isUser: false }]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      setChatHistory(prev => [...prev, { 
        text: hasSettings?'Sorry, I encountered an error. Please try again.' :'Please set the AI provider first.', 
        isUser: false 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-2 flex flex-col h-[85vh]">
      

      {hasSettings===false?(<div className="flex-1 overflow-auto mb-4">
      <button onClick={()=>{
                showSettings?.()
              }}>Please set the AI provider first.</button>

      </div>):(<div className="flex-1 overflow-auto mb-4">
       {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 p-2 rounded-lg ${
              msg.isUser
                ? 'bg-blue-100 dark:bg-blue-900 ml-auto'
                : 'bg-gray-100 dark:bg-gray-800 mr-auto'
            } max-w-[80%]`}
          >
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>)}

      <div className="relative">
        <div className="flex items-center gap-2 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="w-full bg-transparent border-none outline-none text-sm"
          />
          <div className="flex items-center gap-2">
            
            <button
              onClick={handleSendMessage}
              className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 flex items-center gap-2"
              disabled={!aiClient || isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
      {aiSettings&&<h6>{aiSettings?.provider}:{aiSettings?.settings.model}</h6>}
       
      <label className="flex items-center gap-1 text-sm">
      
      <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={useJinaReader}
                onChange={(e) => {
                  setUseJinaReader(e.target.checked);
                }}
                className="rounded border-gray-300"
              />
              Use Jina Reader
            </label>
              <input
                type="checkbox"
                checked={includePageContent}
                onChange={(e) => {
                  setIncludePageContent(e.target.checked);
                  if (e.target.checked) {
                    fetchPageContent();
                  }
                }}
                className="rounded border-gray-300"
              />
              Include page
            </label>
        {page}
       
      </div>
    </div>
  );
} 