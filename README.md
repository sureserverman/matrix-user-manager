<p align="center">
  <img src="icon.png" alt="Matrix User Manager" width="128" height="128">
</p>

# Matrix User Manager

Browser extension for Matrix/Synapse admins to add servers and manage users fast.

## Install

- Firefox desktop: <https://addons.mozilla.org/en-US/firefox/addon/matrix-synapse-user-manager/>
- Firefox for Android: <https://addons.mozilla.org/en-GB/firefox/addon/matrix-user-manager-android/>
- Chrome Web Store: <https://chromewebstore.google.com/detail/matrix-user-manager/eghhpddhhehnnchhecakmhddbiojogig>
- Firefox desktop / Tor Browser / Mullvad Browser: load `mozilla/manifest.json` as a temporary add-on

## Quick Start

1. Open the extension and go to **Settings**.
2. Add a homeserver domain (for example `example.com`) plus admin credentials.
3. Create users from the popup, or open **Manage** to list, lock/unlock, and remove users.

## What It Does

- Discovers homeserver base URL through `/.well-known/matrix/client`
- Signs in with admin credentials and stores server config locally
- Creates users with username, password, and display name
- Lists users with pagination (`limit=100`) on Synapse admin API
- Locks/unlocks accounts and deactivates users with `erase: true`
- Deletes user media files before deactivation

## Privacy

- **[Privacy Policy](PRIVACY.md)** — What data the extension collects, how it is used, and who it is shared with (for Chrome Web Store and similar requirements).

## Privacy and Permissions

- Stored locally via `browser.storage.local` / `chrome.storage.local`
- Admin password is used for login flow and not persisted
- Access token is stored locally for subsequent admin actions
- No telemetry, analytics, or third-party data collection in code
- Firefox builds request `storage` + network access; Chrome build uses `storage` with optional host permissions

## Development Load

- Firefox (desktop): `about:debugging#/runtime/this-firefox` -> **Load Temporary Add-on** -> `mozilla/manifest.json`
- Chrome/Chromium: `chrome://extensions` -> **Developer mode** -> **Load unpacked** -> `chrome/`
- Firefox Android variant source: `moz-mobile/` (app-style entry + background open behavior)

## API Surface

| Endpoint | Purpose |
|----------|---------|
| `GET /.well-known/matrix/client` | Discover homeserver |
| `POST /_matrix/client/v3/login` | Admin login |
| `PUT /_synapse/admin/v2/users/{userId}` | Create/update/lock user |
| `GET /_synapse/admin/v2/users` | List users |
| `GET /_synapse/admin/v1/users/{userId}/media` | List media by user |
| `DELETE /_synapse/admin/v1/media/{serverName}/{mediaId}` | Delete media item |
| `POST /_synapse/admin/v1/deactivate/{userId}` | Deactivate and erase user |

## Requirements

- Synapse homeserver with admin API access
- Firefox 109+ (desktop/Android), Tor Browser, Mullvad Browser, or Chromium-based browser (Chrome 88+ for the MV3 build)

## License

BSD-2-Clause. See [LICENSE.md](LICENSE.md).
