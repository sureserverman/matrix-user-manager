# Privacy Policy — Matrix User Manager

**Last updated:** February 2025

Matrix User Manager is a browser extension for Matrix/Synapse admins to add servers and manage users. This policy describes what data the extension handles and how, in line with Chrome Web Store and similar store requirements.

## 1. What information we collect

The extension handles the following only in connection with the features you use:

- **Server configuration:** Homeserver domain or URL you enter in Settings, and the Synapse base URL discovered from `/.well-known/matrix/client`.
- **Authentication:** Admin username and password are used only during login to obtain an access token. Your admin password is **not** stored. The access token is stored locally so you can perform admin actions without logging in again.
- **Stored per server:** For each server you add, we store locally: server id, domain, base URL, and access token.
- **User creation:** When you create a user, the username, password, and display name you enter are sent only to the Matrix/Synapse server you selected. This data is not stored by the extension after the request.
- **Manage users:** When you open the Manage page, the extension requests user listings from your Synapse server via its admin API. These requests use the stored access token; no separate copy of the user list is retained by the extension beyond what is needed to display the current page.

The extension does **not** collect:

- Browsing history, analytics, or telemetry.
- Data from websites you visit, except when you explicitly use the extension to connect to a Matrix server you configure.

## 2. How we use the information

- **Server configuration and access tokens:** Used only to connect to the Matrix/Synapse servers you add and to perform admin actions (list users, lock/unlock, remove users, create users).
- **Tabs permission:** Used only to detect if a Manage tab for a server is open and to reload it after you create a user, so the list stays in sync.
- **Optional host permissions (Chrome):** Used only to send requests to the domains of the Matrix servers you configure; no other sites are accessed by the extension for its own purposes.

All use is limited to providing the extension’s described functionality: connecting to your servers and managing users there.

## 3. Who we share the information with

- **Your Matrix/Synapse servers only.** Data you enter (server domains, admin login, new user details) is sent only to the Matrix/Synapse servers you add in the extension. The extension does not send any of this data to the developer, to Google, or to any other third party.
- **No selling or sharing for ads.** We do not sell, rent, or share your data for advertising or marketing.

## 4. Where data is stored

- All stored data (server list, domains, base URLs, access tokens) is kept **only in your browser’s local storage** (`chrome.storage.local` or `browser.storage.local`), on your device. Nothing is stored on our servers because the extension has no backend server.

## 5. Security

- The extension communicates with Matrix/Synapse only over **HTTPS**.
- Your admin password is used only for the login request and is not stored.
- Access tokens are stored only in the browser’s local storage, which is restricted to the extension.

## 6. Your choices and deleting data

- You can remove a server (and its stored URL and access token) from the extension Settings at any time.
- Uninstalling the extension removes all data it has stored in that browser.
- You can clear the extension’s storage via your browser’s extension or site data settings.

## 7. Limited use (Chrome Web Store)

For the purposes of Chrome Web Store policies:

- The extension only uses the data it collects to provide its single purpose: managing Matrix/Synapse users on servers you configure.
- We do not use personal or sensitive user data for advertising, re-targeting, or other monetization.
- We do not allow human reading of your data for purposes other than security, legal compliance, or with your consent (e.g. support).
- Data is only transferred to the Matrix/Synapse servers you specify, to provide the extension’s functionality.

## 8. Changes to this policy

We may update this policy from time to time. The “Last updated” date at the top will be revised. Continued use of the extension after changes means you accept the updated policy.

## 9. Contact

For questions about this privacy policy or the extension, please open an issue in the project’s repository or contact the maintainers through the repository’s listed channels.
