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
    return crypto.randomUUID();
  }
};
