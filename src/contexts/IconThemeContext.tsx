import React, { createContext, useContext, useState, useEffect } from 'react';

export type IconTheme = 'vscode' | 'vscode-material' | 'classic';

interface IconThemeContextType {
  currentTheme: IconTheme;
  setTheme: (theme: IconTheme) => void;
}

const IconThemeContext = createContext<IconThemeContextType | undefined>(undefined);

export const IconThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<IconTheme>('vscode');

  useEffect(() => {
    // 从存储中加载主题设置
    chrome.storage.sync.get(['iconTheme'], (result) => {
      if (result.iconTheme) {
        setCurrentTheme(result.iconTheme as IconTheme);
      }
    });
  }, []);

  const setTheme = (theme: IconTheme) => {
    setCurrentTheme(theme);
    chrome.storage.sync.set({ iconTheme: theme });
  };

  return (
    <IconThemeContext.Provider value={{ currentTheme, setTheme }}>
      {children}
    </IconThemeContext.Provider>
  );
};

export const useIconTheme = () => {
  const context = useContext(IconThemeContext);
  if (context === undefined) {
    throw new Error('useIconTheme must be used within an IconThemeProvider');
  }
  return context;
}; 