## Google Sheets Dashboard (Vite + Express)

### Features
- Sign in with Google (OAuth 2.0 server-side flow)
- List spreadsheet files from Google Drive with title, owners, modified time
- Preview first 3 rows x 5 cols via Sheets API
- Search by title, pagination, open in Google Sheets, refresh preview
- Responsive basic UI, loading states, counts

### Google Cloud setup
1. Create a project in Google Cloud Console.
2. Enable APIs: Drive API, Sheets API, People API (for profile) or OAuth2 userinfo.
3. Create OAuth 2.0 Client ID (Web application).
   - Authorized redirect URI: `http://localhost:4000/auth/callback`
4. Copy Client ID and Client Secret.

### Env variables (server/.env)
Create `server/.env` with:

```
PORT=4000
SESSION_SECRET=replace-with-strong-secret
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REDIRECT_URI=http://localhost:4000/auth/callback
```

### OAuth scopes requested
```
https://www.googleapis.com/auth/drive.metadata.readonly
https://www.googleapis.com/auth/spreadsheets.readonly
openid
email
profile
```

### Install and run (local)
```
npm install
npm --workspace client install
npm --workspace server install
npm run dev
```

Frontend on http://localhost:5173, API server on http://localhost:4000.

### Scripts
- dev: run client and server concurrently
- start: start server in production
- build: build client
- lint: run ESLint in both workspaces
- test: run tests in both workspaces

### Notes on security and privacy
- Uses server-side sessions with HTTP-only cookie; client secret is never exposed to frontend.
- Access tokens are stored only in server session; sessions expire; logout clears cookie.

### Error handling
- Backend validates inputs, handles OAuth/network errors, and reports user-friendly messages.
- Frontend shows placeholders and fallback when preview unavailable.

### Deployment
- Heroku/Render: set env vars above; serve server on PORT; serve built client separately or via reverse proxy.
- Vercel/Netlify: host client; use a separate Node server (Render/Heroku) for the API.



