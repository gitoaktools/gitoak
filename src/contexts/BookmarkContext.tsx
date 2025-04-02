import { createContext, useContext, useState, ReactNode } from 'react';

interface BookmarkContextType {
  refreshBookmarks: () => void;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshBookmarks = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <BookmarkContext.Provider value={{ refreshBookmarks }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarkContext() {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error('useBookmarkContext must be used within a BookmarkProvider');
  }
  return context;
} 