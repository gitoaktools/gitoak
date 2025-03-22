import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { BookmarkButton } from './BookmarkButton';
import { extractRepoInfo } from '../pages/content/utils/github';

export function PullRequestTitleBookmark() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const injectBookmarkButton = () => {
      const repoInfo = extractRepoInfo(window.location.href);
      if (!repoInfo) return;

      // Check if bookmark button already exists
      const existingButton = document.querySelector('.gitoak-bookmark-pr-btn');
      if (existingButton) return;

      // Find the target insertion position - PR title span
      const prTitleElement =  document.querySelector('#partial-discussion-header .gh-header-show span.f1-light.color-fg-muted');

      console.log("prTitleElement",prTitleElement);
      if (!prTitleElement) return;
      
      // Create container and inject button
      const container = document.createElement('span');
      container.className = 'gitoak-bookmark-pr-btn';
      container.style.display = 'inline-flex';
      container.style.alignItems = 'center';
      container.style.verticalAlign = 'middle';
      container.style.marginLeft = '8px';
      
      prTitleElement.appendChild(container);
      // 简化插入逻辑，直接插入到 repoNameElement 后面
      //prTitleElement.insertAdjacentElement('afterend', container);
      const root = createRoot(container);
      root.render(
        <BookmarkButton 
          owner={repoInfo.owner} 
          repo={repoInfo.repo}
          bookmarkType='pr'
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
          const prTitle = document.querySelector('div[data-component="TitleArea"] > h1');
          if (prTitle && prTitle.contains(mutation.target as Node)) {
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
      document.querySelectorAll('.gitoak-bookmark-pr-btn').forEach(el => el.remove());
    };
  }, []);

  return null;
} 