import { useState, useEffect } from 'react';
import { Settings, Pin, X, GitBranch, Bookmark, Library } from 'lucide-react';
import FileTree from './FileTree';
import { extractRepoInfo, isGitHubRepoPage, getDefaultBranch } from '../utils/github';
import SettingsPanel from './SettingsPanel';
import { BookmarksList } from '../../../components/BookmarksList';

export default function GitHubFileExplorer() {
  const [isOpen, setIsOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [width, setWidth] = useState(300);
  const [isDragging, setIsDragging] = useState(false);
  const [isPinned, setIsPinned] = useState<boolean | undefined>(undefined);
  const [repoInfo, setRepoInfo] = useState<{ owner: string; repo: string; branch: string | null } | null>(null);
  const [defaultBranch, setDefaultBranch] = useState<string>('main');
  const [menuPosition, setMenuPosition] = useState({ 
    top: typeof window !== 'undefined' ? Math.max(0, (window.innerHeight - 60) / 2) : 0 
  });
  const [showBookmarks, setShowBookmarks] = useState(false);

  useEffect(() => {
    const loadSavedState = async () => {
      const result = await chrome.storage.local.get([
        'fileExplorerWidth',
        'fileExplorerOpen',
        'fileExplorerPinned',
        'fileExplorerPosition'
      ]);

      setWidth(result.fileExplorerWidth || 300);
      setIsOpen(result.fileExplorerOpen !== undefined ? result.fileExplorerOpen : true);
      setIsPinned(result.fileExplorerPinned || false);
      if (result.fileExplorerPosition) {
        setMenuPosition(result.fileExplorerPosition);
      }

      if (result.fileExplorerPinned) {
        document.body.classList.add('with-sidebar');
      }
    };

    loadSavedState();
  }, []);

  useEffect(() => {
    const saveState = async () => {
      await chrome.storage.local.set({
        fileExplorerWidth: width,
        fileExplorerOpen: isOpen,
        fileExplorerPinned: isPinned,
        fileExplorerPosition: menuPosition
      });

      if (isPinned && isOpen) {
        document.body.classList.add('with-sidebar');
      } else {
        document.body.classList.remove('with-sidebar');
      }

      const rootContainer = document.querySelector('#__github_file_explorer_root');
      if (rootContainer) {
        if (isPinned) {
          rootContainer.classList.add('pinned-container');
        } else {
          rootContainer.classList.remove('pinned-container');
        }
      }
    };

    saveState();
  }, [width, isOpen, isPinned, menuPosition]);

  useEffect(() => {
    if (!isGitHubRepoPage()) return;

    const info = extractRepoInfo(window.location.href);
    if (info) {
      setRepoInfo(info);
      if (!info.branch) {
        getDefaultBranch(info.owner, info.repo)
          .then(branch => setDefaultBranch(branch));
      }
    }

    const handleUrlChange = () => {
      const newInfo = extractRepoInfo(window.location.href);
      if (newInfo && (newInfo.owner !== repoInfo?.owner || newInfo.repo !== repoInfo?.repo)) {
        setRepoInfo(newInfo);
        if (!newInfo.branch) {
          getDefaultBranch(newInfo.owner, newInfo.repo)
            .then(branch => setDefaultBranch(branch));
        }
      }
    };

    let lastUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        handleUrlChange();
      }
    });

    observer.observe(document, { subtree: true, childList: true });

    return () => observer.disconnect();
  }, [repoInfo?.owner, repoInfo?.repo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        setIsPinned(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      if (newWidth > 150 && newWidth < 600) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMenuDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startTop = menuPosition.top;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newTop = startTop + (moveEvent.clientY - startY);
      if (newTop >= 0 && newTop <= window.innerHeight - 60) {
        setMenuPosition({ top: newTop });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const toggleSettings = () => {
    setShowSettings(prev => !prev);
  };

  if (!isGitHubRepoPage() || !repoInfo) {
    return null;
  }

  return (
    <>
      <div 
        className={`${
          isPinned === undefined ? '' : 
          isPinned ? 'sidebar-docked' : 'sidebar-fixed'
        } shadow-md z-[100] ${
          isPinned === undefined ? '' : 'transition-transform duration-300'
        } ${
          isOpen ? 'translate-x-0' : 'translate-x-[-100%]'
        }`}
        style={{ 
          width: isOpen ? `${width}px` : 0,
          minWidth: isOpen ? `${width}px` : 0,
        }}
      >
        {isOpen && (
          <>
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-inherit">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {showSettings ? "Settings" : showBookmarks ? "Bookmarks" : `${repoInfo.owner}/${repoInfo.repo}`}
                </h4>
                {!showSettings && !showBookmarks && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <GitBranch size={12} />
                    {repoInfo.branch || defaultBranch}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                
                <button 
                  onClick={() => {
                    setShowBookmarks(prev => !prev);
                    setShowSettings(false);
                  }}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="View bookmarks"
                >
                  <Bookmark size={16} className={showBookmarks ? "text-blue-500" : ""} />
                </button>

                <button 
                  onClick={toggleSettings}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Toggle settings"
                >
                  <Settings size={16} className={showSettings ? "text-blue-500" : ""} />
                </button>
                <button 
                  onClick={() => setIsPinned(!isPinned)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  title={isPinned ? "Unpin sidebar (Ctrl+Shift+P)" : "Pin sidebar to page (Ctrl+Shift+P)"}
                >
                  <Pin size={16} className={isPinned ? "text-blue-500" : ""} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Close sidebar"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="h-[calc(100%-48px)] overflow-auto bg-inherit">
              {showSettings ? (
                <SettingsPanel />
              ) : showBookmarks ? (
                <BookmarksList />
              ) : (
                <FileTree 
                  repoOwner={repoInfo.owner} 
                  repoName={repoInfo.repo} 
                  defaultBranch={repoInfo.branch || defaultBranch}
                  showHeader={false}
                />
              )}
            </div>
            
            <div
              className="absolute top-0 right-[-12px] h-full w-3 cursor-col-resize flex items-center justify-center opacity-0 hover:opacity-100"
              onMouseDown={handleDragStart}
            >
              <div className="h-8 w-1 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </>
        )}
      </div>
      
      {!isOpen && (
        <div
          className="fixed left-0 bg-[var(--color-canvas-default,#ffffff)] dark:bg-[var(--color-canvas-default,#0d1117)] border-r border-[var(--color-border-default,#d0d7de)] dark:border-[var(--color-border-default,#30363d)] cursor-move shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center z-[100] w-[40px] h-[80px]"
          onClick={() => setIsOpen(true)}
          onMouseDown={handleMenuDragStart}
          title="Show sidebar (drag to move)"
          style={{ top: `${menuPosition.top}px` }}
        >
          <div className="rotate-270 transform origin-center text-gray-600 dark:text-gray-400 text-sm font-medium whitespace-nowrap flex items-center gap-2">
            <Library size={16} />
            GitOak
          </div>
        </div>
      )}
      
      {isDragging && (
        <div className="fixed inset-0 z-[101] cursor-col-resize" />
      )}
    </>
  );
}
