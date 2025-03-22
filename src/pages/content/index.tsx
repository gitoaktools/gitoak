import { createRoot } from 'react-dom/client';
import './style.css';
import GitHubFileExplorer from './components/GitHubFileExplorer';
import { RepoTitleBookmark } from '../../components/RepoTitleBookmark';
import { FileTitleBookmark } from '@src/components/FileTitleBookmark';
import { IssueTitleBookmark } from '@src/components/IssueTitleBookmark';
import { PullRequestTitleBookmark } from '@src/components/PullRequestTitleBookmark';

// Only inject on GitHub pages
if (window.location.hostname === 'github.com') {
  const init = () => {
    // 创建文件浏览器容器
    if (!document.querySelector('#__github_file_explorer_root')) {
      const div = document.createElement('div');
      div.id = '__github_file_explorer_root';
      document.body.appendChild(div);
    }

    // 创建书签容器
    if (!document.querySelector('#__github_bookmark_root')) {
      const bookmarkContainer = document.createElement('div');
      bookmarkContainer.id = '__github_bookmark_root';
      document.body.appendChild(bookmarkContainer);
    }

    // 渲染组件
    const rootContainer = document.querySelector('#__github_file_explorer_root');
    const bookmarkContainer = document.querySelector('#__github_bookmark_root');

    if (rootContainer && bookmarkContainer) {
      const root = createRoot(rootContainer);
      root.render(<GitHubFileExplorer />);

      const bookmarkRoot = createRoot(bookmarkContainer);
      bookmarkRoot.render(<RepoTitleBookmark />);

      const bookmarkRoot1 = createRoot(bookmarkContainer);
      bookmarkRoot1.render(<FileTitleBookmark />);

      const bookmarkRoot2 = createRoot(bookmarkContainer);
      bookmarkRoot2.render(<IssueTitleBookmark />);

      const bookmarkRoot3 = createRoot(bookmarkContainer);
      bookmarkRoot3.render(<PullRequestTitleBookmark />);
    }
  };

  // 初始化
  init();

  // Adjust GitHub's layout to make room for our sidebar
  const adjustGitHubLayout = () => {
    // Check if sidebar is pinned
    chrome.storage.local.get(['fileExplorerPinned', 'fileExplorerWidth', 'fileExplorerOpen'], (result) => {
      const isPinned = result.fileExplorerPinned;
      const isOpen = result.fileExplorerOpen !== undefined ? result.fileExplorerOpen : true;
      const width = result.fileExplorerWidth || 300;
      
      const isRepoPage = window.location.pathname.split('/').length >= 3 && 
                        !window.location.pathname.startsWith('/settings') &&
                        !window.location.pathname.startsWith('/marketplace');
      
      if (isRepoPage) {
        // Find GitHub's containers
        const rootContainer = document.querySelector('#__github_file_explorer_root');
        
        if (rootContainer) {
          // Reset all classes first
          rootContainer.classList.remove('pinned-container');
          document.body.classList.remove('with-sidebar');
          
          if (isOpen) {
            document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
            
            if (isPinned) {
              document.body.classList.add('with-sidebar');
              rootContainer.classList.add('pinned-container');
            }
          } else {
            document.documentElement.style.setProperty('--sidebar-width', '0px');
          }
        }
      }
    });
  };

  // Initial layout adjustment
  adjustGitHubLayout();

  // Adjust layout on URL changes (for SPA navigation)
  const observer = new MutationObserver(() => {
    adjustGitHubLayout();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Check if sidebar is pinned and update container class accordingly
  chrome.storage.local.get(['fileExplorerPinned'], (result) => {
    if (result.fileExplorerPinned) {
      const rootContainer = document.querySelector('#__github_file_explorer_root');
      if (rootContainer) {
        rootContainer.classList.add('pinned-container');
      }
    }
  });

  try {
    console.log('GitHub File Explorer loaded');
  } catch (e) {
    console.error(e);
  }
}
