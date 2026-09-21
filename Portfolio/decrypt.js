(function () {
  var CHARS = "!<>-_\\/[]{}=+*^?#01";

  function getTextNodes(el) {
    var nodes = [];
    function walk(node) {
      node.childNodes.forEach(function (child) {
        if (child.nodeType === Node.TEXT_NODE) {
          if (child.nodeValue.trim().length > 0) {
            nodes.push(child);
          }
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
          walk(child);
        }
      });
    }
    walk(el);
    return nodes;
  }

  function scrambleText(el) {
    var prefersReducedMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var textNodes = getTextNodes(el);
    if (!textNodes.length) return;

    var originals = textNodes.map(function (n) {
      return n.nodeValue;
    });

    if (prefersReducedMotion) {
      textNodes.forEach(function (n, i) {
        n.nodeValue = originals[i];
      });
      return;
    }

    var flatLength = originals.reduce(function (sum, s) {
      return sum + s.length;
    }, 0);
    if (!flatLength) return;

    // Fixed overall duration regardless of how much text this element
    // holds, so a whole bullet-list paragraph resolves about as fast
    // as a short heading rather than taking forever.
    var totalFrames = Math.max(28, Math.min(90, flatLength * 0.55));
    var lastFrame = totalFrames + 4;
    var frame = 0;

    function revealFrameFor(flatIndex) {
      return Math.floor((flatIndex / flatLength) * totalFrames);
    }

    function tick() {
      var flatIndex = 0;
      for (var t = 0; t < textNodes.length; t++) {
        var orig = originals[t];
        var out = "";
        for (var c = 0; c < orig.length; c++) {
          var ch = orig[c];
          if (ch === " " || ch === "\n" || ch === "\t") {
            out += ch;
          } else if (frame >= revealFrameFor(flatIndex)) {
            out += ch;
          } else {
            out += CHARS[Math.floor(Math.random() * CHARS.length)];
          }
          flatIndex++;
        }
        textNodes[t].nodeValue = out;
      }
      frame++;
      if (frame <= lastFrame) {
        requestAnimationFrame(tick);
      } else {
        textNodes.forEach(function (n, i) {
          n.nodeValue = originals[i];
        });
      }
    }
    tick();
  }

  function init() {
    var targets = document.querySelectorAll(".decrypt");
    if (!targets.length) return;

    var revealed = new WeakSet();

    if (!("IntersectionObserver" in window)) {
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !revealed.has(entry.target)) {
            revealed.add(entry.target);
            scrambleText(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();