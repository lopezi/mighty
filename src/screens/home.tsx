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

const getColumnCount = (width: number) => {
  if (width >= 1200) return 4;
  if (width >= 900) return 3;
  if (width >= 600) return 2;
  return 1;
};

const Home = () => {
  const [videos, setVideos] = React.useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("programming");
  const [pageToken, setPageToken] = React.useState<string | null>(null);
  const [windowWidth, setWindowWidth] = React.useState(Dimensions.get("window").width);
  const scrollViewRef = React.useRef<any>(null);

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  const fetchVideos = async (query: string, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPageToken(null);
      }
      setError(null);
      const results = await searchVideos(query, 20, isLoadMore ? pageToken : null);
      
      if (isLoadMore) {
        setVideos((prev) => [...prev, ...results.items]);
      } else {
        setVideos(results.items);
      }
      setPageToken(results.nextPageToken);
    } catch (err) {
      setError("Failed to load videos. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  React.useEffect(() => {
    fetchVideos(searchQuery);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchVideos(searchQuery);
    }
  };

  const handleVideoPress = (videoId: string) => {
    console.log("Video pressed:", videoId);
  };

  const handleMenuPress = (videoId: string) => {
    console.log("Menu pressed for video:", videoId);
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    if (isCloseToBottom && !loadingMore && !loading && pageToken) {
      fetchVideos(searchQuery, true);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff0000" />
        <Text style={styles.loadingText}>Loading videos...</Text>
      </View>
    );
  }

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
