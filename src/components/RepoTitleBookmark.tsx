import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { BookmarkButton } from './BookmarkButton';
import { extractRepoInfo } from '../pages/content/utils/github';

export function RepoTitleBookmark() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const injectBookmarkButton = () => {
      const repoInfo = extractRepoInfo(window.location.href);
      if (!repoInfo) return;

      // 查找最后一个仓库名称元素
      const repoNameElement = document.querySelector('.AppHeader-context-item:last-child .AppHeader-context-item-label');
      
      if (!repoNameElement || repoNameElement.querySelector('.gitoak-bookmark-btn')) return;

      // 创建容器并注入按钮
      const container = document.createElement('span');
      container.className = 'gitoak-bookmark-btn';
      container.style.display = 'inline-flex';
      container.style.alignItems = 'center';
      container.style.verticalAlign = 'middle';
      
      // 将按钮插入到仓库名称后面
      const parentLink = repoNameElement.closest('.AppHeader-context-item');
      if (parentLink) {
        parentLink.insertAdjacentElement('afterend', container);
      } else {
        repoNameElement.insertAdjacentElement('afterend', container);
      }

      const root = createRoot(container);
      root.render(
        <BookmarkButton 
          owner={repoInfo.owner} 
          repo={repoInfo.repo}
          bookmarkType="repo"
          repoOnly={true}
        />
      );
    };

    // 初始注入
    const initialInject = () => {
      setTimeout(injectBookmarkButton, 1000);
    };
    initialInject();

    // 监听 URL 变化以重新注入
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const appHeader = document.querySelector('.AppHeader-context-full');
          if (appHeader && appHeader.contains(mutation.target as Node)) {
            injectBookmarkButton();
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
      document.querySelectorAll('.gitoak-bookmark-btn').forEach(el => el.remove());
    };
  }, []);

  return null;
}