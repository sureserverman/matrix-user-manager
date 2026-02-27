(function () {
  document.getElementById("favicon").href = browser.runtime.getURL("icons/icon-48.png");

  const pageTitle = document.getElementById("page-title");
  const statusEl = document.getElementById("status");
  const userList = document.getElementById("user-list");
  const pagination = document.getElementById("pagination");
  const btnLoadMore = document.getElementById("btn-load-more");

  const params = new URLSearchParams(window.location.search);
  const serverId = params.get("server");

  let server = null;
  let nextToken = "0";
  let currentUserId = null;

  function showStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = type ? `msg-${type}` : "";
  }

  function addUserRow(user) {
    const row = document.createElement("tr");
    const isDeactivated = user.deactivated === 1;
    const isLocked = !!user.locked;
    const isSelf = currentUserId && user.name === currentUserId;

    const tdName = document.createElement("td");
    tdName.textContent = user.name;
    if (isDeactivated) tdName.className = "deactivated";
    row.appendChild(tdName);

    const tdDisplay = document.createElement("td");
    tdDisplay.textContent = user.displayname || "";
    if (isDeactivated) tdDisplay.className = "deactivated";
    row.appendChild(tdDisplay);

    const tdActions = document.createElement("td");
    if (isDeactivated) {
      const span = document.createElement("span");
      span.textContent = "Deactivated";
      tdActions.appendChild(span);
    } else {
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "actions";

      const lockBtn = document.createElement("button");
      lockBtn.className = isLocked ? "btn-unlock" : "btn-lock";
      lockBtn.textContent = isLocked ? "Unlock" : "Lock";
      lockBtn.dataset.locked = String(isLocked);
      if (isSelf) {
        lockBtn.disabled = true;
        lockBtn.title = "You cannot lock yourself";
      } else {
        lockBtn.addEventListener("click", () => handleLock(user.name, lockBtn));
      }
      actionsDiv.appendChild(lockBtn);

      const removeBtn = document.createElement("button");
      removeBtn.className = "btn-remove";
      removeBtn.textContent = "Remove";
      if (isSelf) {
        removeBtn.disabled = true;
        removeBtn.title = "You cannot remove yourself";
      } else {
        removeBtn.addEventListener("click", () => handleRemove(user.name, row, removeBtn));
      }
      actionsDiv.appendChild(removeBtn);

      tdActions.appendChild(actionsDiv);
    }
    row.appendChild(tdActions);

    userList.appendChild(row);
  }

  async function loadUsers() {
    showStatus("Loading users...", "info");
    try {
      const data = await MatrixApi.listUsers(server.url, server.accessToken, nextToken);
      const users = data.users || [];

      if (users.length === 0 && nextToken === "0") {
        showStatus("No users found.", "info");
        return;
      }

      users.forEach(addUserRow);

      if (data.next_token) {
        nextToken = data.next_token;
        pagination.classList.remove("hidden");
      } else {
        pagination.classList.add("hidden");
      }

      showStatus(`${userList.children.length} users loaded.`, "info");
    } catch (e) {
      showStatus(e.message, "error");
    }
  }

  async function handleLock(userId, btn) {
    const isCurrentlyLocked = btn.dataset.locked === "true";
    const action = isCurrentlyLocked ? "unlock" : "lock";

    btn.disabled = true;
    btn.textContent = isCurrentlyLocked ? "Unlocking..." : "Locking...";

    try {
      await MatrixApi.lockUser(server.url, server.accessToken, userId, !isCurrentlyLocked);
      if (isCurrentlyLocked) {
        btn.className = "btn-lock";
        btn.textContent = "Lock";
        btn.dataset.locked = "false";
      } else {
        btn.className = "btn-unlock";
        btn.textContent = "Unlock";
        btn.dataset.locked = "true";
      }
      showStatus(`${userId} ${action}ed.`, "success");
    } catch (e) {
      btn.textContent = isCurrentlyLocked ? "Unlock" : "Lock";
      showStatus(e.message, "error");
    } finally {
      btn.disabled = false;
    }
  }

  async function handleRemove(userId, row, btn) {
    if (!confirm(`Remove user ${userId}? This will deactivate and erase the account.`)) return;

    btn.disabled = true;
    btn.textContent = "Removing...";

    try {
      const result = await MatrixApi.removeUser(server.url, server.accessToken, userId);
      row.querySelector("td:first-child").classList.add("deactivated");
      row.querySelector("td:nth-child(2)").classList.add("deactivated");
      const lastTd = row.querySelector("td:last-child");
      while (lastTd.firstChild) lastTd.firstChild.remove();
      const span = document.createElement("span");
      span.textContent = "Deactivated";
      lastTd.appendChild(span);
      const mediaMsg = result.media_deleted > 0 ? ` (${result.media_deleted} media files deleted)` : "";
      showStatus(`${userId} has been removed.${mediaMsg}`, "success");
    } catch (e) {
      btn.disabled = false;
      btn.textContent = "Remove";
      showStatus(e.message, "error");
    }
  }

  async function init() {
    if (!serverId) {
      showStatus("No server specified.", "error");
      return;
    }

    const servers = await Storage.getServers();
    server = servers.find(s => s.id === serverId);

    if (!server) {
      showStatus("Server not found.", "error");
      return;
    }

    pageTitle.textContent = `Manage Users — ${server.domain}`;
    document.title = `Manage Users — ${server.domain}`;
    try {
      currentUserId = await MatrixApi.whoami(server.url, server.accessToken);
    } catch (_) {
      currentUserId = null;
    }
    await loadUsers();
  }

  btnLoadMore.addEventListener("click", loadUsers);
  init();
})();
