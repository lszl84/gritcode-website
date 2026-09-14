// Gritcode site: live release links, download thank-you, lazy autoplay videos.
(function () {
  var REPO = 'lszl84/gritcode';

  // Opened straight from disk (file://): folder links like "features/" would
  // show a directory listing, so point them at the folder's index.html.
  if (location.protocol === 'file:') {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var parts = a.getAttribute('href').split('#');
      var path = parts[0];
      if (!path || /^[a-z]+:/i.test(path)) return;
      if (path === '.' || path === '..' || path.slice(-1) === '/') {
        parts[0] = path.replace(/\/?$/, '/') + 'index.html';
        a.setAttribute('href', parts.join('#'));
      }
    });
  }

  // Point download buttons at the newest release assets. The static hrefs
  // in the HTML are a working fallback if the GitHub API is unreachable.
  var assetLinks = document.querySelectorAll('[data-asset]');
  var versionEls = document.querySelectorAll('[data-version]');
  if (assetLinks.length || versionEls.length) {
    fetch('https://api.github.com/repos/' + REPO + '/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' }
    })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (rel) {
        versionEls.forEach(function (el) { el.textContent = rel.tag_name; });
        assetLinks.forEach(function (a) {
          var ext = '.' + a.getAttribute('data-asset');
          var asset = (rel.assets || []).filter(function (x) {
            return x.name.toLowerCase().slice(-ext.length) === ext;
          })[0];
          if (!asset) return;
          a.href = asset.browser_download_url;
          var size = a.querySelector('[data-size]');
          if (size) size.textContent = (asset.size / 1e6).toFixed(1) + ' MB';
        });
      })
      .catch(function () {});
  }

  // After a download starts, gently mention sponsoring.
  var toast = document.getElementById('thanks');
  if (toast) {
    var timer;
    document.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('[data-asset]')) return;
      toast.hidden = false;
      clearTimeout(timer);
      timer = setTimeout(function () { toast.hidden = true; }, 15000);
    });
    toast.querySelector('.x').addEventListener('click', function () { toast.hidden = true; });
  }

  // Videos only download and play while on screen.
  var videos = document.querySelectorAll('video[data-autoplay]');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    videos.forEach(function (v) { v.controls = true; v.preload = 'metadata'; });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) {
          var p = v.play();
          if (p && p.catch) p.catch(function () { v.controls = true; });
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.3 });
    videos.forEach(function (v) { io.observe(v); });
  }
})();
