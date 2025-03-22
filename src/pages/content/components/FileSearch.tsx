import { useState, useEffect } from 'react';
import { Search, File, Folder } from 'lucide-react';
import { SearchFileTree } from './SearchFileTree';

interface FileSearchProps {
  repoOwner: string;
  repoName: string;
  defaultBranch: string;
}

export function FileSearch({ repoOwner, repoName, defaultBranch }: FileSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchFiles = (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Get cached tree data
      const cacheKey = `repo_${repoOwner}_${repoName}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { data } = JSON.parse(cachedData);
        const files = data.tree || [];
        
        // Filter files based on search query
        const results = files.filter((item: any) => 
          item.path.toLowerCase().includes(query.toLowerCase())
        );
        
        setSearchResults(results.map((item: any) => ({
          path: item.path,
          type: item.type,
          url: `https://github.com/${repoOwner}/${repoName}/blob/${defaultBranch}/${item.path}`
        })));
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching files:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchFiles(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="p-2">
      <div className="relative">
        <div className="flex items-center gap-2 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
          <Search size={14} className="text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files..."
            className="w-full bg-transparent border-none outline-none text-sm"
          />
        </div>
      </div>

      <div className="mt-2">
        {isLoading ? (
          <div className="text-center py-4 text-sm text-gray-500">
            Searching...
          </div>
        ) : searchResults.length > 0 ? (
          <SearchFileTree
            files={searchResults}
            repoOwner={repoOwner}
            repoName={repoName}
            defaultBranch={defaultBranch}
          />
        ) : searchTerm ? (
          <div className="text-center py-4 text-sm text-gray-500">
            No results found
          </div>
        ) : null}
      </div>
    </div>
  );
} 