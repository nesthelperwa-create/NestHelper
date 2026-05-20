# PowerShell Setup

1. Install Node.js LTS.
2. Extract the ZIP.
3. Open PowerShell in the project folder.
4. Run:

```powershell
copy .env.example .env.local
npm install
npm run dev
```

5. Open `http://localhost:3000`.
6. Edit contact info in `.env.local` and `lib/siteConfig.ts` if needed.

For production:

```powershell
npm run build
npx vercel --prod
```
