// services/eventsService.ts
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  type Unsubscribe,
  type Timestamp,
} from 'firebase/firestore';

import { firestore } from '@/lib/firebase';
import { AppUser } from '@/context/AuthContext';


export type EventDoc = {
  id: string;
  partnerId: string;

  title: string;
  description?: string;
  category?: string;

  date?: string;        // "2025-12-31"
  startTime?: string;   // "18:00"
  endTime?: string;     // "21:00"

  isFree: boolean;
  price?: number;       // en euros
  currency?: string;    // ex: "EUR"
  capacity?: number;    // nb max de personnes

  // Lieu (pré-rempli avec l'adresse du partenaire, mais modifiable pour chaque event)
  venueName: string;
  venueAddress: string;
  venueCity: string;
  venueZip: string;

  // on garde imageUrl optionnel pour plus tard, mais on ne l'utilise pas pour l'instant
  imageUrl?: string;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

const EVENTS_COLLECTION = 'events';

type CreateEventParams = {
  title: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  category?: string;
  capacity?: number;
  price?: number;
  currency?: string;
  isFree?: boolean;

  venueName?: string;
  venueAddress?: string;
  venueCity?: string;
  venueZip?: string;
};

/**
 * Crée un événement pour un partenaire en reprenant par défaut
 * l'adresse de son profil, tout en permettant d'overridder le lieu.
 */
export const createEventForPartner = async (
  partner: AppUser,
  params: CreateEventParams,
): Promise<string> => {
  if (partner.role !== 'partner') {
    throw new Error("L'utilisateur courant n'est pas un partenaire.");
  }

  const venueName = params.venueName ?? partner.venueName;
  const venueAddress = params.venueAddress ?? partner.venueAddress;
  const venueCity = params.venueCity ?? partner.venueCity;
  const venueZip = params.venueZip ?? partner.venueZip;

  if (!venueName || !venueAddress || !venueCity || !venueZip) {
    throw new Error(
      "L'adresse du partenaire est incomplète. Impossible de créer un événement.",
    );
  }

  const price = params.price ?? 0;
  const isFree = params.isFree ?? price <= 0;

  const refCol = collection(firestore, EVENTS_COLLECTION);

  const payload = {
    partnerId: partner.uid,
    title: params.title,
    description: params.description ?? '',
    category: params.category ?? null,
    date: params.date ?? null,
    startTime: params.startTime ?? null,
    endTime: params.endTime ?? null,
    capacity: typeof params.capacity === 'number' ? params.capacity : null,
    price,
    currency: params.currency ?? 'EUR',
    isFree,

    venueName,
    venueAddress,
    venueCity,
    venueZip,

    imageUrl: null, // on n'utilise pas encore les visuels

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(refCol, payload);
  return docRef.id;
};

/**
 * Abonnement temps réel aux événements d'un partenaire.
 */
export const subscribeToPartnerEvents = (
  partnerId: string,
  onEvents: (events: EventDoc[]) => void,
): Unsubscribe => {
  const colRef = collection(firestore, EVENTS_COLLECTION);
  const q = query(colRef, where('partnerId', '==', partnerId));

  return onSnapshot(q, (snapshot) => {
    const items: EventDoc[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as any;

      return {
        id: docSnap.id,
        partnerId: data.partnerId,
        title: data.title,
        description: data.description ?? '',
        category: data.category ?? undefined,
        date: data.date ?? undefined,
        startTime: data.startTime ?? undefined,
        endTime: data.endTime ?? undefined,
        capacity:
          typeof data.capacity === 'number' ? data.capacity : undefined,
        price: typeof data.price === 'number' ? data.price : undefined,
        currency: data.currency ?? 'EUR',
        isFree:
          data.isFree ??
          (typeof data.price === 'number' ? data.price <= 0 : true),

        venueName: data.venueName,
        venueAddress: data.venueAddress,
        venueCity: data.venueCity,
        venueZip: data.venueZip,

        imageUrl: data.imageUrl ?? undefined,

        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });

    onEvents(items);
  });
};
