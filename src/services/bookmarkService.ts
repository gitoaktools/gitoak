export interface BookmarkData {
  type: 'repo' | 'file' | 'issue' | 'pr';
  url: string;
  owner: string;
  repo: string;
  addedAt: number;
}

export const BookmarkService = {
  async getBookmarks(): Promise<BookmarkData[]> {
    try {
      const result = await chrome.storage.local.get('bookmarks');
      console.log('Retrieved from storage:', result);
      return result.bookmarks || [];
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      return [];
    }
  },

  async addBookmark(data: Omit<BookmarkData, 'addedAt'>): Promise<BookmarkData> {
    try {
      const bookmarks = await this.getBookmarks();
      
      // Check if bookmark with same URL already exists
      const existingBookmark = bookmarks.find(b => b.url === data.url);
      if (existingBookmark) {
        return existingBookmark;
      }

      const newBookmark: BookmarkData = {
        ...data,
        addedAt: Date.now()
      };
      
      console.log('Saving bookmarks:', [...bookmarks, newBookmark]);
      await chrome.storage.local.set({
        bookmarks: [...bookmarks, newBookmark]
      });
      
      return newBookmark;
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  },

  async removeBookmark(url: string): Promise<void> {
    try {
      console.log('Removing bookmark:', url);
      const bookmarks = await this.getBookmarks();
      const filteredBookmarks = bookmarks.filter(b => b.url !== url);
      console.log('Saving filtered bookmarks:', filteredBookmarks);
      await chrome.storage.local.set({
        bookmarks: filteredBookmarks
      });
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  },

  async isBookmarked(url: string): Promise<boolean> {
    try {
      const bookmarks = await this.getBookmarks();
      return bookmarks.some(b => b.url === url);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      return false;
    }
  }
}; 