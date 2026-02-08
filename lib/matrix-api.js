const MatrixApi = {
  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (e) {
      throw new Error("Invalid server URL");
    }
  },

  async login(serverUrl, username, password) {
    const url = `${serverUrl.replace(/\/+$/, "")}/_matrix/client/v3/login`;
    let response;
    try {
      response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "m.login.password",
        user: username,
        password: password
      })
      });
    } catch (e) {
      throw new Error("Cannot reach server. Check the URL and your network connection.");
    }

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
    let response;
    try {
      response = await fetch(url, {
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
    } catch (e) {
      throw new Error("Cannot reach server. Check your network connection.");
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Access token expired or invalid. Re-add the server in settings.");
      }
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Request failed (${response.status})`);
    }

    const status = response.status;
    const fullUserId = `@${username}:${domain}`;

    if (status === 201) {
      return { success: true, message: `User ${fullUserId} created` };
    } else if (status === 200) {
      return { success: true, message: `User ${fullUserId} updated` };
    }
    return { success: true, message: `User ${fullUserId} created` };
  }
};
