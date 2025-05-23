/**
 * Extracts repository owner and name from GitHub URL
 */
export function extractRepoInfo(
  url: string,
  repoOnly: boolean = false
): { owner: string; repo: string; branch: string | null } | null {
  // Match GitHub repository URLs, with optional path capture
  const githubRegex = repoOnly
    ? /github\.com\/([^/]+)\/([^/]+)/
    : /github\.com\/([^/]+)\/([^/]+)(?:\/(?:tree|blob)\/([^/]+))?/;
  const match = url.match(githubRegex);
  
  if (!match) return null;
  
  return {
    owner: match[1],
    repo: match[2].replace('.git', '').replace(/#.*$/, ''),
    branch: repoOnly ? null : (match[3] || null)
  };
}

export function extractFileInfo(url: string): string {
  if (url.includes('https://github.com/')) {
    return url.replace('https://github.com/', '');
  }
  return url;
}

/**
 * Checks if the current page is a GitHub repository page
 */
export function isGitHubRepoPage(): boolean {
  const url = window.location.href;
  return url.includes('github.com/') && 
         !url.includes('github.com/settings') && 
         !url.includes('github.com/marketplace') &&
         !url.includes('github.com/explore');
}

/**
 * Gets the default branch name for a repository
 */
export async function getDefaultBranch(owner: string, repo: string): Promise<string> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!response.ok) throw new Error('Failed to fetch repository info');
    
    const data = await response.json();
    return data.default_branch;
  } catch (error) {
    console.error('Error fetching default branch:', error);
    return 'main'; // Fallback to 'main' as default
  }
}
