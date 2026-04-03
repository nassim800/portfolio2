/* =========================================================
   Portfolio 2026 JS — light, accessible interactions
   - Theme toggle (persisted)
   - Mobile nav
   - Scrollspy
   - Reveal on scroll
   - Project modal (accessible-ish)
   - To-top button
   ========================================================= */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- Theme ---------- */
(function initTheme() {
  const stored = localStorage.getItem("theme");
  const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;

  const initial = stored || (prefersLight ? "light" : "dark");
  document.documentElement.dataset.theme = initial;

  const btn = $("#themeToggle");
  if (btn) btn.setAttribute("aria-pressed", String(initial === "light"));

  btn?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
    btn.setAttribute("aria-pressed", String(next === "light"));
  });
})();

/* ---------- Footer year ---------- */
$("#year").textContent = String(new Date().getFullYear());

/* ---------- Mobile nav ---------- */
(function initNav() {
  const toggle = $("#navToggle");
  const menu = $("#navMenu");
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  };

  toggle.addEventListener("click", () => setOpen(!menu.classList.contains("is-open")));

  // Close on link click (mobile)
  $$(".nav-link", menu).forEach(link => {
    link.addEventListener("click", () => setOpen(false));
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    const isClickInside = menu.contains(e.target) || toggle.contains(e.target);
    if (!isClickInside) setOpen(false);
  });
})();

/* ---------- Scrollspy ---------- */
(function initScrollSpy() {
  const links = $$(".nav-link");
  const sections = links
    .map(a => $(a.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length) return;

  const setActive = (id) => {
    links.forEach(a => {
      const isActive = a.getAttribute("href") === `#${id}`;
      if (isActive) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  };

  const io = new IntersectionObserver((entries) => {
    // choose the most visible entry
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visible?.target?.id) setActive(visible.target.id);
  }, {
    root: null,
    threshold: [0.25, 0.5, 0.75],
    rootMargin: "-20% 0px -60% 0px"
  });

  sections.forEach(sec => io.observe(sec));
})();

/* ---------- Reveal on scroll ---------- */
(function initReveal() {
  const items = $$(".reveal");
  if (!items.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  }, { threshold: 0.12 });

  items.forEach(el => io.observe(el));
})();

/* ---------- To top button ---------- */
(function initToTop() {
  const btn = $("#toTop");
  if (!btn) return;

  const onScroll = () => {
    btn.classList.toggle("is-visible", window.scrollY > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
})();

/* ---------- Project modal ---------- */
(function initModal() {
  const modal = $("#projectModal");
  if (!modal) return;

  const titleEl = $("#modalTitle");
  const descEl = $("#modalDesc");
  const stackEl = $("#modalStack");
  const highlightsEl = $("#modalHighlights");
  const linkEl = $("#modalLink");

  let lastFocus = null;

  const open = (data, opener) => {
    lastFocus = opener || document.activeElement;

    titleEl.textContent = data.title || "Projet";
    descEl.textContent = data.desc || "";
    stackEl.textContent = data.stack || "—";
    highlightsEl.textContent = data.highlights || "—";

    const href = data.link && data.link !== "#" ? data.link : null;
    if (href) {
      linkEl.href = href;
      linkEl.style.display = "";
    } else {
      linkEl.style.display = "none";
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    // Focus first close button for accessibility
    const closeBtn = $('[data-modal-close]', modal);
    closeBtn?.focus();
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  };

  // Open triggers
  $$("[data-modal-open]").forEach(btn => {
    btn.addEventListener("click", () => {
      const data = {
        title: btn.dataset.projectTitle,
        desc: btn.dataset.projectDesc,
        stack: btn.dataset.projectStack,
        highlights: btn.dataset.projectHighlights,
        link: btn.dataset.projectLink
      };
      open(data, btn);
    });
  });

  // Close triggers
  $$("[data-modal-close]", modal).forEach(el => el.addEventListener("click", close));

  // ESC closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) close();
  });

  // Basic focus trap
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    if (!modal.classList.contains("is-open")) return;

    const focusables = $$('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])', modal)
      .filter(el => !el.hasAttribute("disabled") && el.offsetParent !== null);

    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
})();

/* ---------- Project detail accordions ---------- */
(function initProjToggle() {
  $$(".proj-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("aria-controls");
      const panel = document.getElementById(targetId);
      if (!panel) return;

      const isOpen = btn.getAttribute("aria-expanded") === "true";

      if (isOpen) {
        btn.setAttribute("aria-expanded", "false");
        btn.querySelector(".proj-toggle-label").textContent = "Voir les détails";
        panel.classList.remove("is-open");
      } else {
        btn.setAttribute("aria-expanded", "true");
        btn.querySelector(".proj-toggle-label").textContent = "Masquer les détails";
        panel.classList.add("is-open");
      }
    });
  });
})();
