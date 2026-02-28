const Storage = {
  async getServers() {
    const data = await chrome.storage.local.get("servers");
    return data.servers || [];
  },

  async saveServers(servers) {
    await chrome.storage.local.set({ servers });
  },

  async addServer(server) {
    const servers = await this.getServers();
    servers.push(server);
    await this.saveServers(servers);
  },

  async updateServer(id, updates) {
    const servers = await this.getServers();
    const index = servers.findIndex(s => s.id === id);
    if (index === -1) {
      const err = new Error("Server not found");
      err.errorKey = "errServerNotFound";
      err.errorSubs = [];
      throw err;
    }
    servers[index] = { ...servers[index], ...updates };
    await this.saveServers(servers);
  },

  async deleteServer(id) {
    const servers = await this.getServers();
    await this.saveServers(servers.filter(s => s.id !== id));
  },

  generateId() {
    return crypto.randomUUID();
  }
};
