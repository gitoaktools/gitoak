import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { BookmarkButton } from './BookmarkButton';
import { extractRepoInfo } from '../pages/content/utils/github';

export function IssueTitleBookmark() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const injectBookmarkButton = () => {
      const repoInfo = extractRepoInfo(window.location.href);
      if (!repoInfo) return;

      // Check if bookmark button already exists
      const existingButton = document.querySelector('.gitoak-bookmark-issue-btn');
      if (existingButton) return;

      // Find the target insertion position - issue title span
      const issueTitleElement = document.querySelector('div[data-component="TitleArea"] > h1');
      if (!issueTitleElement) return;
      
      // Create container and inject button
      const container = document.createElement('span');
      container.className = 'gitoak-bookmark-issue-btn';
      container.style.display = 'inline-flex';
      container.style.alignItems = 'center';
      container.style.verticalAlign = 'middle';
      container.style.marginLeft = '8px';
      
      // Insert after the issue title
      //issueTitleElement.insertAdjacentElement('afterend', container);
      issueTitleElement.appendChild(container);
      const root = createRoot(container);
      root.render(
        <BookmarkButton 
          owner={repoInfo.owner} 
          repo={repoInfo.repo}
          bookmarkType='issue'
          repoOnly={false}
        />
      );
    };

    // Initial injection
    const initialInject = () => {
      setTimeout(injectBookmarkButton, 1000);
    };
    initialInject();

    // Watch for URL changes to reinject
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const issueTitle = document.querySelector('div[data-component="TitleArea"] > h1');
          if (issueTitle && issueTitle.contains(mutation.target as Node)) {
            injectBookmarkButton();
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Listen for turbo:load event (GitHub's page load event)
    const handleTurboLoad = () => {
      setTimeout(injectBookmarkButton, 500);
    };
    document.addEventListener('turbo:load', handleTurboLoad);

    return () => {
      observer.disconnect();
      document.removeEventListener('turbo:load', handleTurboLoad);
      document.querySelectorAll('.gitoak-bookmark-issue-btn').forEach(el => el.remove());
    };
  }, []);

  return null;
} 