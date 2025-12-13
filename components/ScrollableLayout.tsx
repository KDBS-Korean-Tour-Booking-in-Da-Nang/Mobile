import React, { useState, useRef } from "react";
import { ScrollView } from "react-native";
import MainLayout from "./MainLayout";

interface ScrollableLayoutProps {
  children: React.ReactNode;
}

const ScrollableLayout: React.FC<ScrollableLayoutProps> = ({ children }) => {
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 50;

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);

    if (scrollDifference > scrollThreshold) {
      if (currentScrollY > lastScrollY.current) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    }
  };

  return (
    <MainLayout isNavVisible={isNavVisible}>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        style={{ flex: 1 }}
      >
        {children}
      </ScrollView>
    </MainLayout>
  );
};

export default ScrollableLayout;
