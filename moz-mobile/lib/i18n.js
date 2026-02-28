const I18n = {
  getMessage(key, substitutions = []) {
    return browser.i18n.getMessage(key, substitutions) || key;
  },
  applyDocument() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const msg = this.getMessage(key);
      if (el.hasAttribute("data-i18n-placeholder")) {
        el.placeholder = msg;
      } else {
        el.textContent = msg;
      }
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (key && !el.hasAttribute("data-i18n")) el.placeholder = this.getMessage(key);
    });
  }
};
