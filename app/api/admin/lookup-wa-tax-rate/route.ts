import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { isAllowedAdminEmail } from "@/lib/adminAuth";
import { getFirebaseAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type LookupBody = {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRatePercent(rateValue: string) {
  const cleaned = rateValue.trim();
  if (!cleaned) return "";
  const decimal = Number(cleaned.startsWith(".") ? `0${cleaned}` : cleaned);
  if (!Number.isFinite(decimal) || decimal <= 0) return "";
  const percent = decimal <= 1 ? decimal * 100 : decimal;
  return Number(percent.toFixed(3)).toString();
}

function parseDorText(text: string) {
  const rateMatch = text.match(/(?:^|\s)Rate\s*=\s*([0-9.]+)/i);
  const locationMatch = text.match(/(?:^|\s)LocationCode\s*=\s*([0-9]+)/i);
  const resultMatch = text.match(/(?:^|\s)ResultCode\s*=\s*([0-9]+)/i);

  return {
    ratePercent: rateMatch ? normalizeRatePercent(rateMatch[1]) : "",
    locationCode: locationMatch ? locationMatch[1] : "",
    resultCode: resultMatch ? resultMatch[1] : "",
  };
}

export async function POST(request: Request) {
  try {
    getFirebaseAdminDb();

    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !getApps().length) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const decoded = await getAuth().verifyIdToken(token);
    if (!isAllowedAdminEmail(decoded.email)) {
      return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as LookupBody | null;
    const address = getString(body?.address);
    const city = getString(body?.city);
    const zip = getString(body?.zip);

    if (!address && !city && !zip) {
      return NextResponse.json({ ok: false, error: "Missing address, city, or ZIP for WA DOR lookup." }, { status: 400 });
    }

    const params = new URLSearchParams();
    params.set("output", "text");
    if (address) params.set("addr", address);
    if (city) params.set("city", city);
    if (zip) params.set("zip", zip);

    const dorUrl = `https://webgis.dor.wa.gov/webapi/AddressRates.aspx?${params.toString()}`;
    const dorResponse = await fetch(dorUrl, { cache: "no-store" });
    const dorText = await dorResponse.text();

    if (!dorResponse.ok) {
      return NextResponse.json({ ok: false, error: "WA DOR lookup did not respond successfully." }, { status: 502 });
    }

    const parsed = parseDorText(dorText);
    if (!parsed.ratePercent) {
      return NextResponse.json({
        ok: false,
        error: "WA DOR did not return a usable tax rate. Open the DOR page and verify the address manually.",
        resultCode: parsed.resultCode,
        raw: dorText.slice(0, 500),
      }, { status: 422 });
    }

    return NextResponse.json({
      ok: true,
      ratePercent: parsed.ratePercent,
      locationCode: parsed.locationCode,
      resultCode: parsed.resultCode,
    });
  } catch (error) {
    console.error("WA DOR tax lookup failed", error);
    return NextResponse.json({ ok: false, error: "Unable to look up WA DOR tax rate." }, { status: 500 });
  }
}
