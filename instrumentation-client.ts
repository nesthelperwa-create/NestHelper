// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://a78de31466d868c54d2fe628ec398ed4@o4511611144175616.ingest.us.sentry.io/4511611158659072",

  // Keep performance tracing enabled. Lower later if Sentry gets noisy/expensive.
  tracesSampleRate: 1,

  // Do not attach visitor IP/user info by default.
  sendDefaultPii: false,

  beforeSend(event, hint) {
    const error = hint.originalException;
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : event.exception?.values?.[0]?.value ?? "";

    const browserName = String(event.contexts?.browser?.name ?? "").toLowerCase();
    const stackText = JSON.stringify(event.exception?.values ?? []);

    // Instagram/Facebook in-app browser noise. This happens when their WebView
    // script tries to call a native iOS bridge that is not present. It is not
    // caused by NestHelper's request form code.
    if (
      message.includes("window.webkit.messageHandlers") ||
      stackText.includes("sendDataToNative") ||
      (browserName.includes("instagram") && stackText.includes("messageHandlers"))
    ) {
      return null;
    }

    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
