# Matrix User Manager

A browser extension for managing users on Matrix/Synapse servers. Designed for server administrators who need to quickly provision, manage, and remove user accounts.

## Features

**Server Management**
- Add multiple Matrix/Synapse servers using just the domain name
- Automatic server discovery via .well-known protocol
- Secure authentication — only access tokens are stored, never passwords
- Edit or remove servers at any time

**User Creation**
- Create new users on any configured server with one click
- Set username, password, and display name
- Instant feedback on whether the user was created or updated

**User Management**
- View all users on a server in a dedicated management page
- Lock/unlock user accounts (reversible suspension)
- Remove users with full cleanup — deactivates the account and deletes all uploaded media
- Pagination support for servers with many users

**Privacy & Security**
- All data is stored locally in the browser — nothing is transmitted to third parties
- No analytics, no tracking, no data collection
- Admin credentials are used only during login and never stored
- Works with Tor Browser and Mullvad Browser for enhanced privacy
- Adapts to your browser's light or dark theme

## Permissions

This extension requires access to your Matrix server URLs in order to communicate with the Synapse admin API. No other websites are accessed.

## How It Works

1. Open the extension settings and add your Matrix server by entering the domain and admin credentials
2. The extension discovers the server via .well-known, authenticates, and stores the access token locally
3. Click the extension icon to see your servers — use "Add User" to create accounts or "Manage" to view, lock, or remove existing users
