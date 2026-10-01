<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/9418e0e4-8f42-4f6f-9569-3aecbba3bb08

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Streamtape Downloads

Add the Streamtape API credentials to `.env.local` (server-only variables):

```env
STREAMTAPE_LOGIN=your-api-login
STREAMTAPE_KEY=your-api-key
STREAMTAPE_ADMIN_TOKEN=long-random-admin-token
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Request a download link with a Streamtape file ID:

```text
/api/streamtape/download?file=STREAMTAPE_FILE_ID
```

The endpoint requests the download ticket, waits for the provider's required delay, and returns the final download URL. Streamtape file IDs must be mapped to your media records separately; they are not TMDB IDs.

Once a mapping exists, downloads can use the media identity directly:

```text
/api/streamtape/download?tmdb_id=550&type=movie
```

For TV, add `season` and `episode`. A direct `file=STREAMTAPE_FILE_ID` request is also supported.

Create a verified mapping for a movie:

```bash
curl -X POST https://your-app.example/api/streamtape/mappings \
   -H "Authorization: Bearer $STREAMTAPE_ADMIN_TOKEN" \
   -H "Content-Type: application/json" \
   -d '{"tmdb_id":"550","type":"movie","file":"wg8ad12d3QiJRXG"}'
```

For a TV episode, include `season` and `episode`. Look up a mapping with `/api/streamtape/mappings?tmdb_id=550&type=movie`, or verify up to 100 provider files with `/api/streamtape/info?file=FILE_ID_1,FILE_ID_2`.
