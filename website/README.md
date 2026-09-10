# TESSERACT '26 Website

Standalone Next.js website for TESSERACT '26. The app is self-contained in this folder and includes the event data, images, poster gallery, filters, committee section, and Google Form links.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` for the home page or `/register` for events and guidelines.

## Production

```bash
npm run build
npm start
```

The public assets are in `public/static`. No Flask server, database, or API is required for this frontend-only version.
