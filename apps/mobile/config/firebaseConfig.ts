

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, initializeAuth , createUserWithEmailAndPassword} from 'firebase/auth';
// import { getAuth } from "firebase/auth";
// @ts-ignore: getReactNativePersistence is missing from web typings but exists in the RN bundle
import { getReactNativePersistence } from 'firebase/auth';

// TODO: Replace the following with your app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhOXj7gP12rKfpnjHnHXAwfknvpKeFNJ4",
  authDomain: "futo-ride.firebaseapp.com",
  projectId: "futo-ride",
  storageBucket: "futo-ride.firebasestorage.app",
  messagingSenderId: "762997027843",
  appId: "1:762997027843:web:eb02e45c410b88a9a64a36",
  measurementId: "G-48PEHPHMDX"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { auth, db };

// async function getCities(db: Firestore) {
//   const citiesCol = collection(db, 'cities');
//   const citySnapshot = await getDocs(citiesCol);
//   const cityList = citySnapshot.docs.map(doc => doc.data());
//   return cityList;
// }






// const firebaseConfig = {
//   apiKey: "AIzaSyDhOXj7gP12rKfpnjHnHXAwfknvpKeFNJ4",
//   authDomain: "futo-ride.firebaseapp.com",
//   projectId: "futo-ride",
//   storageBucket: "futo-ride.firebasestorage.app",
//   messagingSenderId: "762997027843",
//   appId: "1:762997027843:web:eb02e45c410b88a9a64a36",
//   measurementId: "G-48PEHPHMDX"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);