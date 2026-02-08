const MatrixApi = {
  async discoverServer(domain) {
    const wellKnownUrl = `https://${domain}/.well-known/matrix/client`;
    let response;
    try {
      response = await fetch(wellKnownUrl);
    } catch (e) {
      throw new Error(`Cannot reach ${domain}. Check the domain and your network connection.`);
    }
    if (!response.ok) {
      throw new Error(`No .well-known found at ${domain} (${response.status})`);
    }
    const data = await response.json().catch(() => ({}));
    const baseUrl = data["m.homeserver"] && data["m.homeserver"]["base_url"];
    if (!baseUrl) {
      throw new Error("Invalid .well-known response: missing m.homeserver base_url");
    }
    return baseUrl.replace(/\/+$/, "");
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
    const userId = `@${username}:${domain}`;
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
  },

  async listUsers(serverUrl, accessToken, from) {
    const params = new URLSearchParams({ from: from || "0", limit: "100", guests: "false" });
    const url = `${serverUrl.replace(/\/+$/, "")}/_synapse/admin/v2/users?${params}`;
    let response;
    try {
      response = await fetch(url, {
        headers: { "Authorization": `Bearer ${accessToken}` }
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
    return await response.json();
  },

  async deleteUserMedia(serverUrl, accessToken, userId) {
    const base = serverUrl.replace(/\/+$/, "");
    const listUrl = `${base}/_synapse/admin/v1/users/${userId}/media`;
    let response;
    try {
      response = await fetch(listUrl, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
    } catch (e) {
      throw new Error("Cannot reach server to list media.");
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Failed to list media (${response.status})`);
    }
    const data = await response.json();
    const mediaIds = (data.media || []).map(m => m.media_id);
    if (mediaIds.length === 0) return 0;

    const serverName = userId.split(":").slice(1).join(":");
    let deleted = 0;
    for (const mediaId of mediaIds) {
      const delUrl = `${base}/_synapse/admin/v1/media/${serverName}/${mediaId}`;
      try {
        const delResponse = await fetch(delUrl, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${accessToken}` }
        });
        if (delResponse.ok) deleted++;
      } catch (e) {
        // continue deleting remaining media
      }
    }
    return deleted;
  },

  async removeUser(serverUrl, accessToken, userId) {
    const mediaDeleted = await this.deleteUserMedia(serverUrl, accessToken, userId);

    const url = `${serverUrl.replace(/\/+$/, "")}/_synapse/admin/v1/deactivate/${userId}`;
    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ erase: true })
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
    const result = await response.json();
    result.media_deleted = mediaDeleted;
    return result;
  },

  async lockUser(serverUrl, accessToken, userId, locked) {
    const url = `${serverUrl.replace(/\/+$/, "")}/_synapse/admin/v2/users/${userId}`;
    let response;
    try {
      response = await fetch(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ locked: locked })
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
    return await response.json();
  }
};
