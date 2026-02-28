<p align="center">
  <img src="icon.png" alt="Matrix User Manager" width="128" height="128">
</p>

# Matrix User Manager

Matrix/Synapse admin extension: add servers, create and manage users from the toolbar; data stays local.

## Install

| Platform | Link |
|----------|------|
| **Firefox (desktop)** | [addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/matrix-synapse-user-manager/) |
| **Firefox for Android** | [addons.mozilla.org](https://addons.mozilla.org/en-GB/firefox/addon/matrix-user-manager-android/) |
| **Chrome / Chromium / Edge** | [Chrome Web Store](https://chromewebstore.google.com/detail/matrix-user-manager/eghhpddhhehnnchhecakmhddbiojogig) |

**Development:** Load unpacked from `mozilla/` (Firefox), `chrome/` (Chrome), or `moz-mobile/` (Firefox Android). See [Development](#development) below.

## Quick start

1. Open the extension and go to **Settings**.
2. Add a homeserver domain (e.g. `example.com`) and admin username/password.
3. From the popup (or app on Android), **Add user** or open **Manage** to list, lock/unlock, and remove users.

## Features

- **Server discovery** — Enter a domain; the extension finds the Synapse URL via `/.well-known/matrix/client`.
- **User creation** — Username, password, and display name; creates or updates users via Synapse admin API.
- **User management** — List users with pagination; lock/unlock accounts; remove users with media cleanup (`erase: true`).
- **Self‑protection** — Admins cannot lock or remove their own account (Lock/Remove disabled for the logged‑in user).
- **Localization** — UI in 11 languages (EN, ES, DE, FR, IT, PT-BR, RU, JA, ZH-CN, ZH-TW, UK); errors and messages localized.
- **Themes** — Follows system light/dark preference.
- **Manage tab sync** — Creating a user from the popup/app reloads an open Manage tab for that server so the list stays up to date.
- **Firefox Android** — In-tab navigation (App ↔ Settings ↔ Manage) instead of multiple tabs; Back link on Settings and Manage.

## Privacy and permissions

- **[Privacy policy](PRIVACY.md)** — What data is collected, how it’s used, and who it’s shared with (required for store listings).
- **Storage** — Server list and access tokens only in `browser.storage.local` / `chrome.storage.local` on your device.
- **Passwords** — Admin password is used once for login and is not stored.
- **Network** — Firefox: `storage` + host access; Chrome: `storage` + optional host permissions (requested per server when you add it).
- **Tabs** — Used only to detect and reload the extension’s own Manage page after creating a user.
- No telemetry, analytics, or third‑party data collection.

## Development

**Structure:** `chrome/` (Chrome MV3), `mozilla/` (Firefox desktop), `moz-mobile/` (Firefox Android). Shared logic in `lib/` per build. [Announce](docs/announce.md) · [About](docs/about.md)

**Load unpacked**

- **Firefox (desktop):** `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → select `mozilla/manifest.json`.
- **Chrome / Chromium:** `chrome://extensions` → **Developer mode** → **Load unpacked** → select the `chrome/` folder.
- **Firefox Android:** Build an XPI from `moz-mobile/` and install via “Install Add-on from file” or your usual sideload flow.

**Build packages locally**

From the repo root (output in project root):

```bash
# Chrome (zip for Chrome Web Store)
cd chrome && zip -r ../matrix-user-manager-chrome.zip . -x "*.git*" && cd ..

# Firefox desktop (XPI for AMO)
cd mozilla && zip -r ../matrix-user-manager-mozilla.xpi . -x "*.git*" && cd ..

# Firefox Android (XPI)
cd moz-mobile && zip -r ../matrix-user-manager-mobile.xpi . -x "*.git*" && cd ..
```

**CI** — Tag `v*` triggers [publish.yml](.github/workflows/publish.yml) to publish Firefox desktop to AMO. Chrome and Android: publish manually.

**Requirements** — Synapse with admin API; Firefox 109+ or Chrome 88+.

<details>
<summary>API endpoints (Synapse admin + client)</summary>

| Endpoint | Purpose |
|----------|---------|
| `GET /.well-known/matrix/client` | Discover homeserver |
| `POST /_matrix/client/v3/login` | Admin login |
| `GET /_matrix/client/v3/account/whoami` | Current user (self-lock prevention) |
| `PUT /_synapse/admin/v2/users/{userId}` | Create/update/lock user |
| `GET /_synapse/admin/v2/users` | List users |
| `GET /_synapse/admin/v1/users/{userId}/media` | List media |
| `DELETE /_synapse/admin/v1/media/...` | Delete media |
| `POST /_synapse/admin/v1/deactivate/{userId}` | Deactivate and erase user |

</details>

## License

BSD-2-Clause. See [LICENSE.md](LICENSE.md).
