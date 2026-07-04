# Sentry Instagram in-app browser noise fix

This update changes `instrumentation-client.ts` only.

It filters the noisy Sentry frontend error:

`undefined is not an object (evaluating 'window.webkit.messageHandlers')`

This error is coming from the Instagram/Facebook in-app browser WebView on `/request`, not from the NestHelper request form.

It also changes `sendDefaultPii` from `true` to `false` so Sentry does not attach visitor IP/user info by default.

## Files changed

- `instrumentation-client.ts`

## Deploy

After copying the replacement file, push to GitHub/Vercel:

```powershell
git status
git add instrumentation-client.ts README_SENTRY_INSTAGRAM_NOISE_FIX.md
git commit -m "Filter Instagram Sentry noise"
git push origin main
```
