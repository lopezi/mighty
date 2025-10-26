/**
 * VideoCard Component
 * 
 * A YouTube-style video card with hover preview functionality.
 * Features:
 * - Displays video thumbnail, title, channel info, and metadata
 * - Hover effect that shows an enlarged popup after 1.8 seconds
 * - Smooth animations using React portals for proper z-index handling
 * - Action buttons (Watch Later, Add to Queue) in hover popup
 * - Responsive design compatible with React Native Web
 */

import * as React from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import ReactDOM from "react-dom";

/**
 * Props for the VideoCard component
 */
interface VideoCardProps {
  thumbnailUrl: string;        // URL of the video thumbnail image
  duration?: string;            // Video duration (e.g., "4:27")
  title: string;                // Video title
  channelName: string;          // Channel/creator name
  channelAvatarUrl?: string;    // Channel avatar image URL
  isVerified?: boolean;         // Whether channel is verified
  views?: string;               // View count (e.g., "1.6M views")
  uploadTime: string;           // Upload date/time
  onPress?: () => void;         // Callback when card is clicked
  onMenuPress?: () => void;     // Callback when menu button is clicked
  cardIndex?: number;           // Index for z-index stacking
}

const VideoCard: React.FC<VideoCardProps> = ({
  thumbnailUrl,
  duration,
  title,
  channelName,
  channelAvatarUrl,
  isVerified = false,
  views,
  uploadTime,
  onPress,
  onMenuPress,
  cardIndex = 0,
}) => {
  // State management for hover effects and popup
  const [isHovered, setIsHovered] = React.useState(false);           // True when mouse is over card
  const [showPopup, setShowPopup] = React.useState(false);           // True when popup should be rendered
  const [popupVisible, setPopupVisible] = React.useState(false);     // True when popup animation should play
  
  // Refs for DOM manipulation and timers
  const wrapperRef = React.useRef<any>(null);                        // Reference to card wrapper for positioning
  const hoverTimeoutRef = React.useRef<any>(null);                   // Timeout for delayed popup appearance
  const animationTimeoutRef = React.useRef<any>(null);               // Timeout for animation timing
  
  // Popup position calculated from card's DOM position
  const [popupRect, setPopupRect] = React.useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  /**
   * Handle mouse entering the card
   * Starts a 1.8 second timer before showing the popup
   */
  const handleHoverIn = () => {
    console.log('Hover in triggered');
    setIsHovered(true);
    
    // Clear any existing timeout to prevent multiple timers
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Show popup after 1800ms (1.8 seconds) of continuous hovering
    hoverTimeoutRef.current = setTimeout(() => {
      console.log('Timeout completed, showing popup');
      try {
        // Measure the card's position in the viewport
        // React Native Web forwards refs to actual DOM elements
        const rect = (wrapperRef.current as any)?.getBoundingClientRect?.();
        console.log('Card rect:', rect);
        if (rect) {
          // Calculate popup position with 20px padding on all sides
          setPopupRect({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
          });
          setShowPopup(true);
          
          // Trigger fade-in animation after a single frame (10ms)
          // This ensures the portal is mounted before animation starts
          animationTimeoutRef.current = setTimeout(() => {
            setPopupVisible(true);
          }, 10);
        }
      } catch (e) {
        console.error('Error measuring card:', e);
      }
    }, 1800);
  };

  /**
   * Handle mouse leaving the card
   * Only closes if popup hasn't appeared yet
   */
  const handleHoverOut = (e?: any) => {
    console.log('Hover out triggered', e);
    
    // Don't close if popup is already showing
    // User needs to move mouse away from popup itself to close
    if (showPopup) {
      console.log('Popup is showing, ignoring hover out');
      return;
    }
    
    // Clear the timeout if user leaves before popup shows
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Reset all hover states
    setIsHovered(false);
    setShowPopup(false);
    setPopupRect(null);
  };

  /**
   * Handle mouse leaving the popup portal
   * Triggers fade-out animation and cleanup
   */
  const handlePortalLeave = () => {
    console.log('Portal leave triggered');
    
    // Clear all timers
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    // Reset hover state and start fade-out animation
    setIsHovered(false);
    setPopupVisible(false);
    
    // Wait for fade-out animation (200ms) before removing popup from DOM
    setTimeout(() => {
      setShowPopup(false);
      setPopupRect(null);
    }, 200);
  };

  /**
   * Cleanup effect - clear all timers when component unmounts
   */
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return (
    // Wrapper View with mouse event handlers for hover detection
    <View 
      ref={wrapperRef} 
      style={[styles.wrapper, isHovered && styles.wrapperHovered]}
      // @ts-ignore - web-only events (React Native Web supports these)
      onMouseEnter={handleHoverIn}
      onMouseLeave={handleHoverOut}
    >
      {/* Main card content - clickable */}
      <Pressable
        onPress={onPress}
        style={styles.pressableContainer}
      >
        {/* Card container - fades when popup appears */}
        <View style={[styles.container, showPopup && styles.containerHovered]}>
        
        {/* Thumbnail section */}
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail as any}
            resizeMode="cover"
          />
          
          {/* Duration badge - shown when not hovering */}
          {duration && !isHovered && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{duration}</Text>
            </View>
          )}
          
          {/* "Keep hovering to play" badge - shown during hover delay */}
          {isHovered && !showPopup && (
            <View style={styles.hoverBadge}>
              <Text style={styles.hoverBadgeText}>Keep hovering to play</Text>
            </View>
          )}
        </View>

        <View style={styles.detailsContainer}>
          {channelAvatarUrl ? (
            <Image
              source={{ uri: channelAvatarUrl }}
              style={styles.channelAvatar as any}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.channelAvatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {channelName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.metaContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>

            <View style={styles.channelInfo}>
              <Text style={styles.channelName} numberOfLines={1}>
                {channelName}
              </Text>
              {isVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedIcon}>✓</Text>
                </View>
              )}
            </View>

            <View style={styles.videoInfo}>
              {views && (
                <>
                  <Text style={styles.infoText}>{views}</Text>
                  <Text style={styles.separator}>•</Text>
                </>
              )}
              <Text style={styles.infoText}>{uploadTime}</Text>
            </View>
          </View>

          <Pressable
            style={styles.menuButton}
            onPress={(e) => {
              e.stopPropagation();
              onMenuPress?.();
            }}
          >
            <Text style={styles.menuIcon}>⋮</Text>
          </Pressable>
        </View>
      </View>

      {showPopup && popupRect && ReactDOM.createPortal(
        (
          <View
            // fixed-position portal overlay
            style={[
              styles.hoverPortal,
              {
                top: popupRect.top - 20,
                left: popupRect.left - 20,
                width: popupRect.width + 40,
                opacity: popupVisible ? 1 : 0,
                transform: [{ scale: popupVisible ? 1.08 : 0.95 }],
              } as any,
            ]}
            // keep hover active when moving within portal
            // @ts-ignore web-only events
            onMouseEnter={() => {
              console.log('Portal mouse enter');
              setIsHovered(true);
              setShowPopup(true);
              setPopupVisible(true);
            }}
            onMouseLeave={handlePortalLeave}
          >
            <View style={styles.popupThumbnailContainer}>
              <Image
                source={{ uri: thumbnailUrl }}
                style={styles.popupThumbnail as any}
                resizeMode="cover"
              />
              {duration && (
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{duration}</Text>
                </View>
              )}
            </View>

            <View style={styles.popupDetails}>
              <Text style={styles.popupTitle} numberOfLines={2}>
                {title}
              </Text>

              <View style={styles.popupChannelInfo}>
                <Text style={styles.popupChannelName}>{channelName}</Text>
                {isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedIcon}>✓</Text>
                  </View>
                )}
              </View>

              <View style={styles.popupVideoInfo}>
                {views && (
                  <>
                    <Text style={styles.popupInfoText}>{views}</Text>
                    <Text style={styles.separator}>•</Text>
                  </>
                )}
                <Text style={styles.popupInfoText}>{uploadTime}</Text>
              </View>

              <View style={styles.popupActions}>
                <Pressable 
                  style={({ hovered }: any) => [
                    styles.actionButton,
                    hovered && styles.actionButtonHovered
                  ]}
                >
                  <View style={styles.actionIcon}>
                    <div dangerouslySetInnerHTML={{
                      __html: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style="pointer-events: none; display: block; width: 100%; height: 100%;"><path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1Zm0 2a9 9 0 110 18.001A9 9 0 0112 3Zm0 3a1 1 0 00-1 1v5.565l.485.292 3.33 2a1 1 0 001.03-1.714L13 11.435V7a1 1 0 00-1-1Z"></path></svg>'
                    }} />
                  </View>
                  <Text style={styles.actionText}>Watch later</Text>
                </Pressable>
                <Pressable 
                  style={({ hovered }: any) => [
                    styles.actionButton,
                    hovered && styles.actionButtonHovered
                  ]}
                >
                  <View style={styles.actionIcon}>
                    <div dangerouslySetInnerHTML={{
                      __html: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style="pointer-events: none; display: block; width: 100%; height: 100%;"><path d="M16 15.395a.5.5 0 01.762-.426L22.5 18.5l-5.738 3.531a.5.5 0 01-.762-.425v-6.212ZM14 19H4a1 1 0 110-2h10v2Zm6-8a1 1 0 110 2H4a1 1 0 110-2h16Zm0-6a1 1 0 110 2H4a1 1 0 010-2h16Z"></path></svg>'
                    }} />
                  </View>
                  <Text style={styles.actionText}>Add to queue</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ),
        document.body
      )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    height: "100%",
  },
  wrapperHovered: {
    // z-index is now handled dynamically in the component
  },
  pressableContainer: {
    width: "100%",
    height: "100%",
  },
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    // @ts-ignore - web-only property
    transition: "opacity 0.15s ease-out",
  },
  containerHovered: {
    // Keep original card visible to prevent hover flickering
    opacity: 0.3,
    // @ts-ignore - web-only property
    pointerEvents: "none",
  },
  hoverPortal: {
    // @ts-ignore - "fixed" supported on web
    position: "fixed",
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 1000,
    zIndex: 2147483647,
    overflow: "hidden",
    // @ts-ignore - web-only property
    cursor: "pointer",
    // @ts-ignore - web-only property
    pointerEvents: "auto",
    // @ts-ignore - web-only property
    transition: "opacity 0.15s cubic-bezier(0.05, 0, 0, 1), transform 0.15s cubic-bezier(0.05, 0, 0, 1)",
    // @ts-ignore - web-only property
    willChange: "opacity, transform",
  },
  thumbnailContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    overflow: "hidden",
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  hoverBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  hoverBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  detailsContainer: {
    flexDirection: "row",
    padding: 12,
    flex: 1,
  },
  channelAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e0e0e0",
    marginRight: 12,
  },
  channelAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#606060",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  metaContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f0f0f",
    lineHeight: 20,
    marginBottom: 6,
    minHeight: 40,
  },
  channelInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  channelName: {
    fontSize: 12,
    color: "#606060",
    marginRight: 4,
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#606060",
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedIcon: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  videoInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 12,
    color: "#606060",
  },
  separator: {
    fontSize: 12,
    color: "#606060",
    marginHorizontal: 4,
  },
  menuButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  menuIcon: {
    fontSize: 20,
    color: "#606060",
    fontWeight: "bold",
  },
  hoverPopup: {
    position: "absolute",
    top: -20,
    left: -20,
    right: -20,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 100,
    zIndex: 100,
    overflow: "hidden",
    transform: [{ scale: 1.15 }],
  },
  popupThumbnailContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    position: "relative",
  },
  popupThumbnail: {
    width: "100%",
    height: "100%",
  },
  popupDetails: {
    padding: 16,
  },
  popupTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f0f0f",
    lineHeight: 22,
    marginBottom: 8,
  },
  popupChannelInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  popupChannelName: {
    fontSize: 13,
    color: "#606060",
    marginRight: 6,
    fontWeight: "500",
  },
  popupVideoInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  popupInfoText: {
    fontSize: 13,
    color: "#606060",
  },
  popupActions: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: "#f2f2f2",
    // @ts-ignore - web-only property
    transition: "background-color 0.15s ease",
  },
  actionButtonHovered: {
    backgroundColor: "#e5e5e5",
  },
  actionIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  actionText: {
    fontSize: 14,
    color: "#0f0f0f",
    fontWeight: "500",
  },
});

export default VideoCard;

