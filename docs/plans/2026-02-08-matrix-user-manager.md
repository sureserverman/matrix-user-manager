# Matrix User Manager — Firefox Extension Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Firefox WebExtension (Manifest V2) that lets admins manage Matrix/Synapse servers and quickly provision users from the browser toolbar.

**Architecture:** Popup shows server list with "Add User" forms; Options page handles server CRUD (add/edit/delete). Shared modules handle Matrix API calls and browser.storage.local persistence. No frameworks, pure HTML/CSS/JS.

**Tech Stack:** WebExtension APIs (Manifest V2), browser.storage.local, fetch API, HTML/CSS/JS

---

### Task 1: Project Scaffolding & Manifest

**Files:**
- Create: `manifest.json`

**Step 1: Create manifest.json**

```json
{
  "manifest_version": 2,
  "name": "Matrix User Manager",
  "version": "1.0",
  "description": "Manage Matrix/Synapse servers and provision users",
  "permissions": [
    "storage",
    "<all_urls>"
  ],
  "browser_action": {
    "default_popup": "popup/popup.html",
    "default_title": "Matrix User Manager"
  },
  "options_ui": {
    "page": "options/options.html",
    "open_in_tab": true
  }
}
```

**Step 2: Create empty placeholder files**

Create these empty files so the structure exists:
- `popup/popup.html`
- `popup/popup.js`
- `popup/popup.css`
- `options/options.html`
- `options/options.js`
- `options/options.css`
- `lib/matrix-api.js`
- `lib/storage.js`

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: scaffold project structure and manifest"
```

---

### Task 2: Storage Module

**Files:**
- Create: `lib/storage.js`

**Step 1: Implement storage.js**

```js
const Storage = {
  async getServers() {
    const data = await browser.storage.local.get("servers");
    return data.servers || [];
  },

  async saveServers(servers) {
    await browser.storage.local.set({ servers });
  },

  async addServer(server) {
    const servers = await this.getServers();
    servers.push(server);
    await this.saveServers(servers);
  },

  async updateServer(id, updates) {
    const servers = await this.getServers();
    const index = servers.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Server not found");
    servers[index] = { ...servers[index], ...updates };
    await this.saveServers(servers);
  },

  async deleteServer(id) {
    const servers = await this.getServers();
    await this.saveServers(servers.filter(s => s.id !== id));
  },

  generateId() {
    return Math.random().toString(36).substring(2, 10);
  }
};
```

**Step 2: Commit**

```bash
git add lib/storage.js
git commit -m "feat: implement storage module for server CRUD"
```

---

### Task 3: Matrix API Module

**Files:**
- Create: `lib/matrix-api.js`

**Step 1: Implement matrix-api.js**

```js
const MatrixApi = {
  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (e) {
      throw new Error("Invalid server URL");
    }
  },

  async login(serverUrl, username, password) {
    const url = `${serverUrl.replace(/\/+$/, "")}/_matrix/client/r0/login`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "m.login.password",
        user: username,
        password: password
      })
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Invalid credentials");
      }
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Login failed (${response.status})`);
    }

    const data = await response.json();
    if (!data.access_token) {
      throw new Error("No access token in response");
    }
    return data.access_token;
  },

  async createUser(serverUrl, accessToken, domain, username, password, displayname) {
    const userId = encodeURIComponent(`@${username}:${domain}`);
    const url = `${serverUrl.replace(/\/+$/, "")}/_synapse/admin/v2/users/${userId}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        password: password,
        displayname: displayname,
        admin: false,
        deactivated: false
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Access token expired or invalid. Re-add the server in settings.");
      }
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Request failed (${response.status})`);
    }

    const status = response.status;
    const fullUserId = `@${username}:${domain}`;

    if (status === 200) {
      return { success: true, message: `User ${fullUserId} created` };
    } else if (status === 201) {
      return { success: true, message: `User ${fullUserId} updated` };
    }
    return { success: true, message: `User ${fullUserId} created` };
  }
};
```

**Step 2: Commit**

```bash
git add lib/matrix-api.js
git commit -m "feat: implement Matrix API module (login + user creation)"
```

---

### Task 4: Options Page — HTML & CSS

**Files:**
- Create: `options/options.html`
- Create: `options/options.css`

**Step 1: Implement options.html**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Matrix User Manager — Settings</title>
  <link rel="stylesheet" href="options.css">
</head>
<body>
  <h1>Matrix User Manager — Settings</h1>

  <button id="btn-add-server" type="button">Add Server</button>

  <div id="server-form" class="hidden">
    <h2 id="form-title">Add Server</h2>
    <label>Server URL
      <input type="url" id="input-url" placeholder="https://matrix.example.com">
    </label>
    <label>Admin Username
      <input type="text" id="input-username" placeholder="@admin:example.com">
    </label>
    <label>Admin Password
      <input type="password" id="input-password">
    </label>
    <div class="form-actions">
      <button id="btn-save" type="button">Save</button>
      <button id="btn-cancel" type="button">Cancel</button>
    </div>
    <div id="form-message" class="hidden"></div>
  </div>

  <table id="server-table">
    <thead>
      <tr>
        <th>Server URL</th>
        <th>Domain</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody id="server-list"></tbody>
  </table>

  <script src="../lib/storage.js"></script>
  <script src="../lib/matrix-api.js"></script>
  <script src="options.js"></script>
</body>
</html>
```

**Step 2: Implement options.css**

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  max-width: 700px;
  margin: 20px auto;
  padding: 0 20px;
  color: #1a1a1a;
  background: #fafafa;
}

h1 {
  font-size: 1.3em;
  margin-bottom: 16px;
}

h2 {
  font-size: 1.1em;
  margin-bottom: 12px;
}

label {
  display: block;
  margin-bottom: 10px;
  font-size: 0.9em;
  font-weight: 500;
}

input {
  display: block;
  width: 100%;
  padding: 6px 8px;
  margin-top: 4px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9em;
}

button {
  padding: 6px 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 0.85em;
}

button:hover { background: #f0f0f0; }

#btn-add-server {
  margin-bottom: 16px;
  background: #4a9eff;
  color: #fff;
  border-color: #4a9eff;
}

#btn-add-server:hover { background: #3a8eef; }

#btn-save {
  background: #4a9eff;
  color: #fff;
  border-color: #4a9eff;
}

#btn-save:hover { background: #3a8eef; }

#server-form {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
  background: #fff;
}

.form-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.hidden { display: none; }

#form-message {
  margin-top: 10px;
  padding: 8px;
  border-radius: 4px;
  font-size: 0.85em;
}

.msg-success { background: #e6f9e6; color: #1a7a1a; }
.msg-error { background: #fde8e8; color: #b91c1c; }

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid #eee;
  font-size: 0.85em;
}

th {
  font-weight: 600;
  border-bottom: 2px solid #ddd;
}

td button { margin-right: 4px; }

.btn-delete {
  color: #b91c1c;
  border-color: #b91c1c;
}

.btn-delete:hover { background: #fde8e8; }
```

**Step 3: Commit**

```bash
git add options/options.html options/options.css
git commit -m "feat: options page HTML and CSS"
```

---

### Task 5: Options Page — JavaScript

**Files:**
- Create: `options/options.js`

**Step 1: Implement options.js**

```js
(function () {
  const btnAdd = document.getElementById("btn-add-server");
  const form = document.getElementById("server-form");
  const formTitle = document.getElementById("form-title");
  const inputUrl = document.getElementById("input-url");
  const inputUsername = document.getElementById("input-username");
  const inputPassword = document.getElementById("input-password");
  const btnSave = document.getElementById("btn-save");
  const btnCancel = document.getElementById("btn-cancel");
  const formMessage = document.getElementById("form-message");
  const serverList = document.getElementById("server-list");

  let editingId = null;

  function showForm(title, url) {
    formTitle.textContent = title;
    inputUrl.value = url || "";
    inputUsername.value = "";
    inputPassword.value = "";
    formMessage.classList.add("hidden");
    form.classList.remove("hidden");
    btnAdd.classList.add("hidden");
  }

  function hideForm() {
    form.classList.add("hidden");
    btnAdd.classList.remove("hidden");
    editingId = null;
  }

  function showMessage(text, isError) {
    formMessage.textContent = text;
    formMessage.className = isError ? "msg-error" : "msg-success";
    formMessage.classList.remove("hidden");
  }

  async function renderServers() {
    const servers = await Storage.getServers();
    serverList.innerHTML = "";
    if (servers.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = '<td colspan="3">No servers added yet.</td>';
      serverList.appendChild(row);
      return;
    }
    servers.forEach(server => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(server.url)}</td>
        <td>${escapeHtml(server.domain)}</td>
        <td>
          <button class="btn-edit" data-id="${server.id}">Edit</button>
          <button class="btn-delete" data-id="${server.id}">Delete</button>
        </td>
      `;
      serverList.appendChild(row);
    });

    serverList.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", () => handleEdit(btn.dataset.id));
    });
    serverList.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", () => handleDelete(btn.dataset.id));
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  async function handleEdit(id) {
    const servers = await Storage.getServers();
    const server = servers.find(s => s.id === id);
    if (!server) return;
    editingId = id;
    showForm("Edit Server", server.url);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this server?")) return;
    await Storage.deleteServer(id);
    await renderServers();
  }

  async function handleSave() {
    const url = inputUrl.value.trim();
    const username = inputUsername.value.trim();
    const password = inputPassword.value;

    if (!url || !username || !password) {
      showMessage("All fields are required.", true);
      return;
    }

    let domain;
    try {
      domain = MatrixApi.extractDomain(url);
    } catch (e) {
      showMessage(e.message, true);
      return;
    }

    btnSave.disabled = true;
    btnSave.textContent = "Connecting...";

    try {
      const accessToken = await MatrixApi.login(url, username, password);

      if (editingId) {
        await Storage.updateServer(editingId, { url, domain, accessToken });
      } else {
        await Storage.addServer({
          id: Storage.generateId(),
          url,
          domain,
          accessToken
        });
      }

      showMessage("Server saved successfully.", false);
      await renderServers();
      setTimeout(hideForm, 1000);
    } catch (e) {
      showMessage(e.message, true);
    } finally {
      btnSave.disabled = false;
      btnSave.textContent = "Save";
    }
  }

  btnAdd.addEventListener("click", () => {
    editingId = null;
    showForm("Add Server");
  });
  btnCancel.addEventListener("click", hideForm);
  btnSave.addEventListener("click", handleSave);

  renderServers();
})();
```

**Step 2: Commit**

```bash
git add options/options.js
git commit -m "feat: options page logic (server add/edit/delete)"
```

---

### Task 6: Popup — HTML & CSS

**Files:**
- Create: `popup/popup.html`
- Create: `popup/popup.css`

**Step 1: Implement popup.html**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div id="server-list"></div>
  <div id="empty-state" class="hidden">
    <p>No servers configured.</p>
    <button id="btn-open-settings" type="button">Open Settings</button>
  </div>

  <footer>
    <a href="#" id="link-settings">Settings</a>
  </footer>

  <script src="../lib/storage.js"></script>
  <script src="../lib/matrix-api.js"></script>
  <script src="popup.js"></script>
</body>
</html>
```

**Step 2: Implement popup.css**

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  width: 350px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #1a1a1a;
  background: #fafafa;
  font-size: 13px;
}

.server-card {
  border-bottom: 1px solid #eee;
  padding: 10px 12px;
}

.server-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.server-url {
  font-weight: 600;
  font-size: 0.95em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 220px;
}

.server-domain {
  font-size: 0.8em;
  color: #666;
  margin-bottom: 4px;
}

button {
  padding: 4px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 0.85em;
}

button:hover { background: #f0f0f0; }

.btn-add-user {
  background: #4a9eff;
  color: #fff;
  border-color: #4a9eff;
}

.btn-add-user:hover { background: #3a8eef; }

.btn-create {
  background: #4a9eff;
  color: #fff;
  border-color: #4a9eff;
}

.btn-create:hover { background: #3a8eef; }

.user-form {
  margin-top: 8px;
  padding: 8px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.user-form label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.85em;
  font-weight: 500;
}

.user-form input {
  display: block;
  width: 100%;
  padding: 4px 6px;
  margin-top: 2px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 0.85em;
}

.form-actions {
  margin-top: 8px;
  display: flex;
  gap: 6px;
}

.user-message {
  margin-top: 6px;
  padding: 6px;
  border-radius: 3px;
  font-size: 0.8em;
}

.msg-success { background: #e6f9e6; color: #1a7a1a; }
.msg-error { background: #fde8e8; color: #b91c1c; }

.hidden { display: none; }

#empty-state {
  padding: 20px;
  text-align: center;
  color: #666;
}

#empty-state button {
  margin-top: 8px;
}

footer {
  padding: 8px 12px;
  border-top: 1px solid #eee;
  text-align: right;
}

footer a {
  font-size: 0.8em;
  color: #4a9eff;
  text-decoration: none;
}

footer a:hover { text-decoration: underline; }
```

**Step 3: Commit**

```bash
git add popup/popup.html popup/popup.css
git commit -m "feat: popup HTML and CSS"
```

---

### Task 7: Popup — JavaScript

**Files:**
- Create: `popup/popup.js`

**Step 1: Implement popup.js**

```js
(function () {
  const serverListEl = document.getElementById("server-list");
  const emptyState = document.getElementById("empty-state");

  async function render() {
    const servers = await Storage.getServers();
    serverListEl.innerHTML = "";

    if (servers.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");

    servers.forEach(server => {
      const card = document.createElement("div");
      card.className = "server-card";
      card.innerHTML = `
        <div class="server-header">
          <span class="server-url">${escapeHtml(server.url)}</span>
          <button class="btn-add-user" data-id="${server.id}">Add User</button>
        </div>
        <div class="server-domain">${escapeHtml(server.domain)}</div>
        <div class="user-form-container hidden" data-form-id="${server.id}">
          <div class="user-form">
            <label>Username
              <input type="text" class="input-username" placeholder="newuser">
            </label>
            <label>Password
              <input type="password" class="input-password">
            </label>
            <label>Display Name
              <input type="text" class="input-displayname" placeholder="New User">
            </label>
            <div class="form-actions">
              <button class="btn-create" data-id="${server.id}">Create</button>
              <button class="btn-cancel-user">Cancel</button>
            </div>
            <div class="user-message hidden"></div>
          </div>
        </div>
      `;
      serverListEl.appendChild(card);
    });

    serverListEl.querySelectorAll(".btn-add-user").forEach(btn => {
      btn.addEventListener("click", () => {
        const formContainer = serverListEl.querySelector(
          `.user-form-container[data-form-id="${btn.dataset.id}"]`
        );
        formContainer.classList.toggle("hidden");
      });
    });

    serverListEl.querySelectorAll(".btn-cancel-user").forEach(btn => {
      btn.addEventListener("click", () => {
        btn.closest(".user-form-container").classList.add("hidden");
      });
    });

    serverListEl.querySelectorAll(".btn-create").forEach(btn => {
      btn.addEventListener("click", () => handleCreateUser(btn.dataset.id, btn));
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  async function handleCreateUser(serverId, btn) {
    const servers = await Storage.getServers();
    const server = servers.find(s => s.id === serverId);
    if (!server) return;

    const formContainer = btn.closest(".user-form-container");
    const username = formContainer.querySelector(".input-username").value.trim();
    const password = formContainer.querySelector(".input-password").value;
    const displayname = formContainer.querySelector(".input-displayname").value.trim();
    const messageEl = formContainer.querySelector(".user-message");

    if (!username || !password || !displayname) {
      messageEl.textContent = "All fields are required.";
      messageEl.className = "user-message msg-error";
      return;
    }

    btn.disabled = true;
    btn.textContent = "Creating...";

    try {
      const result = await MatrixApi.createUser(
        server.url, server.accessToken, server.domain,
        username, password, displayname
      );
      messageEl.textContent = result.message;
      messageEl.className = "user-message msg-success";
      formContainer.querySelector(".input-username").value = "";
      formContainer.querySelector(".input-password").value = "";
      formContainer.querySelector(".input-displayname").value = "";
    } catch (e) {
      messageEl.textContent = e.message;
      messageEl.className = "user-message msg-error";
    } finally {
      btn.disabled = false;
      btn.textContent = "Create";
    }
  }

  document.getElementById("link-settings").addEventListener("click", (e) => {
    e.preventDefault();
    browser.runtime.openOptionsPage();
  });

  const btnOpenSettings = document.getElementById("btn-open-settings");
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener("click", () => {
      browser.runtime.openOptionsPage();
    });
  }

  render();
})();
```

**Step 2: Commit**

```bash
git add popup/popup.js
git commit -m "feat: popup logic (server list + user creation)"
```

---

### Task 8: Manual Testing & Polish

**Step 1: Load extension in Firefox**

1. Open Firefox (or Tor/Mullvad Browser)
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select `manifest.json` from the project directory

**Step 2: Test options page**

- Click extension icon → "Settings" link
- Add a server with valid URL + credentials → verify it appears in list
- Edit the server → verify form pre-fills URL
- Delete the server → verify it disappears

**Step 3: Test popup**

- Add a server via settings first
- Click extension icon → verify server appears
- Click "Add User" → fill form → click "Create"
- Verify success/error messages

**Step 4: Fix any issues found during testing**

**Step 5: Final commit**

```bash
git add -A
git commit -m "fix: polish after manual testing"
```
