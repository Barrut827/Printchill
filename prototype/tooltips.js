export function installTooltips() {
  const box = document.createElement("div");
  box.id = "prc-tooltip";
  box.role = "tooltip";
  box.hidden = true;
  document.body.append(box);
  let trigger = null,
    timer,
    hideTimer,
    dismissed = null;
  const hide = () => {
    clearTimeout(timer);
    if (trigger) trigger.removeAttribute("aria-describedby");
    box.hidden = true;
    trigger = null;
  };
  const show = (el) => {
    if (!el?.isConnected || dismissed === el) return;
    hide();
    trigger = el;
    box.textContent = el.dataset.tip;
    box.hidden = false;
    el.setAttribute("aria-describedby", box.id);
    const r = el.getBoundingClientRect(),
      w = box.offsetWidth,
      h = box.offsetHeight;
    box.style.left =
      Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) +
      "px";
    box.style.top =
      (r.top > h + 14
        ? r.top - h - 8
        : Math.min(innerHeight - h - 8, r.bottom + 8)) + "px";
  };
  const scheduleHide = () => {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (
        trigger &&
        (trigger.matches(":hover") ||
          box.matches(":hover") ||
          document.activeElement === trigger)
      )
        return;
      hide();
    }, 140);
  };
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType === "touch") return;
    const el = e.target.closest("[data-tip]");
    if (!el) return;
    clearTimeout(hideTimer);
    clearTimeout(timer);
    if (dismissed !== el) timer = setTimeout(() => show(el), 250);
  });
  document.addEventListener("pointerout", (e) => {
    if (e.target.closest("[data-tip]")) {
      dismissed = null;
      scheduleHide();
    }
  });
  document.addEventListener("focusin", (e) => {
    const el = e.target.closest("[data-tip]");
    if (el) show(el);
    else hide();
  });
  document.addEventListener("focusout", (e) => {
    if (e.target.closest("[data-tip]")) {
      dismissed = null;
      scheduleHide();
    }
  });
  box.addEventListener("pointerenter", () => clearTimeout(hideTimer));
  box.addEventListener("pointerleave", scheduleHide);
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && !box.hidden) {
        e.preventDefault();
        e.stopPropagation();
        dismissed = trigger;
        hide();
      }
    },
    true,
  );
  document.addEventListener("click", () => {
    if (trigger && !trigger.isConnected) hide();
  });
  new MutationObserver(() => {
    if (trigger && !trigger.isConnected) hide();
  }).observe(document.querySelector("#app"), {
    childList: true,
    subtree: true,
  });
}
