browser.browserAction.onClicked.addListener(function () {
  browser.tabs.create({ url: browser.runtime.getURL("app/app.html") });
});
