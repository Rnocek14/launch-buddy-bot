# Footprint Finder Browser Extension

Automatically detect online accounts as you browse the web. Works with your Footprint Finder account to help manage and delete your digital footprint.

## Features

- **Automatic Login Detection**: Detects when you log into websites
- **Local Storage**: Stores detected services securely in your browser
- **Sync to Dashboard**: Syncs detected accounts to your Footprint Finder dashboard
- **Privacy First**: All detection happens locally in your browser

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
cd browser-extension
npm install
```

### Build

```bash
npm run build
```

### Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `browser-extension/dist` folder

### Development Mode

```bash
npm run dev
```

This will watch for changes and rebuild automatically.

## Architecture

- `manifest.json` - Chrome extension manifest (v3)
- `src/background.ts` - Service worker handling messages and sync
- `src/content-scripts/detector.ts` - Login detection injected into pages
- `popup/` - Extension popup UI
- `src/lib/` - Storage and Supabase sync utilities

## Detection Methods

1. **Form Submission**: Detects form submissions containing password fields
2. **OAuth Callbacks**: Detects OAuth redirect patterns
3. **URL Patterns**: Recognizes common login URL patterns
4. **Navigation**: Detects transitions from login pages

## Privacy

- All detection happens locally in your browser
- No data is sent until you explicitly connect and sync
- You control which services are synced
- Toggle detection on/off at any time
