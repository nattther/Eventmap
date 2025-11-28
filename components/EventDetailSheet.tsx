// components/EventDetailSheet.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import type { Event } from '@/app/(tabs)';

type EventDetailSheetProps = {
  event: Event | null;
  onClose: () => void;
};

export const EventDetailSheet: React.FC<EventDetailSheetProps> = ({ event, onClose }) => (
  <View style={styles.sheetContainer}>
    <View style={styles.sheetHeader}>
      <View style={styles.sheetTopBarBackground}>
        <View style={styles.sheetTopBarForeground} />
      </View>
      <TouchableOpacity onPress={onClose} style={styles.sheetCloseButton}>
        <Text style={styles.sheetCloseText}>✕</Text>
      </TouchableOpacity>
    </View>

    <ScrollView contentContainerStyle={styles.sheetContent}>
      {event ? (
        <>
          {event.isFree && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Gratuit</Text>
            </View>
          )}

          <Text style={styles.detailTitle}>{event.title}</Text>

          <View style={styles.eventInfoRow}>
            <Text style={styles.eventInfoLabel}>Horaire</Text>
            <Text style={styles.eventInfoValue}>{event.time}</Text>
          </View>

          <View style={styles.eventInfoRow}>
            <Text style={styles.eventInfoLabel}>Distance</Text>
            <Text style={styles.eventInfoValue}>{event.distance}</Text>
          </View>

          {/* Photos placeholder */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imagesRow}
          >
            {[1, 2, 3].map((index) => (
              <View key={index} style={styles.imageCard}>
                <View style={styles.imagePlaceholderIcon}>
                  <Text style={styles.imagePlaceholderText}>🖼</Text>
                </View>
                <Text style={styles.imageCaption}>Photo {index}</Text>
              </View>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.eventDescription}>
            Ici tu pourras mettre la vraie description de l&apos;événement. Pour l&apos;instant
            c&apos;est juste un texte de démo.
          </Text>
        </>
      ) : (
        <View style={styles.emptyStateWrapper}>
          <Text style={styles.emptyStateTitle}>Aucun événement sélectionné</Text>
          <Text style={styles.emptyStateText}>
            Clique sur un événement sur la carte ou dans la liste pour voir les détails ici.
          </Text>
        </View>
      )}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  sheetHeader: {
    paddingTop: 10,
    paddingBottom: 4,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetTopBarBackground: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0f2ff',
    overflow: 'hidden',
    marginRight: 12,
  },
  sheetTopBarForeground: {
    width: '50%',
    height: '100%',
    backgroundColor: '#29b6f6',
  },
  sheetCloseButton: {
    padding: 4,
  },
  sheetCloseText: {
    fontSize: 18,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
  },

  // Badge
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#00e676',
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Infos event
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 12,
  },
  eventInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  eventInfoLabel: {
    fontSize: 14,
    color: '#777777',
  },
  eventInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },

  // Images
  imagesRow: {
    marginTop: 16,
    marginBottom: 16,
  },
  imageCard: {
    width: 90,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dddddd',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  imagePlaceholderIcon: {
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  imagePlaceholderText: {
    fontSize: 26,
  },
  imageCaption: {
    fontSize: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
    color: '#555555',
  },

  // Description
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 6,
  },
  eventDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#555555',
  },

  // Empty state
  emptyStateWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
  },
});
