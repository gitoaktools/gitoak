import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, FileIcon, FolderIcon, FolderOpenIcon, Code, ExternalLink, Pin } from 'lucide-react';


interface TreeNode {
  path: string;
  type: 'blob' | 'tree';
  name: string;
  children?: TreeNode[];
  url?: string;
}

interface FileTreeProps {
  repoOwner: string;
  repoName: string;
  defaultBranch: string;
  showHeader?: boolean;
}

export default function FileTree({ repoOwner, repoName, defaultBranch, showHeader = true }: FileTreeProps) {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isPinned, setIsPinned] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [width, setWidth] = useState(250);

  useEffect(() => {
    const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

    const getCachedData = () => {
      const cacheKey = `repo_${repoOwner}_${repoName}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        const { timestamp, data } = JSON.parse(cachedData);
        console.log("FileTree already cached", timestamp);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
      return null;
    };

    const cacheData = (data: any) => {
      const cacheKey = `repo_${repoOwner}_${repoName}`;
      sessionStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data
      }));
    };

    const fetchRepoTree = async () => {
      try {
        setLoading(true);
        
        // Check cache first
        const cachedData = getCachedData();
        if (cachedData) {
          const processedTree = processTree(cachedData.tree);
          setTreeData(processedTree);
          setLoading(false);
          return;
        }

        // First get the commit SHA for the default branch
        const repoResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}`);
        if (!repoResponse.ok) throw new Error('Failed to fetch repository info');
        const repoData = await repoResponse.json();
        // Try to get the tree with the specified branch first
        const treeResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${repoData.default_branch||defaultBranch}?recursive=1`
        );

        
        // If the specified branch doesn't exist, try 'master' branch
        if (treeResponse.status === 404 && (defaultBranch === 'main' || repoData.default_branch === 'main')) {
          const masterTreeResponse = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/master?recursive=1`
          );
          if (masterTreeResponse.ok) {
            const treeData = await masterTreeResponse.json();
            const processedTree = processTree(treeData.tree);
            setTreeData(processedTree);
            return;
          }

          // If both main and master don't exist, try to get all branches
          const branchesResponse = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/branches`
          );

          if (branchesResponse.ok) {
            const branches = await branchesResponse.json();
            if (branches.length > 0) {
              // Try to use the first available branch
              const firstBranch = branches[0].name;
              const firstBranchResponse = await fetch(
                `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${firstBranch}?recursive=1`
              );
              console.log("firstBranchResponse===>", firstBranchResponse);
              if (firstBranchResponse.ok) {
                const treeData = await firstBranchResponse.json();
                console.log("treeData===>", treeData);
                const processedTree = processTree(treeData.tree);
                
                setTreeData(processedTree);
                return;
              }
            }
          }
        }
        
        if (!treeResponse.ok) throw new Error('Failed to fetch repository tree');
        
        const treeData = await treeResponse.json();
        // Cache the response
        cacheData(treeData);
        const processedTree = processTree(treeData.tree);
        setTreeData(processedTree);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load repository files');
      } finally {
        setLoading(false);
      }
    };

    if (repoOwner && repoName) {
      fetchRepoTree();
    }
  }, [repoOwner, repoName, defaultBranch]);

  // Initialize main content margin
  useEffect(() => {
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.classList.remove('with-fixed-sidebar', 'with-docked-sidebar');
      if (isOpen) {
        mainContainer.classList.add(isPinned ? 'with-docked-sidebar' : 'with-fixed-sidebar');
      }
    }

    return () => {
      // Cleanup when component unmounts
      const mainContainer = document.querySelector('main');
      if (mainContainer) {
        mainContainer.classList.remove('with-fixed-sidebar', 'with-docked-sidebar');
      }
    };
  }, [isPinned, isOpen]);

  // Process flat tree into nested structure
  const processTree = (flatTree: any[]): TreeNode[] => {
    const root: Record<string, TreeNode> = {};
    
    // First pass: create all nodes
    
    flatTree.forEach(item => {
      const pathParts = item.path.split('/');
      const name = pathParts[pathParts.length - 1];
      
      root[item.path] = {
        path: item.path,
        type: item.type,
        name,
        children: item.type === 'tree' ? [] : undefined,
        url: item.type === 'blob' ? `https://github.com/${repoOwner}/${repoName}/blob/${defaultBranch}/${item.path}` : undefined
      };
    });
    
    // Second pass: build the tree
    Object.values(root).forEach(node => {
      if (node.path.includes('/')) {
        const pathParts = node.path.split('/');
        pathParts.pop(); // Remove the file/folder name
        const parentPath = pathParts.join('/');
        
        if (root[parentPath] && root[parentPath].children) {
          root[parentPath].children!.push(node);
        }
      }
    });
    
    // Return only top-level nodes
    return Object.values(root).filter(node => !node.path.includes('/'));
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const renderTreeNode = (node: TreeNode) => {
    const isExpanded = expandedFolders.has(node.path);
    
    if (node.type === 'tree') {
      return (
        <div key={node.path}>
          <div 
            className="flex items-center py-1 px-2 hover:bg-gray-100 dark-hover-bg-gray-800 cursor-pointer"
            onClick={() => toggleFolder(node.path)}
          >
            <span className="mr-1">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
            <span className="mr-2">
              {isExpanded ? <FolderOpenIcon size={16} /> : <FolderIcon size={16} />}
            </span>
            <span className="text-sm">{node.name}</span>
          </div>
          
          {isExpanded && node.children && (
            <div className="pl-4 border-l border-gray-200 dark-border-gray-700">
              {node.children.sort((a, b) => {
                // Folders first, then files
                if (a.type !== b.type) {
                  return a.type === 'tree' ? -1 : 1;
                }
                // Alphabetical within each type
                return a.name.localeCompare(b.name);
              }).map(child => renderTreeNode(child))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div key={node.path}>
          <a 
            href={node.url}
            className="flex items-center py-1 px-2 hover:bg-gray-100 dark-hover-bg-gray-800 text-gray-700 dark-text-gray-300 no-underline"
            target="_self"
          >
            <span className="mr-1 w-4"></span>
            <span className="mr-2">
              <FileIcon size={16} />
            </span>
            <span className="text-sm">{node.name}</span>
          </a>
        </div>
      );
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading repository files...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="h-full">
      {showHeader && isOpen && (
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark-border-gray-700">
          <div className="flex items-center">
            <h3 className="text-sm font-medium mr-2">
              {repoOwner}/{repoName}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => {
                setIsPinned(!isPinned);
                const mainContainer = document.querySelector('main');
                if (mainContainer) {
                  mainContainer.classList.remove('with-fixed-sidebar', 'with-docked-sidebar');
                  mainContainer.classList.add(!isPinned ? 'with-docked-sidebar' : 'with-fixed-sidebar');
                }
              }}
              className="p-1 rounded hover:bg-gray-100 dark-hover-bg-gray-800"
              title={isPinned ? "Unpin sidebar (Ctrl+Shift+P)" : "Pin sidebar to page (Ctrl+Shift+P)"}
            >
              <Pin size={16} className={isPinned ? "text-blue-500" : ""} />
            </button>
            <a 
              href={`https://github.com/${repoOwner}/${repoName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded hover:bg-gray-100 dark-hover-bg-gray-800"
            >
              <ExternalLink size={16} className="text-gray-500 hover:text-gray-700" />
            </a>
          </div>
        </div>
      )}
      {isOpen && (
        <div className={`flex-1 overflow-auto p-2 ${!showHeader ? 'h-full' : ''}`}>
            {treeData.length > 0 ? (
              <div>
                {treeData
                  .sort((a, b) => {
                    // Folders first, then files
                    if (a.type !== b.type) {
                      return a.type === 'tree' ? -1 : 1;
                    }
                    // Alphabetical within each type
                    return a.name.localeCompare(b.name);
                  })
                  .map(node => renderTreeNode(node))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">No files found</div>
            )}
          </div>
      )}
    </div>
  );
}
