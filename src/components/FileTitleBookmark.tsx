import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { BookmarkButton } from './BookmarkButton';
import { extractRepoInfo } from '../pages/content/utils/github';

export function FileTitleBookmark() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const injectBookmarkButton = () => {
      const repoInfo = extractRepoInfo(window.location.href);
      if (!repoInfo) return;

      // 检查是否已存在 bookmark 按钮
      const existingButton = document.querySelector('.gitoak-bookmark-file-btn');
      if (existingButton) return;

      // 查找目标插入位置
      const repoNameElement = document.querySelector('div[data-testid="breadcrumbs-filename"]');
      if (!repoNameElement) return;
      
      // 创建容器并注入按钮
      const container = document.createElement('span');
      container.className = 'gitoak-bookmark-file-btn';
      container.style.display = 'inline-flex';
      container.style.alignItems = 'center';
      container.style.verticalAlign = 'middle';
      
      // 简化插入逻辑，直接插入到 repoNameElement 后面
      repoNameElement.insertAdjacentElement('afterend', container);

      const root = createRoot(container);
      root.render(
        <BookmarkButton 
          owner={repoInfo.owner} 
          repo={repoInfo.repo}
          bookmarkType='file'
          repoOnly={false}
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
          const appHeader = document.querySelector('div[data-testid="breadcrumbs-filename"]');
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

    // 监听 turbo:load 事件（GitHub 的页面加载事件）
    const handleTurboLoad = () => {
      setTimeout(injectBookmarkButton, 500);
    };
    document.addEventListener('turbo:load', handleTurboLoad);

    return () => {
      observer.disconnect();
      document.removeEventListener('turbo:load', handleTurboLoad);
      document.querySelectorAll('.gitoak-bookmark-file-btn').forEach(el => el.remove());
    };
  }, []);

  return null;
} 