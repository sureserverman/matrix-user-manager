const Nav = {
  openApp() {
    window.location.href = browser.runtime.getURL("app/app.html");
  },

  openSettings() {
    window.location.href = browser.runtime.getURL("options/options.html");
  },

  openManage(serverId) {
    window.location.href = browser.runtime.getURL("manage/manage.html?server=" + encodeURIComponent(serverId));
  }
};
