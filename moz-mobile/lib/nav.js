const Nav = {
  openSettings() {
    browser.tabs.create({ url: browser.runtime.getURL("options/options.html") });
  }
};
