/**
 * Home Screen Component
 * 
 * Main screen displaying a grid of YouTube videos with search and infinite scroll.
 * Features:
 * - Search bar for querying videos
 * - Responsive grid layout (1-4 columns based on screen width)
 * - Infinite scrolling with pagination
 * - Loading states and error handling
 * - YouTube Data API v3 integration
 */

import * as React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import VideoCard from "../components/VideoCard";
import { searchVideos, formatDate, YouTubeVideo } from "../services/youtubeApi";

/**
 * Calculate number of columns based on screen width
 * Responsive breakpoints:
 * - 1200px+: 4 columns (desktop)
 * - 900px+: 3 columns (tablet landscape)
 * - 600px+: 2 columns (tablet portrait)
 * - <600px: 1 column (mobile)
 */
const getColumnCount = (width: number) => {
  if (width >= 1200) return 4;
  if (width >= 900) return 3;
  if (width >= 600) return 2;
  return 1;
};

const Home = () => {
  // State management
  const [videos, setVideos] = React.useState<YouTubeVideo[]>([]);              // List of videos
  const [loading, setLoading] = React.useState(true);                          // Initial loading state
  const [loadingMore, setLoadingMore] = React.useState(false);                 // Loading more videos state
  const [error, setError] = React.useState<string | null>(null);               // Error message
  const [searchQuery, setSearchQuery] = React.useState("programming");         // Current search query
  const [pageToken, setPageToken] = React.useState<string | null>(null);       // Pagination token from YouTube API
  const [windowWidth, setWindowWidth] = React.useState(Dimensions.get("window").width); // Current window width
  const scrollViewRef = React.useRef<any>(null);                               // Reference to ScrollView for scroll detection

  /**
   * Listen for window resize events to update grid layout
   */
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  /**
   * Fetch videos from YouTube API
   * @param query - Search query string
   * @param isLoadMore - If true, appends to existing videos; if false, replaces them
   */
  const fetchVideos = async (query: string, isLoadMore: boolean = false) => {
    try {
      // Set appropriate loading state
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPageToken(null); // Reset pagination for new search
      }
      setError(null);
      
      // Call YouTube API with pagination token if loading more
      const results = await searchVideos(query, 20, isLoadMore ? pageToken : null);
      
      // Update videos list
      if (isLoadMore) {
        setVideos((prev) => [...prev, ...results.items]); // Append to existing
      } else {
        setVideos(results.items); // Replace with new results
      }
      
      // Save pagination token for next page
      setPageToken(results.nextPageToken);
    } catch (err) {
      setError("Failed to load videos. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  /**
   * Load initial videos on component mount
   */
  React.useEffect(() => {
    fetchVideos(searchQuery);
  }, []);

  /**
   * Handle search button click
   * Validates query and triggers new search
   */
  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchVideos(searchQuery);
    }
  };

  /**
   * Handle video card click
   * @param videoId - YouTube video ID
   */
  const handleVideoPress = (videoId: string) => {
    console.log("Video pressed:", videoId);
    // TODO: Navigate to video player or open YouTube
  };

  /**
   * Handle menu button click on video card
   * @param videoId - YouTube video ID
   */
  const handleMenuPress = (videoId: string) => {
    console.log("Menu pressed for video:", videoId);
    // TODO: Show context menu with options
  };

  /**
   * Handle scroll events for infinite scrolling
   * Loads more videos when user scrolls near the bottom
   */
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20; // Trigger load 20px before reaching bottom
    
    // Check if user has scrolled close to bottom
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    // Load more videos if:
    // - Near bottom
    // - Not already loading
    // - More pages available (pageToken exists)
    if (isCloseToBottom && !loadingMore && !loading && pageToken) {
      fetchVideos(searchQuery, true);
    }
  };

  // Loading state - show spinner
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff0000" />
        <Text style={styles.loadingText}>Loading videos...</Text>
      </View>
    );
  }

  // Error state - show error message with retry button
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchVideos(searchQuery)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search videos..."
          placeholderTextColor="#999"
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        <View style={styles.content}>
          <Text style={styles.resultsText}>
            {videos.length} videos found for "{searchQuery}"
          </Text>
          <View style={styles.gridContainer}>
            {videos.map((video, index) => {
              const columnCount = getColumnCount(windowWidth);
              const itemWidth = `${100 / columnCount}%` as any;
              return (
                <View 
                  key={video.id} 
                  style={[
                    styles.gridItem, 
                    { 
                      width: itemWidth,
                      zIndex: index,
                    }
                  ]}
                >
                  <VideoCard
                    thumbnailUrl={video.thumbnailUrl}
                    title={video.title}
                    channelName={video.channelTitle}
                    uploadTime={formatDate(video.publishedAt)}
                    onPress={() => handleVideoPress(video.id)}
                    onMenuPress={() => handleMenuPress(video.id)}
                    cardIndex={index}
                  />
                </View>
              );
            })}
          </View>
          {loadingMore && (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color="#ff0000" />
              <Text style={styles.loadingMoreText}>Loading more videos...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#606060",
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#ff0000",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: "#f5f5f5",
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: "#ff0000",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    maxWidth: 1600,
    alignSelf: "center",
    width: "100%",
  },
  resultsText: {
    fontSize: 14,
    color: "#606060",
    marginBottom: 16,
    fontWeight: "500",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  gridItem: {
    width: "100%",
    paddingHorizontal: 8,
    marginBottom: 24,
    minHeight: 320,
    position: "relative",
  },
  loadingMoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingMoreText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#606060",
  },
});

export default Home;
