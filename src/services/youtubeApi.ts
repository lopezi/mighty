/**
 * YouTube Data API v3 Service
 * 
 * This service handles all interactions with the YouTube Data API,
 * including video search and data transformation.
 * 
 * API Key is loaded from environment variables for security.
 */

// YouTube API credentials and base URL
const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY || "";
const BASE_URL = "https://www.googleapis.com/youtube/v3";

/**
 * Simplified video data structure for our application
 */
export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  channelId: string;
  thumbnailUrl: string;
  publishedAt: string;
  description: string;
}

/**
 * Raw response structure from YouTube Data API v3 search endpoint
 * This matches the actual API response format
 */
export interface YouTubeSearchResponse {
  items: Array<{
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
      channelTitle: string;
      channelId: string;
      thumbnails: {
        high: {
          url: string;
        };
        medium: {
          url: string;
        };
      };
      publishedAt: string;
      description: string;
    };
  }>;
  nextPageToken?: string; // Token for pagination
}

/**
 * Search result with pagination support
 */
export interface SearchResult {
  items: YouTubeVideo[];
  nextPageToken: string | null; // Null when no more pages available
}

/**
 * Search for videos on YouTube using the Data API v3
 * 
 * @param query - Search query string (default: "programming")
 * @param maxResults - Number of results per page (default: 20)
 * @param pageToken - Token for pagination, null for first page
 * @returns Promise with video items and next page token
 * 
 * @example
 * // First page
 * const result = await searchVideos("react tutorial", 20);
 * 
 * // Next page
 * const nextPage = await searchVideos("react tutorial", 20, result.nextPageToken);
 */
export const searchVideos = async (
  query: string = "programming",
  maxResults: number = 20,
  pageToken: string | null = null
): Promise<SearchResult> => {
  try {
    // Build the API URL with search parameters
    let url = `${BASE_URL}/search?part=snippet&type=video&maxResults=${maxResults}&q=${encodeURIComponent(
      query
    )}&key=${API_KEY}`;

    // Add pagination token if provided (for loading more results)
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    // Make the API request
    const response = await fetch(url);

    // Check for API errors
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    // Parse the JSON response
    const data: YouTubeSearchResponse = await response.json();

    // Transform API response to our simplified format
    const items = data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      // Prefer high quality thumbnail, fallback to medium
      thumbnailUrl:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.medium?.url,
      publishedAt: item.snippet.publishedAt,
      description: item.snippet.description,
    }));

    return {
      items,
      nextPageToken: data.nextPageToken || null, // Null if no more pages
    };
  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
    throw error;
  }
};

/**
 * Format ISO date string to MM/DD/YYYY format
 * 
 * @param dateString - ISO 8601 date string from YouTube API
 * @returns Formatted date string (MM/DD/YYYY)
 * 
 * @example
 * formatDate("2023-10-26T12:00:00Z") // Returns "10/26/2023"
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

