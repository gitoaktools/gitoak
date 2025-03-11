import { createRoot } from 'react-dom/client';
import './style.css';
import GitHubFileExplorer from './components/GitHubFileExplorer';

// Only inject on GitHub pages
if (window.location.hostname === 'github.com') {
  // Create root container
  const div = document.createElement('div');
  div.id = '__github_file_explorer_root';
  document.body.appendChild(div);

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

  // Render our component
  const rootContainer = document.querySelector('#__github_file_explorer_root');
  if (!rootContainer) throw new Error("Can't find Content root element");
  
  // Check if sidebar is pinned and update container class accordingly
  chrome.storage.local.get(['fileExplorerPinned'], (result) => {
    if (result.fileExplorerPinned) {
      rootContainer.classList.add('pinned-container');
    }
  });
  
  const root = createRoot(rootContainer);
  root.render(<GitHubFileExplorer />);

  try {
    console.log('GitHub File Explorer loaded');
  } catch (e) {
    console.error(e);
  }
}
