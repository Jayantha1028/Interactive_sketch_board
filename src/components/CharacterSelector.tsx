import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { PhonicsItem, LearningCategory } from '../types';
import { soundEffects } from '../services/soundEffects';

interface CharacterSelectorProps {
  items: PhonicsItem[];
  selectedItem: PhonicsItem;
  onSelectItem: (item: PhonicsItem) => void;
  activeCategory: LearningCategory;
  onSelectCategory: (cat: LearningCategory) => void;
  completedIds: Set<string>;
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  items,
  selectedItem,
  onSelectItem,
  activeCategory,
  onSelectCategory,
  completedIds,
}) => {
  const categories: { key: LearningCategory; label: string; icon: string }[] = [
    { key: 'uppercase', label: 'ABC Letters', icon: '🔤' },
    { key: 'numbers', label: '123 Numbers', icon: '🔢' },
    { key: 'doodles', label: 'Doodles', icon: '🎨' },
  ];

  const filteredItems = items.filter((item) => item.category === activeCategory);

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <View style={styles.tabBar}>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => {
                soundEffects.playPop();
                onSelectCategory(cat.key);
                const firstOfCategory = items.find((i) => i.category === cat.key);
                if (firstOfCategory) {
                  onSelectItem(firstOfCategory);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.tabIcon}>{cat.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Horizontal Carousel of Characters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
        style={styles.carousel}
      >
        {filteredItems.map((item) => {
          const isSelected = selectedItem.id === item.id;
          const isDone = completedIds.has(item.id);

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemPill,
                isSelected && {
                  borderColor: item.accentColor,
                  borderWidth: 3,
                  backgroundColor: '#EFF6FF',
                  transform: [{ scale: 1.08 }],
                },
              ]}
              onPress={() => {
                soundEffects.playPop();
                onSelectItem(item);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.characterText, { color: item.accentColor }]}>
                {item.character}
              </Text>
              <Text style={styles.itemEmoji}>{item.emoji}</Text>
              {isDone && <Text style={styles.doneBadge}>⭐</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabButtonActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  tabIcon: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  carousel: {
    paddingVertical: 4,
  },
  carouselContent: {
    paddingHorizontal: 12,
    gap: 10,
    alignItems: 'center',
  },
  itemPill: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 62,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    position: 'relative',
  },
  characterText: {
    fontSize: 26,
    fontWeight: '900',
  },
  itemEmoji: {
    fontSize: 18,
    marginTop: 2,
  },
  doneBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    fontSize: 14,
  },
});
