<p align="center">
  <img src="icon.png" alt="Matrix User Manager" width="128" height="128">
</p>

<h1 align="center">Matrix User Manager</h1>

<p align="center">
  A browser extension for managing users on Matrix/Synapse servers.<br>
  Available for Firefox, Tor Browser, Mullvad Browser, and Chromium-based browsers.
</p>

---

## Overview

Matrix User Manager is a lightweight browser extension that lets server administrators provision, manage, and remove user accounts on Matrix/Synapse servers directly from the browser toolbar.

## Features

- **Server discovery** — enter a domain, the extension finds the server via `.well-known`
- **User creation** — create accounts with username, password, and display name
- **User management** — view all users, lock/unlock accounts, remove users
- **Media cleanup** — automatically deletes user media when removing accounts
- **Dark mode** — adapts to your browser's theme
- **Privacy-first** — no data collection, no tracking, credentials never stored

## Installation

### Firefox / Tor Browser / Mullvad Browser

1. Download the latest `.xpi` from [Releases](#) or [addons.mozilla.org](#)
2. Open the browser and navigate to `about:addons`
3. Click the gear icon and select "Install Add-on From File"
4. Select the downloaded `.xpi` file

**For development:**

1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `mozilla/manifest.json`

### Chrome / Chromium / Brave / Edge

1. Download the latest release from [Chrome Web Store](#)

**For development:**

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `chrome/` directory

## Usage

### Adding a Server

1. Click the extension icon and open **Settings**
2. Click **Add Server**
3. Enter the server domain (e.g., `example.com`), admin username, and password
4. The extension discovers the server, authenticates, and saves the connection

### Creating Users

1. Click the extension icon
2. Click **Add User** next to a server
3. Fill in the username, password, and display name
4. Click **Create**

### Managing Users

1. Click the extension icon
2. Click **Manage** next to a server
3. A new tab opens with the full user list
4. Use **Lock** to suspend a user (reversible) or **Remove** to permanently deactivate and erase

## Project Structure

```
mozilla/                 # Firefox extension (Manifest V2)
  manifest.json
  lib/
    storage.js           # browser.storage.local CRUD
    matrix-api.js        # Matrix login, user CRUD, media cleanup
  popup/
    popup.html/css/js    # Toolbar popup — server list & user creation
  options/
    options.html/css/js  # Settings page — server management
  manage/
    manage.html/css/js   # User management page — list, lock, remove
  icons/                 # Extension icons (16-128px)

chrome/                  # Chrome extension (Manifest V3)
  (same structure, adapted for chrome.* APIs
   and optional host permissions)
```

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /.well-known/matrix/client` | Server discovery |
| `POST /_matrix/client/v3/login` | Admin authentication |
| `PUT /_synapse/admin/v2/users/{userId}` | Create/update/lock users |
| `GET /_synapse/admin/v2/users` | List all users |
| `GET /_synapse/admin/v1/users/{userId}/media` | List user media |
| `DELETE /_synapse/admin/v1/media/{serverName}/{mediaId}` | Delete media |
| `POST /_synapse/admin/v1/deactivate/{userId}` | Deactivate user |

## Privacy & Security

- All data stored locally in the browser — nothing sent to third parties
- Admin passwords used only during login, never persisted
- Only access tokens are stored, scoped to the local browser profile
- No analytics, telemetry, or tracking of any kind
- Compatible with privacy-focused browsers (Tor Browser, Mullvad Browser)

## Requirements

- **Firefox** 142+ / **Tor Browser** / **Mullvad Browser** (latest)
- **Chrome** 116+ / **Chromium** / **Brave** / **Edge**
- **Synapse** server with admin API access

## License

MIT
