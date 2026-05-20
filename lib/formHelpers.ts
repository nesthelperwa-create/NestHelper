import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, firebaseIsConfigured } from "./firebase";

export async function saveForm(collectionName: string, data: Record<string, unknown>) {
  if (!firebaseIsConfigured || !db) {
    console.warn("Firebase is not configured yet. Form payload:", { collectionName, data });
    return { ok: true, offline: true };
  }
  await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    status: "new",
    source: "nesthelper-nextjs-website"
  });
  return { ok: true, offline: false };
}
