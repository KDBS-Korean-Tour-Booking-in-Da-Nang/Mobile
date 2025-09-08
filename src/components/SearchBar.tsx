import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Text,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { searchPosts } from "../endpoints/forum";

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  onHashtagFilter: (hashtags: string[]) => void;
  placeholder?: string;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: "keyword" | "hashtag";
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onHashtagFilter,
  placeholder = "Tìm kiếm bài viết...",
}) => {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);

  // Note: Suggestions are derived live from backend search results

  useEffect(() => {
    if (searchText.length > 0) {
      generateSuggestions(searchText);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchText]);

  const generateSuggestions = async (text: string) => {
    setIsLoading(true);
    try {
      const posts = await searchPosts({
        keyword: text,
        page: 0,
        size: 5,
        sort: "createdAt,desc",
      });
      const titles = Array.from(
        new Set(
          (posts || [])
            .map((p) => (p?.title || "").trim())
            .filter((t) => t.length > 0)
        )
      ).slice(0, 5);

      const hashtags = Array.from(
        new Set(
          (posts || [])
            .flatMap((p) => p?.hashtags || [])
            .map((h) => (h || "").trim())
            .filter((h) => h.length > 0)
        )
      )
        .map((h) => `#${h}`)
        .slice(0, 5);

      const keywordSuggestions: SearchSuggestion[] = titles.map((keyword) => ({
        id: `kw-${keyword}`,
        text: keyword,
        type: "keyword",
      }));
      const hashtagSuggestions: SearchSuggestion[] = hashtags.map(
        (hashtag) => ({
          id: `ht-${hashtag}`,
          text: hashtag,
          type: "hashtag",
        })
      );

      // Always include a direct search option at top
      const directOption: SearchSuggestion = {
        id: `direct-${text}`,
        text: text,
        type: "keyword",
      };

      const combined = [
        directOption,
        ...keywordSuggestions,
        ...hashtagSuggestions,
      ];
      setSuggestions(combined);
      setShowSuggestions(true);
    } catch (e) {
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchText.trim()) {
      onSearch(searchText.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    if (suggestion.type === "hashtag") {
      const hashtag = suggestion.text.replace("#", "");
      if (!selectedHashtags.includes(hashtag)) {
        const newHashtags = [...selectedHashtags, hashtag];
        setSelectedHashtags(newHashtags);
        onHashtagFilter(newHashtags);
      }
    } else {
      setSearchText(suggestion.text);
      onSearch(suggestion.text);
    }
    setShowSuggestions(false);
  };

  const removeHashtag = (hashtag: string) => {
    const newHashtags = selectedHashtags.filter((h) => h !== hashtag);
    setSelectedHashtags(newHashtags);
    onHashtagFilter(newHashtags);
  };

  const clearSearch = () => {
    setSearchText("");
    setSelectedHashtags([]);
    onSearch("");
    onHashtagFilter([]);
    setShowSuggestions(false);
  };

  const renderSuggestion = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <Ionicons
        name={item.type === "hashtag" ? "pricetag" : "search"}
        size={16}
        color="#666"
        style={styles.suggestionIcon}
      />
      <Text style={styles.suggestionText}>{item.text}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.inputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder || t("forum.searchPlaceholder")}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={!searchText.trim()}
        >
          <Ionicons
            name="search"
            size={20}
            color={searchText.trim() ? "#007AFF" : "#ccc"}
          />
        </TouchableOpacity>
      </View>

      {/* Selected Hashtags */}
      {selectedHashtags.length > 0 && (
        <View style={styles.hashtagsContainer}>
          <Text style={styles.hashtagsTitle}>{t("forum.filtersTitle")}</Text>
          <View style={styles.hashtagsList}>
            {selectedHashtags.map((hashtag, index) => (
              <TouchableOpacity
                key={index}
                style={styles.selectedHashtag}
                onPress={() => removeHashtag(hashtag)}
              >
                <Text style={styles.selectedHashtagText}>#{hashtag}</Text>
                <Ionicons name="close" size={16} color="#007AFF" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>{t("forum.searching")}</Text>
            </View>
          ) : suggestions.length > 0 ? (
            <FlatList
              data={suggestions}
              renderItem={renderSuggestion}
              keyExtractor={(item) => item.id}
              style={styles.suggestionsList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.noSuggestionsContainer}>
              <Text style={styles.noSuggestionsText}>
                {t("forum.noSuggestions")}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 4,
  },
  clearButton: {
    marginLeft: 8,
  },
  searchButton: {
    marginLeft: 8,
    padding: 8,
  },
  hashtagsContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  hashtagsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  hashtagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  selectedHashtag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedHashtagText: {
    fontSize: 14,
    color: "#007AFF",
    marginRight: 4,
  },
  suggestionsContainer: {
    position: "absolute",
    top: "100%",
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: 200,
    zIndex: 1001,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  noSuggestionsContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  noSuggestionsText: {
    fontSize: 14,
    color: "#666",
  },
});

export default SearchBar;
