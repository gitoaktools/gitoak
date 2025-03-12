import { useState, useEffect } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import { BookmarkService } from '../services/bookmarkService';
import type { RepoBookmark } from '../types/bookmark';
import { extractFileInfo } from '../pages/content/utils/github';

export function BookmarksList() {
  const [bookmarks, setBookmarks] = useState<RepoBookmark[]>([]);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async (): Promise<void> => {
    const data = await BookmarkService.getBookmarks();
    console.log(data);
    setBookmarks(data);
  };

  const removeBookmark = async (url: string) => {
    await BookmarkService.removeBookmark(url);
    setBookmarks(bookmarks.filter(b => b.url !== url));
  };

  return (
    <div className="p-2">
      <div className="flex items-center gap-2 mb-2">
        <Bookmark size={16} />
        <h3 className="text-sm font-medium">Bookmarks</h3>
      </div>
      <div className="space-y-2">
        {bookmarks.map(bookmark => (
          <div 
            key={bookmark.url}
            className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <a 
              href={bookmark.url}
              className="text-sm hover:text-blue-500"
              title={bookmark.type === 'repo' 
                ? `${bookmark.owner}/${bookmark.repo}`
                : extractFileInfo(bookmark.url)
              }
            >
              {bookmark.type === 'repo' && `${bookmark.owner}/${bookmark.repo} `}
              {bookmark.type !=='repo' && (
                <span className="truncate block max-w-[200px]">
                  {extractFileInfo(bookmark.url)}
                </span>
              )}
            </a>
            
            <button
              onClick={() => removeBookmark(bookmark.url)}
              className="p-1 hover:text-red-500"
              title="Remove bookmark"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {bookmarks.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-4">
            No bookmarks yet
          </div>
        )}
      </div>
    </div>
  );
} 