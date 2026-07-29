import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getLimitedUseToken,
  getToken,
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  type AppCheck,
} from "firebase/app-check";
import { getAuth, inMemoryPersistence, setPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const rewardsAppName = "nesthelper-launch-rewards";
const rewardsApp = getApps().some((app) => app.name === rewardsAppName)
  ? getApp(rewardsAppName)
  : initializeApp(firebaseConfig, rewardsAppName);

export const rewardsFirebaseAuth = getAuth(rewardsApp);
let persistenceReady: Promise<void> | null = null;

type RewardsAppCheckGlobal = typeof globalThis & {
  __nestHelperRewardsAppCheck?: AppCheck;
};

export function prepareRewardsFirebaseAuth() {
  if (!persistenceReady) {
    persistenceReady = setPersistence(rewardsFirebaseAuth, inMemoryPersistence).catch((error) => {
      persistenceReady = null;
      throw error;
    });
  }
  return persistenceReady;
}

export function prepareRewardsAppCheck() {
  if (typeof window === "undefined") {
    throw new Error("The rewards security check is available only in the browser.");
  }

  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY?.trim();
  if (!siteKey) {
    throw new Error("Launch Rewards security is not configured yet. Add the Firebase App Check site key before launch.");
  }

  const appCheckGlobal = globalThis as RewardsAppCheckGlobal;
  if (!appCheckGlobal.__nestHelperRewardsAppCheck) {
    appCheckGlobal.__nestHelperRewardsAppCheck = initializeAppCheck(rewardsApp, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }

  return appCheckGlobal.__nestHelperRewardsAppCheck;
}

export async function getRewardsAppCheckHeader(options?: { limitedUse?: boolean }) {
  const appCheck = prepareRewardsAppCheck();
  const tokenResult = options?.limitedUse
    ? await getLimitedUseToken(appCheck)
    : await getToken(appCheck, false);

  return { "X-Firebase-AppCheck": tokenResult.token };
}
