export interface RepoBookmark {
  owner: string;
  repo: string;
  url: string;
  addedAt: number;
  type: 'repo' | 'file' | 'issue' | 'pr';
} 