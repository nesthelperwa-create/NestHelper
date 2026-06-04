import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function getPrivateKey() {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n");
}

function getStorageBucketName(projectId?: string) {
  return (
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    (projectId ? `${projectId}.appspot.com` : "")
  );
}

function getFirebaseAdminApp() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = getPrivateKey();
    const storageBucket = getStorageBucketName(projectId);

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Missing Firebase Admin env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
    }

    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      ...(storageBucket ? { storageBucket } : {}),
    });
  }

  return getApp();
}

export function getFirebaseAdminDb() {
  getFirebaseAdminApp();
  return getFirestore();
}

export function getFirebaseAdminStorageBucket() {
  const app = getFirebaseAdminApp();
  const configuredBucket = getStorageBucketName(process.env.FIREBASE_PROJECT_ID);
  return configuredBucket ? getStorage(app).bucket(configuredBucket) : getStorage(app).bucket();
}
