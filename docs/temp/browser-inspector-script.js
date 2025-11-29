// Cryptorafts Element Inspector Script
// Run this in F12 Console. Then click the logo, then click the purple graphic.
// After clicks, check window._CR_clickedElements for both reports.

(() => {
  if (!window._CR_clickedElements) window._CR_clickedElements = [];

  console.log("%cCryptorafts Inspector ready — click the logo, then the purple graphic.", "color:teal;font-weight:bold");

  const describe = el => {
    if (!el) return null;

    const cs = getComputedStyle(el);
    const bbox = el.getBoundingClientRect();

    const selector = (() => {
      if (el.id) return `#${el.id}`;
      if (el.className && typeof el.className === "string") return `${el.tagName.toLowerCase()}.${el.className.trim().split(/\s+/).join('.')}`;
      return el.tagName.toLowerCase();
    })();

    return {
      timestamp: new Date().toString(),
      selector,
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: el.className ? el.className.trim().split(/\s+/) : [],
      outerHTML: el.outerHTML.slice(0, 1000),
      boundingClientRect: {
        top: Math.round(bbox.top), left: Math.round(bbox.left),
        width: Math.round(bbox.width), height: Math.round(bbox.height),
        bottom: Math.round(bbox.bottom), right: Math.round(bbox.right)
      },
      computed: {
        display: cs.display,
        position: cs.position,
        visibility: cs.visibility,
        zIndex: cs.zIndex,
        pointerEvents: cs.pointerEvents,
        opacity: cs.opacity,
        width: cs.width,
        height: cs.height,
        overflow: cs.overflow
      },
      nearestPositionedAncestor: (() => {
        let cur = el.parentElement;
        while (cur) {
          const p = getComputedStyle(cur).position;
          if (p && p !== "static") return { tag: cur.tagName.toLowerCase(), id: cur.id||null, classes: cur.className||null, position: p };
          cur = cur.parentElement;
        }
        return null;
      })()
    };
  };

  function clickHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    const el = e.target;
    const rep = describe(el);
    window._CR_clickedElements.push(rep);
    console.groupCollapsed(`%cCaptured element: ${rep.selector}`, "color:purple;font-weight:bold");
    console.log("Tag:", rep.tag, "ID:", rep.id, "Classes:", rep.classes);
    console.log("Bounding rect:", rep.boundingClientRect);
    console.log("Computed styles:", rep.computed);
    console.log("Nearest positioned ancestor:", rep.nearestPositionedAncestor);
    console.log("OuterHTML (truncated):", rep.outerHTML);
    console.groupEnd();

    // visually highlight clicked element briefly
    const oldOutline = el.style.outline;
    el.style.outline = "3px solid rgba(255,165,0,0.9)";
    setTimeout(()=> el.style.outline = oldOutline, 2000);

    // If we have two captures, remove listener automatically
    if (window._CR_clickedElements.length >= 2) {
      console.log("%cCaptured two elements. Listener removed. Inspect window._CR_clickedElements for results.", "color:green;font-weight:bold");
      console.log("%cTo copy results, run: copy(window._CR_clickedElements)", "color:cyan;font-weight:bold");
      window.removeEventListener("click", clickHandler, true);
    } else {
      console.log("%cClick the second element now (purple graphic).", "color:orange;font-weight:bold");
    }
  }

  // Use capture phase so clicks are captured even if site stops propagation
  window.addEventListener("click", clickHandler, true);

  // safety: remove listener after 30s if not used
  setTimeout(()=> {
    if (window._CR_clickedElements.length < 2) {
      window.removeEventListener("click", clickHandler, true);
      console.log("%cInspector timed out after 30s. Rerun the snippet to try again.", "color:gray");
    }
  }, 30000);
})();

