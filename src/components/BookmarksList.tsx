import { useState, useEffect } from 'react';
import { Bookmark, Trash2, FileText, GitPullRequest, CircleDot, Filter } from 'lucide-react';
import { BookmarkService } from '../services/bookmarkService';
import type { RepoBookmark } from '../types/bookmark';
import { extractFileInfo } from '../pages/content/utils/github';

export function BookmarksList() {
  const [bookmarks, setBookmarks] = useState<RepoBookmark[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['repo', 'file', 'issue', 'pr']));
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  const getBookmarkIcon = (type: string) => {
    switch (type) {
      case 'repo':
        return <Bookmark size={14} />;
      case 'file':
        return <FileText size={14} />;
      case 'pr':
        return <GitPullRequest size={14} />;
      case 'issue':
        return <CircleDot size={14} />;
      default:
        return <Bookmark size={14} />;
    }
  };

  const toggleType = (type: string) => {
    const newTypes = new Set(selectedTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setSelectedTypes(newTypes);
  };

  const filteredBookmarks = bookmarks.filter(bookmark => selectedTypes.has(bookmark.type));

  const sortedAndFilteredBookmarks = filteredBookmarks.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = (a.owner + '/' + a.repo).localeCompare(b.owner + '/' + b.repo);
        break;
      case 'url':
        comparison = a.url.localeCompare(b.url);
        break;
      default:
        comparison = 0;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="p-2">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Bookmark size={16} />
          <h3 className="text-sm font-medium">Bookmarks</h3>
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          title="Filter bookmarks"
        >
          <Filter size={16} />
        </button>
      </div>

      {showFilter && (
        <div className="mb-3 p-3  rounded-lg ">
          <div className="mb-3">
            <div className="text-xs text-gray-400 uppercase font-medium mb-2">Filter by type</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'repo', label: 'Repos' },
                { id: 'pr', label: 'Pull requests' },
                { id: 'issue', label: 'Issues' },
                { id: 'file', label: 'Files' }
              ].map(type => (
                <label key={type.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTypes.has(type.id)}
                    onChange={() => toggleType(type.id)}
                    className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          
        </div>
      )}

      <div className="space-y-2">
        {sortedAndFilteredBookmarks.map(bookmark => (
          <div 
            key={bookmark.url}
            className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <div className="flex items-center gap-2">
              {getBookmarkIcon(bookmark.type)}
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
            </div>
            
            <button
              onClick={() => removeBookmark(bookmark.url)}
              className="p-1 hover:text-red-500"
              title="Remove bookmark"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {filteredBookmarks.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-4">
            No bookmarks yet
          </div>
        )}
      </div>
    </div>
  );
} 