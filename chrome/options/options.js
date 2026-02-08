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
    while (serverList.firstChild) serverList.firstChild.remove();
    if (servers.length === 0) {
      const row = document.createElement("tr");
      const td = document.createElement("td");
      td.setAttribute("colspan", "3");
      td.textContent = "No servers added yet.";
      row.appendChild(td);
      serverList.appendChild(row);
      return;
    }
    servers.forEach(server => {
      const row = document.createElement("tr");

      const tdUrl = document.createElement("td");
      tdUrl.textContent = server.url;
      row.appendChild(tdUrl);

      const tdDomain = document.createElement("td");
      tdDomain.textContent = server.domain;
      row.appendChild(tdDomain);

      const tdActions = document.createElement("td");
      const btnEdit = document.createElement("button");
      btnEdit.className = "btn-edit";
      btnEdit.textContent = "Edit";
      btnEdit.addEventListener("click", () => handleEdit(server.id));
      const btnDel = document.createElement("button");
      btnDel.className = "btn-delete";
      btnDel.textContent = "Delete";
      btnDel.addEventListener("click", () => handleDelete(server.id));
      tdActions.appendChild(btnEdit);
      tdActions.appendChild(btnDel);
      row.appendChild(tdActions);

      serverList.appendChild(row);
    });
  }

  async function handleEdit(id) {
    const servers = await Storage.getServers();
    const server = servers.find(s => s.id === id);
    if (!server) return;
    editingId = id;
    showForm("Edit Server", server.domain);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this server?")) return;
    await Storage.deleteServer(id);
    await renderServers();
  }

  async function handleSave() {
    const domain = inputUrl.value.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
    const username = inputUsername.value.trim();
    const password = inputPassword.value;

    if (!domain || !username || !password) {
      showMessage("All fields are required.", true);
      return;
    }

    const fullUsername = `@${username}:${domain}`;

    btnSave.disabled = true;
    btnSave.textContent = "Requesting permission...";

    try {
      const granted = await chrome.permissions.request({
        origins: [`https://${domain}/*`]
      });
      if (!granted) {
        showMessage("Permission denied. Cannot connect to server.", true);
        btnSave.disabled = false;
        btnSave.textContent = "Save";
        return;
      }

      btnSave.textContent = "Discovering server...";
      const serverUrl = await MatrixApi.discoverServer(domain);

      const serverHost = new URL(serverUrl).hostname;
      if (serverHost !== domain) {
        const granted2 = await chrome.permissions.request({
          origins: [`https://${serverHost}/*`]
        });
        if (!granted2) {
          showMessage(`Permission denied for ${serverHost}.`, true);
          btnSave.disabled = false;
          btnSave.textContent = "Save";
          return;
        }
      }

      btnSave.textContent = "Connecting...";
      const accessToken = await MatrixApi.login(serverUrl, fullUsername, password);

      if (editingId) {
        await Storage.updateServer(editingId, { url: serverUrl, domain, accessToken });
      } else {
        await Storage.addServer({
          id: Storage.generateId(),
          url: serverUrl,
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
