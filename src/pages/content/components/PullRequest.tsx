import { useState, useEffect, useMemo } from 'react';
import { MessageSquare, GitPullRequest, FileCode, Clock, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateText } from 'ai';
import { AISettings, getModel } from '../utils/ai';

type AIProvider = 'anthropic' | 'openai' | 'ollama' | 'amazonbedrock';


interface PullRequestData {
  number: number;
  title: string;
  body: string;
  state: string;
  merged: boolean;
  created_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
}

interface Comment {
  id: number;
  body: string;
  created_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
}

interface ChangedFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

interface Review {
  id: number;
  state: string;
  body: string;
  submitted_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
}

interface ChildComponentProps {
  onShowPanel: (panel: 'settings' | 'bookmarks' | 'search' | 'chat' | 'pullRequest') => void;
  // ... other existing props
}

export function PullRequest({onShowPanel}:ChildComponentProps) {
  const [prData, setPrData] = useState<PullRequestData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [files, setFiles] = useState<ChangedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<{ owner: string; repo: string; number: string } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviews, setShowReviews] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const [, setAiSettings] = useState<AISettings>();
  const [aiClient, setAiClient] = useState<any>();
  const [summary, setSummary] = useState<string>('');
  const [hasSettings, setHasSettings] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [auth,setAuth] = useState(false);

  
  useEffect(() => {
    const loadAiSettings = async () => {
      const aiSettings = await localStorage.getItem('aiSettings');
      if (aiSettings) {
        const aiSettingsObject:AISettings = JSON.parse(aiSettings);
        setAiSettings(aiSettingsObject);
        const _aiClient = await getModel(aiSettingsObject.provider as AIProvider, aiSettingsObject.settings);
        setAiClient(_aiClient);
        setHasSettings(true);
      }
    };
    const checkAuth = async () => {
      const accessToken = await  localStorage.getItem('accessToken');
      if (!accessToken) {
        setError('GitHub token not found. Please set up your token in settings.');
        setLoading(false);
        return;
      }
      setAuth(true);
    }
    loadAiSettings();
    checkAuth();
  }, []);


  useEffect(() => {
    // Extract PR information from URL
    const url = window.location.href;
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    
    
    if (match) {
      const [, owner, repo, number] = match;
      setParams({ owner, repo, number });  
     
    } else {
      setError('Invalid GitHub pull request URL');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log(window.location.href);
    if (!params) return;

    const fetchPRData = async () => {
      try {
        const accessToken = await  localStorage.getItem('accessToken');
        
        if (!accessToken) {
          setError('GitHub token not found. Please set up your token in settings.');
          setLoading(false);
          return;
        }

        

        const headers = {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        };

        // Fetch PR details
        const prResponse = await fetch(
          `https://api.github.com/repos/${params.owner}/${params.repo}/pulls/${params.number}`,
          { headers }
        );
        if (!prResponse.ok) throw new Error('Failed to fetch PR details');
        const prData = await prResponse.json();
        console.log('prData',prData);
        setPrData(prData);

        // Fetch PR comments
        const commentsResponse = await fetch(
          `https://api.github.com/repos/${params.owner}/${params.repo}/issues/${params.number}/comments`,
          { headers }
        );
        if (!commentsResponse.ok) throw new Error('Failed to fetch comments');
        const commentsData = await commentsResponse.json();
        setComments(commentsData);
        console.log('commentsData',commentsData);

        // Fetch PR files
        const filesResponse = await fetch(
          `https://api.github.com/repos/${params.owner}/${params.repo}/pulls/${params.number}/files`,
          { headers }
        );
        if (!filesResponse.ok) throw new Error('Failed to fetch files');
        const filesData = await filesResponse.json();
        setFiles(filesData);

        // 获取PR reviews
        const reviewsResponse = await fetch(
          `https://api.github.com/repos/${params.owner}/${params.repo}/pulls/${params.number}/reviews`,
          { headers }
        );
        if (!reviewsResponse.ok) throw new Error('Failed to fetch reviews');
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData);
        console.log('reviewsData', reviewsData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPRData();
  }, [params]);

  // Cache PR data
  const prDetails = useMemo(() => {
    if (!prData) return null;
    return {
      title: prData.title,
      body: prData.body,
      status: prData.merged ? 'Merged' : prData.state === 'closed' ? 'Closed' : 'Open',
      author: prData.user.login,
      createdAt: new Date(prData.created_at).toLocaleDateString()
    };
  }, [prData]);

  // Cache files data
  const filesSummary = useMemo(() => {
    return files.map(file => ({
      filename: file.filename,
      changes: `+${file.additions} -${file.deletions}`
    }));
  }, [files]);

  // Cache reviews data
  const reviewsSummary = useMemo(() => {
    return reviews.map(review => ({
      reviewer: review.user.login,
      status: review.state,
      comment: review.body || 'No comment provided',
      date: new Date(review.submitted_at).toLocaleDateString()
    }));
  }, [reviews]);

  // Cache comments data
  const commentsSummary = useMemo(() => {
    return comments.map(comment => ({
      commenter: comment.user.login,
      comment: comment.body,
      date: new Date(comment.created_at).toLocaleDateString()
    }));
  }, [comments]);

  const handleSummary = async () => {
    
    try {
      setSummaryLoading(true);
      if (!hasSettings) {
        setSummary('Please set the AI provider first.');
        return;
      }
      if (!prDetails) {
        setSummary('Pull request not found');
        return;
      }
      let prompt = `Please provide a comprehensive summary of this Pull Request:

Title: ${prDetails.title}
Description: ${prDetails.body || 'No description provided'}
Status: ${prDetails.status}
Created by: ${prDetails.author}
Created at: ${prDetails.createdAt}

Files Changed (${filesSummary.length}):
${filesSummary.map(file => `- ${file.filename} (${file.changes})`).join('\n')}

Reviews (${reviewsSummary.length}):
${reviewsSummary.map(review => `
Reviewer: ${review.reviewer}
Status: ${review.status}
Comment: ${review.comment}
Date: ${review.date}
`).join('\n')}

Comments (${commentsSummary.length}):
${commentsSummary.map(comment => `
Commenter: ${comment.commenter}
Comment: ${comment.comment}
Date: ${comment.date}
`).join('\n')}

Please provide a concise summary that includes:
1. The main purpose of this PR
2. Key changes made
3. Important feedback from reviews and comments
4. Overall status and outcome`;

console.log(prompt);
console.log(aiClient);

      const { text } = await generateText({
        model: aiClient,
        prompt: prompt,
      });
      setSummary(text);
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      setSummary('Sorry, I encountered an error. Please try again.');
    } finally {
      setSummaryLoading(false);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    if (!auth) {
      return (
        <div className="p-4">
          <p>Please go to <a href="#" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors" 
                  onClick={(e) => { e.preventDefault(); onShowPanel('settings'); }}>settings</a> to authenticate with GitHub.
          </p>
        </div>
      );
    }

    return (
      <div className="p-4 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!prData) {
    return (
      <div className="p-4">
        <p>Pull request not found</p>
      </div>
    );
  }

  

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* PR Header */}
      <div className="mb-6 border-b pb-4">
        <div className="flex items-center gap-2 mb-2">
          <GitPullRequest className="text-green-500" />
          <span className="text-sm text-gray-500">
            #{prData.number} opened by {prData.user.login}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            prData.merged 
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
              : prData.state === 'closed'
              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
              : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
          }`}>
            {prData.merged ? 'Merged' : prData.state === 'closed' ? 'Closed' : 'Open'}
          </span>
         
        </div>
        <h4 className="text-2xl font-bold mb-2">{prData.title}</h4>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock size={16} />
            {new Date(prData.created_at).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare size={16} />
            {comments.length} comments
          </div>
          <div className="flex items-center gap-1">
            <FileCode size={16} />
            {files.length} files changed
          </div>
        </div>
      </div>

      {/* PR Description */}
      {/* <div className="mb-6 prose dark:prose-invert max-w-none">
        <ReactMarkdown>{prData.body}</ReactMarkdown>
      </div> */}

      {/* Changed Files */}
      <div className="mb-6">
        <h4 className="text-xl font-semibold mb-4">Changed Files</h4>
        <div className="space-y-0.5">
          {files.map((file) => (
            <a
              key={file.filename}
              href={`https://github.com/${params?.owner}/${params?.repo}/pull/${params?.number}/files#diff-${btoa(file.filename)}`}
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer text-sm"
            >
              <div className="flex items-center gap-2">
                <FileCode size={16} className="text-gray-500" />
                <span className="font-mono">{file.filename}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                {file.additions > 0 && (
                  <span className="text-green-600">+{file.additions}</span>
                )}
                {file.deletions > 0 && (
                  <span className="text-red-600">-{file.deletions}</span>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="mb-6">
        <button
          onClick={() => setShowReviews(!showReviews)}
          className="flex items-center gap-2 text-xl font-semibold mb-4 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <h4>Reviews</h4>
          <span className="text-sm">({reviews.length})</span>
        </button>
        {showReviews && (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={review.user.avatar_url}
                    alt={review.user.login}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="font-medium">{review.user.login}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    review.state === 'APPROVED' 
                      ? 'bg-green-100 text-green-700'
                      : review.state === 'CHANGES_REQUESTED'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {review.state}
                  </span>
                  <span className="text-sm text-gray-500">
                    reviewed on {new Date(review.submitted_at).toLocaleDateString()}
                  </span>
                </div>
                {review.body && (
                  <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown>{review.body}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      <div>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-xl font-semibold mb-4 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <h4>Comments</h4>
          <span className="text-sm">({comments.length})</span>
        </button>
        {showComments && (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="border dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={comment.user.avatar_url}
                    alt={comment.user.login}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="font-medium">{comment.user.login}</span>
                  <span className="text-sm text-gray-500">
                    commented on {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  {comment.body}
                </div>
                
              </div>
            ))}
          </div>
        )}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4 mt-6">
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={handleSummary}
              disabled={summaryLoading}
            >
              {summaryLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </div>
              ) : (
                'Summary'
              )}
            </button>
            {/* <button className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors" disabled>
              Ask AI
            </button> */}
          </div>
        </div>
        {summary && (
          <div className="relative">
            <button
              onClick={() => setSummary('')}
              className="absolute top-0 right-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Clear summary"
            >
              <Trash2 size={20} className="text-gray-500" />
            </button>
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

