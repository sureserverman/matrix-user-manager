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
          <button class="btn-edit" data-id="${escapeHtml(server.id)}">Edit</button>
          <button class="btn-delete" data-id="${escapeHtml(server.id)}">Delete</button>
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
