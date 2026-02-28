(function () {
  const pageTitleDoc = document.getElementById("page-title");
  const statusEl = document.getElementById("status");
  const userList = document.getElementById("user-list");
  const pagination = document.getElementById("pagination");
  const btnLoadMore = document.getElementById("btn-load-more");

  const params = new URLSearchParams(window.location.search);
  const serverId = params.get("server");

  let server = null;
  let nextToken = "0";
  let currentUserId = null;

  function t(key, subs) {
    if (subs !== undefined) subs = Array.isArray(subs) ? subs : [subs];
    return browser.i18n.getMessage(key, subs) || key;
  }

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
      span.textContent = t("deactivated");
      tdActions.appendChild(span);
    } else {
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "actions";

      const lockBtn = document.createElement("button");
      lockBtn.className = isLocked ? "btn-unlock" : "btn-lock";
      lockBtn.textContent = isLocked ? t("unlock") : t("lock");
      lockBtn.dataset.locked = String(isLocked);
      if (isSelf) {
        lockBtn.disabled = true;
        lockBtn.title = t("cannotLockSelf");
      } else {
        lockBtn.addEventListener("click", () => handleLock(user.name, lockBtn));
      }
      actionsDiv.appendChild(lockBtn);

      const removeBtn = document.createElement("button");
      removeBtn.className = "btn-remove";
      removeBtn.textContent = t("remove");
      if (isSelf) {
        removeBtn.disabled = true;
        removeBtn.title = t("cannotRemoveSelf");
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
    showStatus(t("loadingUsers"), "info");
    try {
      const data = await MatrixApi.listUsers(server.url, server.accessToken, nextToken);
      const users = data.users || [];

      if (users.length === 0 && nextToken === "0") {
        showStatus(t("noUsersFound"), "info");
        return;
      }

      users.forEach(addUserRow);

      if (data.next_token) {
        nextToken = data.next_token;
        pagination.classList.remove("hidden");
      } else {
        pagination.classList.add("hidden");
      }

      showStatus(t("usersLoaded", [userList.children.length]), "info");
    } catch (e) {
      showStatus(e && e.errorKey ? t(e.errorKey, e.errorSubs || []) : (e && e.message) || String(e), "error");
    }
  }

  async function handleLock(userId, btn) {
    const isCurrentlyLocked = btn.dataset.locked === "true";

    btn.disabled = true;
    btn.textContent = isCurrentlyLocked ? t("unlocking") : t("locking");

    try {
      await MatrixApi.lockUser(server.url, server.accessToken, userId, !isCurrentlyLocked);
      if (isCurrentlyLocked) {
        btn.className = "btn-lock";
        btn.textContent = t("lock");
        btn.dataset.locked = "false";
      } else {
        btn.className = "btn-unlock";
        btn.textContent = t("unlock");
        btn.dataset.locked = "true";
      }
      showStatus(isCurrentlyLocked ? t("unlockedSuccess", [userId]) : t("lockedSuccess", [userId]), "success");
    } catch (e) {
      btn.textContent = isCurrentlyLocked ? t("unlock") : t("lock");
      showStatus(e && e.errorKey ? t(e.errorKey, e.errorSubs || []) : (e && e.message) || String(e), "error");
    } finally {
      btn.disabled = false;
    }
  }

  async function handleRemove(userId, row, btn) {
    if (!confirm(t("removeConfirm", [userId]))) return;

    btn.disabled = true;
    btn.textContent = t("removing");

    try {
      const result = await MatrixApi.removeUser(server.url, server.accessToken, userId);
      row.querySelector("td:first-child").classList.add("deactivated");
      row.querySelector("td:nth-child(2)").classList.add("deactivated");
      const lastTd = row.querySelector("td:last-child");
      while (lastTd.firstChild) lastTd.firstChild.remove();
      const span = document.createElement("span");
      span.textContent = t("deactivated");
      lastTd.appendChild(span);
      const mediaMsg = result.media_deleted > 0 ? t("mediaDeleted", [result.media_deleted]) : "";
      showStatus(t("removeSuccess", [userId]) + mediaMsg, "success");
    } catch (e) {
      btn.disabled = false;
      btn.textContent = t("remove");
      showStatus(e && e.errorKey ? t(e.errorKey, e.errorSubs || []) : (e && e.message) || String(e), "error");
    }
  }

  async function init() {
    if (!serverId) {
      showStatus(t("noServerSpecified"), "error");
      return;
    }

    const servers = await Storage.getServers();
    server = servers.find(s => s.id === serverId);

    if (!server) {
      showStatus(t("serverNotFound"), "error");
      return;
    }

    const titleText = t("manageUsersTitle", [server.domain]);
    if (pageTitleDoc) pageTitleDoc.textContent = titleText;
    const pageTitleHead = document.getElementById("page-title-heading");
    if (pageTitleHead) pageTitleHead.textContent = titleText;

    try {
      currentUserId = await MatrixApi.whoami(server.url, server.accessToken);
    } catch (_) {
      currentUserId = null;
    }
    await loadUsers();
  }

  I18n.applyDocument();

  btnLoadMore.addEventListener("click", loadUsers);
  init();
})();
