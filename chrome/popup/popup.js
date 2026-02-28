(function () {
  const serverListEl = document.getElementById("server-list");
  const emptyState = document.getElementById("empty-state");

  function t(key, subs) {
    if (subs !== undefined) subs = Array.isArray(subs) ? subs : [subs];
    return chrome.i18n.getMessage(key, subs) || key;
  }

  function reloadManageTabIfOpen(serverId) {
    const manageUrl = chrome.runtime.getURL("manage/manage.html?server=" + encodeURIComponent(serverId));
    chrome.tabs.query({ url: manageUrl }, (tabs) => {
      tabs.forEach((tab) => { if (tab.id) chrome.tabs.reload(tab.id); });
    });
  }

  function createInput(type, className, placeholderKey) {
    const input = document.createElement("input");
    input.type = type;
    input.className = className;
    if (placeholderKey) input.placeholder = t(placeholderKey);
    return input;
  }

  function createButton(className, textKey) {
    const btn = document.createElement("button");
    btn.className = className;
    btn.textContent = t(textKey);
    return btn;
  }

  async function render() {
    const servers = await Storage.getServers();
    while (serverListEl.firstChild) serverListEl.firstChild.remove();

    if (servers.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");

    servers.forEach(server => {
      const card = document.createElement("div");
      card.className = "server-card";

      const header = document.createElement("div");
      header.className = "server-header";
      const urlSpan = document.createElement("span");
      urlSpan.className = "server-url";
      urlSpan.textContent = server.url;
      header.appendChild(urlSpan);

      const buttonsDiv = document.createElement("div");
      buttonsDiv.className = "server-buttons";
      const btnAddUser = createButton("btn-add-user", "addUser");
      btnAddUser.addEventListener("click", () => {
        formContainer.classList.toggle("hidden");
      });
      const btnManage = createButton("btn-manage-users", "manage");
      btnManage.addEventListener("click", () => {
        chrome.tabs.create({
          url: chrome.runtime.getURL("manage/manage.html?server=" + encodeURIComponent(server.id))
        });
      });
      buttonsDiv.appendChild(btnAddUser);
      buttonsDiv.appendChild(btnManage);
      header.appendChild(buttonsDiv);
      card.appendChild(header);

      const domainDiv = document.createElement("div");
      domainDiv.className = "server-domain";
      domainDiv.textContent = server.domain;
      card.appendChild(domainDiv);

      const formContainer = document.createElement("div");
      formContainer.className = "user-form-container hidden";
      const userForm = document.createElement("div");
      userForm.className = "user-form";

      const labelUser = document.createElement("label");
      labelUser.textContent = t("username");
      const inputUser = createInput("text", "input-username", "usernamePlaceholder");
      labelUser.appendChild(inputUser);
      userForm.appendChild(labelUser);

      const labelPass = document.createElement("label");
      labelPass.textContent = t("password");
      const inputPass = createInput("password", "input-password");
      labelPass.appendChild(inputPass);
      userForm.appendChild(labelPass);

      const labelDisplay = document.createElement("label");
      labelDisplay.textContent = t("displayName");
      const inputDisplay = createInput("text", "input-displayname", "displayNamePlaceholder");
      labelDisplay.appendChild(inputDisplay);
      userForm.appendChild(labelDisplay);

      const formActions = document.createElement("div");
      formActions.className = "form-actions";
      const btnCreate = createButton("btn-create", "create");
      btnCreate.addEventListener("click", () => handleCreateUser(server.id, btnCreate, formContainer));
      const btnCancel = createButton("btn-cancel-user", "cancel");
      btnCancel.addEventListener("click", () => formContainer.classList.add("hidden"));
      formActions.appendChild(btnCreate);
      formActions.appendChild(btnCancel);
      userForm.appendChild(formActions);

      const messageEl = document.createElement("div");
      messageEl.className = "user-message hidden";
      userForm.appendChild(messageEl);

      formContainer.appendChild(userForm);
      card.appendChild(formContainer);

      serverListEl.appendChild(card);
    });
  }

  async function handleCreateUser(serverId, btn, formContainer) {
    const servers = await Storage.getServers();
    const server = servers.find(s => s.id === serverId);
    if (!server) return;

    const username = formContainer.querySelector(".input-username").value.trim();
    const password = formContainer.querySelector(".input-password").value;
    const displayname = formContainer.querySelector(".input-displayname").value.trim();
    const messageEl = formContainer.querySelector(".user-message");

    if (!username || !password || !displayname) {
      messageEl.textContent = t("allFieldsRequired");
      messageEl.className = "user-message msg-error";
      return;
    }

    btn.disabled = true;
    btn.textContent = t("creating");

    try {
      const result = await MatrixApi.createUser(
        server.url, server.accessToken, server.domain,
        username, password, displayname
      );
      messageEl.textContent = result.messageKey ? t(result.messageKey, result.messageSubs || []) : result.message;
      messageEl.className = result.success ? "user-message msg-success" : "user-message msg-error";
      if (result.success) {
        formContainer.querySelector(".input-username").value = "";
        formContainer.querySelector(".input-password").value = "";
        formContainer.querySelector(".input-displayname").value = "";
        reloadManageTabIfOpen(serverId);
      }
    } catch (e) {
      messageEl.textContent = e && e.errorKey ? t(e.errorKey, e.errorSubs || []) : (e && e.message) || String(e);
      messageEl.className = "user-message msg-error";
    } finally {
      btn.disabled = false;
      btn.textContent = t("create");
    }
  }

  I18n.applyDocument();

  document.getElementById("link-settings").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  const btnOpenSettings = document.getElementById("btn-open-settings");
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
  }

  render();
})();
