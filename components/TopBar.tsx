// components/TopBar.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import type { ViewMode } from '@/app/(tabs)';

export type TopBarProps = {
  mode: ViewMode;
  onToggleView: () => void;
  containerStyle?: StyleProp<ViewStyle>;
};

export const TopBar: React.FC<TopBarProps> = ({ mode, onToggleView, containerStyle }) => (
  <View style={[styles.topBar, containerStyle]}>
    <TouchableOpacity style={styles.menuButton} activeOpacity={0.7}>
      <View style={styles.menuLine} />
      <View style={styles.menuLine} />
      <View style={styles.menuLine} />
    </TouchableOpacity>

    <TouchableOpacity style={styles.listButton} onPress={onToggleView} activeOpacity={0.8}>
      <Text style={styles.listButtonText}>
        {mode === 'map' ? 'Voir en liste' : 'Voir la carte'}
      </Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  menuLine: {
    width: 18,
    height: 2,
    backgroundColor: '#333333',
    marginVertical: 1.5,
    borderRadius: 1,
  },
  listButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#b3e5fc',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  listButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e88e5',
    textTransform: 'capitalize',
  },
});
