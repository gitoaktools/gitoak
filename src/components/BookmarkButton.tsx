import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { BookmarkService } from '../services/bookmarkService';

interface BookmarkButtonProps {
  owner: string;
  repo: string;
  repoOnly?: boolean;
  bookmarkType: 'repo' | 'file';
}

export function BookmarkButton({ owner, repo, bookmarkType, repoOnly = true }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const currentUrl = window.location.href;

  useEffect(() => {
    loadBookmarkStatus();
  }, [owner, repo, currentUrl]);

  const loadBookmarkStatus = async () => {
    const url = repoOnly ? `https://github.com/${owner}/${repo}` : currentUrl;
    const status = await BookmarkService.isBookmarked(url);
    setIsBookmarked(status);
    setIsLoading(false);
  };

  const toggleBookmark = async () => {
    try {
      const url = repoOnly ? `https://github.com/${owner}/${repo}` : currentUrl;
      
      if (isBookmarked) {
        console.log('Removing bookmark:', url);
        await BookmarkService.removeBookmark(url);
      } else {
        const bookmarkData = {
          type: bookmarkType,
          url,
          owner,
          repo
        };
        console.log('Adding bookmark:', bookmarkData);
        await BookmarkService.addBookmark(bookmarkData);
      }
      setIsBookmarked(!isBookmarked);

      // 验证存储
      const bookmarks = await BookmarkService.getBookmarks();
      console.log('Current bookmarks in storage:', bookmarks);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  if (isLoading) return null;

  return (
    <button
      onClick={toggleBookmark}
      className="color-fg-muted"
      style={{ 
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px',
        marginLeft: '4px',
        borderRadius: '6px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
      }}
      title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
    >
      <Bookmark 
        size={16} 
        className={isBookmarked ? "color-fg-accent" : ""}
        style={{ verticalAlign: 'text-bottom' }}
      />
    </button>
  );
} 