import { useState } from 'react';
import { ChevronRight, ChevronDown, FileIcon, FolderIcon, FolderOpenIcon } from 'lucide-react';

interface TreeNode {
  path: string;
  type: 'blob' | 'tree';
  name: string;
  children?: TreeNode[];
  url?: string;
}

interface SearchFileTreeProps {
  files: any[];
  repoOwner: string;
  repoName: string;
  defaultBranch: string;
}

export function SearchFileTree({ files, repoOwner, repoName, defaultBranch }: SearchFileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Process flat search results into nested structure
  const processSearchResults = (flatFiles: any[]): TreeNode[] => {
    const root: Record<string, TreeNode> = {};
    
    // First pass: create all nodes
    flatFiles.forEach(item => {
      const pathParts = item.path.split('/');
      const name = pathParts[pathParts.length - 1];
      
      // Create folder nodes for each part of the path
      let currentPath = '';
      pathParts.forEach((part: string, index: number) => {
        const isLast = index === pathParts.length - 1;
        currentPath = index === 0 ? part : `${currentPath}/${part}`;
        
        if (!root[currentPath]) {
          root[currentPath] = {
            path: currentPath,
            type: isLast ? item.type : 'tree',
            name: part,
            children: isLast ? undefined : [],
            url: isLast ? item.url : undefined
          };
        }
      });
    });
    
    // Second pass: build the tree
    Object.values(root).forEach(node => {
      if (node.path.includes('/')) {
        const pathParts = node.path.split('/');
        pathParts.pop();
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
            className="flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
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
            <div className="pl-4 border-l border-gray-200 dark:border-gray-700">
              {node.children.sort((a, b) => {
                if (a.type !== b.type) {
                  return a.type === 'tree' ? -1 : 1;
                }
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
            className="flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 no-underline"
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

  const treeData = processSearchResults(files);

  return (
    <div className="h-full overflow-auto">
      {treeData.length > 0 ? (
        <div>
          {treeData
            .sort((a, b) => {
              if (a.type !== b.type) {
                return a.type === 'tree' ? -1 : 1;
              }
              return a.name.localeCompare(b.name);
            })
            .map(node => renderTreeNode(node))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-4">No files found</div>
      )}
    </div>
  );
} 