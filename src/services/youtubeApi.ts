const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY || "";
const BASE_URL = "https://www.googleapis.com/youtube/v3";

export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  channelId: string;
  thumbnailUrl: string;
  publishedAt: string;
  description: string;
}

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
  nextPageToken?: string;
}

export interface SearchResult {
  items: YouTubeVideo[];
  nextPageToken: string | null;
}

export const searchVideos = async (
  query: string = "programming",
  maxResults: number = 20,
  pageToken: string | null = null
): Promise<SearchResult> => {
  try {
    let url = `${BASE_URL}/search?part=snippet&type=video&maxResults=${maxResults}&q=${encodeURIComponent(
      query
    )}&key=${API_KEY}`;

    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data: YouTubeSearchResponse = await response.json();

    const items = data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      thumbnailUrl:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.medium?.url,
      publishedAt: item.snippet.publishedAt,
      description: item.snippet.description,
    }));

    return {
      items,
      nextPageToken: data.nextPageToken || null,
    };
  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
    throw error;
  }
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

