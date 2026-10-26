(() => {
  const privateMessagePrefix = /^\s*[(（]\s*\d[\d,]*\+?\s*封私信\s*[)）]\s*/u;
  let observedHead = null;

  function cleanTitle() {
    const title = document.title;
    const clean = title.replace(privateMessagePrefix, '');

    // Avoid rewriting an unchanged title and triggering our own observer again.
    if (clean !== title) document.title = clean;
  }

  const titleObserver = new MutationObserver(cleanTitle);

  function watchHead() {
    if (document.head !== observedHead) {
      titleObserver.disconnect();
      observedHead = document.head;
      if (observedHead) {
        titleObserver.observe(observedHead, {
          childList: true,
          characterData: true,
          subtree: true
        });
      }
    }
    cleanTitle();
  }

  // At document_start the head may not exist yet; also handle its replacement.
  new MutationObserver(watchHead).observe(document.documentElement, { childList: true });
  watchHead();
})();
