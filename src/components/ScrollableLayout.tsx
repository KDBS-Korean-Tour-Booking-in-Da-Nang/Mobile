import React, { useState, useRef } from "react";
import { ScrollView } from "react-native";
import MainLayout from "./MainLayout";

interface ScrollableLayoutProps {
  children: React.ReactNode;
}

const ScrollableLayout: React.FC<ScrollableLayoutProps> = ({ children }) => {
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [navPosition, setNavPosition] = useState<"bottom" | "top">("bottom");
  const lastScrollY = useRef(0);
  const scrollDistance = useRef(0);
  const scrollThreshold = 50;

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);

    if (scrollDifference > scrollThreshold) {
      if (currentScrollY > lastScrollY.current) {
        // Scrolling down
        scrollDistance.current += scrollDifference;
        if (scrollDistance.current > 300 && navPosition === "bottom") {
          // Move nav to top after scrolling down 300px
          setNavPosition("top");
          setIsNavVisible(true);
        } else if (scrollDistance.current > 100) {
          // Hide nav when scrolling down
          setIsNavVisible(false);
        }
      } else {
        // Scrolling up
        scrollDistance.current = Math.max(
          0,
          scrollDistance.current - scrollDifference
        );
        if (scrollDistance.current < 200 && navPosition === "top") {
          // Move nav back to bottom when scrolling up
          setNavPosition("bottom");
        }
        // Show nav when scrolling up
        setIsNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    }
  };

  return (
    <MainLayout isNavVisible={isNavVisible} navPosition={navPosition}>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </MainLayout>
  );
};

export default ScrollableLayout;
