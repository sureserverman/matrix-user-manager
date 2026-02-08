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
