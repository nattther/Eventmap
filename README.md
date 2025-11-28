# Eventmap 📍

Eventmap est une application mobile (Expo / React Native) permettant de :

- voir les événements autour de soi sur une carte et une liste,
- filtrer les événements par nom et lieu (ville, quartier, adresse),
- afficher la distance entre l’utilisateur et chaque événement,
- permettre aux partenaires (organisateurs) de créer et gérer leurs événements.

---

## Comment lancer le projet avec Expo

L’app est prête : aucune configuration d’API n’est nécessaire pour tester en local.

1️⃣ Cloner le projet  
git clone https://github.com/nattther/Eventmap.git  
cd Eventmap

2️⃣ Installer les dépendances  
npm install  
# ou  
yarn install

3️⃣ Lancer Expo  
npm run start  
# ou  
npx expo start

4️⃣ Ouvrir l’application  
- Scanner le QR Code avec Expo Go (Android / iOS)  
- ou taper `a` pour ouvrir un émulateur Android  
- ou taper `i` pour ouvrir un simulateur iOS

---

## Stack technique

- Expo / React Native  
- TypeScript  
- Firebase (Auth + Firestore)  
- React Native Maps  
- Géolocalisation + calculs de distance (Haversine)
