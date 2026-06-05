import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";
import { isAllowedAdminEmail } from "@/lib/adminAuth";

export const runtime = "nodejs";

type Body = {
  originAddress?: string;
  destinationAddress?: string;
};

function cleanText(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function parseGoogleDurationMinutes(value: unknown) {
  const raw = cleanText(value, 40);
  const match = raw.match(/^(\d+(?:\.\d+)?)s$/);
  if (!match) return 0;
  return Number(match[1]) / 60;
}

function normalizeAddressForRoutes(value: string) {
  const trimmed = cleanText(value, 500).replace(/\s+/g, " ");
  if (!trimmed) return "";
  const hasCountry = /\b(usa|united states)\b/i.test(trimmed);
  return hasCountry ? trimmed : `${trimmed}, USA`;
}

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();
    const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
    if (!token || !getApps().length) return NextResponse.json({ ok: false, error: "Admin login required." }, { status: 401 });

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 403 });

    const mapsKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_SERVER_API_KEY || "";
    if (!mapsKey) {
      return NextResponse.json({
        ok: false,
        error: "Add GOOGLE_MAPS_SERVER_API_KEY in Vercel to auto-calculate mileage. You can still enter the estimate manually or open the route in Google Maps.",
      }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as Body;
    const rawOriginAddress = cleanText(body.originAddress, 500);
    const rawDestinationAddress = cleanText(body.destinationAddress, 500);
    const originAddress = normalizeAddressForRoutes(rawOriginAddress);
    const destinationAddress = normalizeAddressForRoutes(rawDestinationAddress);
    if (!originAddress || !destinationAddress) {
      return NextResponse.json({ ok: false, error: "Choose both a from-address and to-address." }, { status: 400 });
    }

    if (rawOriginAddress.toLowerCase() === rawDestinationAddress.toLowerCase()) {
      return NextResponse.json({
        ok: true,
        miles: 0,
        durationMinutes: 0,
        source: "Same address - no reimbursable site-to-site mileage",
      });
    }

    const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": mapsKey,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
      },
      body: JSON.stringify({
        origin: { address: originAddress },
        destination: { address: destinationAddress },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_UNAWARE",
        units: "IMPERIAL",
      }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      console.error("Google Routes mileage calculation failed", result);
      return NextResponse.json({ ok: false, error: "Google mileage calculation failed. Check your Maps API key, billing, and Routes API access." }, { status: 502 });
    }

    const route = result?.routes?.[0];
    const hasDistance = route && Object.prototype.hasOwnProperty.call(route, "distanceMeters");
    const distanceMeters = Number(route?.distanceMeters ?? 0);
    if (!route || !hasDistance || !Number.isFinite(distanceMeters) || distanceMeters < 0) {
      console.error("Google Routes returned no usable distance", { originAddress, destinationAddress, result });
      return NextResponse.json({ ok: false, error: "Google did not return a usable route distance. Check that both addresses include a street, city, state, and ZIP, or use Open route in Maps and enter miles manually." }, { status: 422 });
    }

    const miles = distanceMeters / 1609.344;
    const durationMinutes = parseGoogleDurationMinutes(route?.duration);

    return NextResponse.json({
      ok: true,
      miles: Number(miles.toFixed(2)),
      durationMinutes: Number(durationMinutes.toFixed(0)),
      source: "Google Routes API",
    });
  } catch (error) {
    console.error("Mileage estimate failed", error);
    return NextResponse.json({ ok: false, error: "Unable to calculate mileage." }, { status: 500 });
  }
}
