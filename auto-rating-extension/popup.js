let selectedLevel = 4;

const statusBox = document.getElementById("statusBox");
const selectBtn = document.getElementById("selectBtn");
const panelBtn = document.getElementById("panelBtn");
const testBtn = document.getElementById("testBtn");
const clearBtn = document.getElementById("clearBtn");
const rateButtons = [...document.querySelectorAll(".rate-btn")];

function setStatus(message, type = "") {
  statusBox.className = "status" + (type ? " " + type : "");
  statusBox.innerHTML = message;
}

function setSelectedLevel(level) {
  selectedLevel = Number(level);
  rateButtons.forEach(btn => btn.classList.toggle("active", Number(btn.dataset.level) === selectedLevel));
  selectBtn.textContent = `⚡ Chọn mức ${selectedLevel} trên trang`;
}

rateButtons.forEach(btn => {
  btn.addEventListener("click", () => setSelectedLevel(btn.dataset.level));
});

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("Không tìm thấy tab hiện tại.");
  return tab;
}

async function runInPage(mode, level = selectedLevel) {
  const tab = await getActiveTab();

  const common = {
    target: { tabId: tab.id },
    func: pageAutoRatingTool,
    args: [mode, Number(level)]
  };

  try {
    const result = await chrome.scripting.executeScript({
      ...common,
      world: "MAIN"
    });
    return result?.[0]?.result;
  } catch (errMain) {
    try {
      const result = await chrome.scripting.executeScript(common);
      return result?.[0]?.result;
    } catch (errFallback) {
      throw new Error(errFallback?.message || errMain?.message || "Không chạy được script trên trang này.");
    }
  }
}

function resultToHtml(result) {
  if (!result) return "Không nhận được kết quả từ trang.";

  if (result.mode === "select") {
    return `
      <b>Đã thử chọn mức ${result.level}</b><br>
      Tìm thấy theo text: <b>${result.foundText}</b><br>
      DevExpress API: <b>${result.devExpress}</b><br>
      Radio/Label thường: <b>${result.nativeLabels}</b><br>
      Click theo text: <b>${result.textClick}</b><br>
      <span style="color:#6b7280">Nếu còn sót, kéo xuống phần chưa thấy rồi bấm lại.</span>
    `;
  }

  if (result.mode === "highlight") {
    return `Đã tô màu <b>${result.found}</b> dòng có lựa chọn mức <b>${result.level}</b>.`;
  }

  if (result.mode === "panel") {
    return "Đã hiện bảng nổi trên trang. Có thể bấm 0-4 ngay trên form.";
  }

  if (result.mode === "clear") {
    return "Đã xóa tô màu test.";
  }

  return JSON.stringify(result);
}

async function handleRun(mode) {
  setStatus("Đang chạy trên trang hiện tại...", "warn");

  try {
    const result = await runInPage(mode, selectedLevel);
    setStatus(resultToHtml(result), result?.error ? "error" : "success");
  } catch (err) {
    setStatus(
      `<b>Không chạy được.</b><br>${err.message}<br><br>` +
      `<span style="color:#6b7280">Lưu ý: extension không chạy trên chrome://, Chrome Web Store, file nội bộ bị chặn, hoặc trang chưa được cấp quyền.</span>`,
      "error"
    );
  }
}

selectBtn.addEventListener("click", () => handleRun("select"));
panelBtn.addEventListener("click", () => handleRun("panel"));
testBtn.addEventListener("click", () => handleRun("highlight"));
clearBtn.addEventListener("click", () => handleRun("clear"));

setSelectedLevel(4);

async function pageAutoRatingTool(mode, level) {
  if (!window.__AUTO_RATING_TOOL_STATE__) {
    window.__AUTO_RATING_TOOL_STATE__ = {
      highlighted: [],
      panel: null,
      style: null
    };
  }

  const state = window.__AUTO_RATING_TOOL_STATE__;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function norm(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function optionRegex(muc) {
    return new RegExp("^\\s*" + escRegex(muc) + "\\s*([:：\\.．。\\-–]|\\s|$)", "i");
  }

  function visible(el) {
    if (!el || el.nodeType !== 1) return false;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
    return String(value).replace(/(["'\\.#:[\],>+~*^$|=()])/g, "\\$1");
  }

  function fireClick(el, point) {
    if (!el) return false;

    const rect = el.getBoundingClientRect?.();
    const x = point?.x ?? (rect ? rect.left + rect.width / 2 : 0);
    const y = point?.y ?? (rect ? rect.top + rect.height / 2 : 0);

    const eventInit = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
      screenX: x,
      screenY: y,
      button: 0,
      buttons: 1
    };

    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
      try {
        if (type.startsWith("pointer") && typeof PointerEvent === "function") {
          el.dispatchEvent(new PointerEvent(type, eventInit));
        } else {
          el.dispatchEvent(new MouseEvent(type, eventInit));
        }
      } catch {}
    }

    try { el.click(); } catch {}
    return true;
  }

  function clearHighlights() {
    for (const item of state.highlighted) {
      try {
        item.el.style.outline = item.outline;
        item.el.style.background = item.background;
      } catch {}
    }

    state.highlighted = [];
    return { mode: "clear" };
  }

  function findTextOptions(muc) {
    const re = optionRegex(muc);
    const found = [];
    const seen = new Set();

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const text = norm(node.nodeValue);
          if (!text || !re.test(text)) return NodeFilter.FILTER_REJECT;

          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (parent.closest("#auto-rating-extension-panel, script, style, noscript")) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      let el = node.parentElement;
      if (!el || !visible(el)) continue;

      const label = el.closest("label");
      if (label && visible(label)) el = label;

      if (!seen.has(el)) {
        seen.add(el);
        found.push(el);
      }
    }

    return found;
  }

  function highlight(muc) {
    clearHighlights();
    const items = findTextOptions(muc);

    for (const el of items) {
      state.highlighted.push({
        el,
        outline: el.style.outline,
        background: el.style.background
      });
      el.style.outline = "2px solid #ef4444";
      el.style.background = "rgba(250, 204, 21, .28)";
    }

    return {
      mode: "highlight",
      level: muc,
      found: items.length
    };
  }

  function tryDevExpress(muc) {
    const re = optionRegex(muc);
    const controls = [];

    function addControl(control) {
      if (!control || controls.includes(control)) return;
      if (
        typeof control.GetItemCount === "function" &&
        typeof control.GetItem === "function" &&
        typeof control.SetSelectedIndex === "function"
      ) {
        controls.push(control);
      }
    }

    try {
      const collection = window.ASPxClientControl?.GetControlCollection?.();

      if (collection) {
        if (typeof collection.ForEachControl === "function") {
          collection.ForEachControl(control => addControl(control));
        }

        if (typeof collection.GetControlsByPredicate === "function") {
          const all = collection.GetControlsByPredicate(() => true);
          if (Array.isArray(all)) all.forEach(addControl);
        }

        for (const key of ["elements", "controls", "controlList"]) {
          const box = collection[key];
          if (!box) continue;

          if (Array.isArray(box)) {
            box.forEach(addControl);
          } else if (typeof box === "object") {
            Object.keys(box).forEach(k => addControl(box[k]));
          }
        }
      }
    } catch {}

    try {
      Object.keys(window).forEach(key => {
        try { addControl(window[key]); } catch {}
      });
    } catch {}

    let count = 0;

    for (const control of controls) {
      try {
        const itemCount = control.GetItemCount();

        for (let i = 0; i < itemCount; i++) {
          const item = control.GetItem(i);
          const text = norm(
            item?.text ??
            item?.name ??
            item?.value ??
            item?.GetText?.() ??
            ""
          );

          if (re.test(text)) {
            control.SetSelectedIndex(i);

            try {
              if (typeof control.SetValue === "function" && item?.value !== undefined) {
                control.SetValue(item.value);
              }
            } catch {}

            try { control.RaiseValueChangedEvent?.(); } catch {}
            count++;
            break;
          }
        }
      } catch {}
    }

    return count;
  }

  function tryNativeLabels(muc) {
    const re = optionRegex(muc);
    let count = 0;

    const labels = [...document.querySelectorAll("label")]
      .filter(label => !label.closest("#auto-rating-extension-panel"))
      .filter(label => re.test(norm(label.innerText || label.textContent)));

    for (const label of labels) {
      let input = null;

      const forId = label.getAttribute("for");
      if (forId) {
        input = document.getElementById(forId);
      }

      if (!input) {
        const area = label.closest("tr, li, td, div");
        input = area?.querySelector?.('input[type="radio"], input[type="checkbox"]');
      }

      if (input) {
        fireClick(input);
        try { input.checked = true; } catch {}
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        fireClick(label);
        count++;
      } else {
        fireClick(label);
        count++;
      }
    }

    return count;
  }

  async function tryTextClick(muc) {
    const options = findTextOptions(muc);
    let count = 0;

    for (const el of options) {
      if (!visible(el)) continue;

      el.scrollIntoView({ block: "center", inline: "center" });
      await sleep(28);

      const rect = el.getBoundingClientRect();
      const y = rect.top + rect.height / 2;
      const points = [
        { x: rect.left - 24, y },
        { x: rect.left + 5, y },
        { x: rect.left + rect.width / 2, y }
      ];

      let clicked = false;

      for (const point of points) {
        if (point.x < 0 || point.y < 0 || point.x > innerWidth || point.y > innerHeight) continue;

        const target = document.elementFromPoint(point.x, point.y);
        if (target && !target.closest("#auto-rating-extension-panel")) {
          fireClick(target, point);
          clicked = true;
        }
      }

      fireClick(el);
      if (clicked) count++;
      await sleep(15);
    }

    return count;
  }

  async function select(muc) {
    const foundText = findTextOptions(muc).length;
    const devExpress = tryDevExpress(muc);
    const nativeLabels = tryNativeLabels(muc);
    const textClick = await tryTextClick(muc);

    return {
      mode: "select",
      level: muc,
      foundText,
      devExpress,
      nativeLabels,
      textClick
    };
  }

  function ensurePanelStyle() {
    if (state.style && document.documentElement.contains(state.style)) return;

    const style = document.createElement("style");
    style.id = "auto-rating-extension-style";
    style.textContent = `
      #auto-rating-extension-panel {
        position: fixed;
        top: 82px;
        right: 22px;
        width: 270px;
        z-index: 2147483647;
        padding: 14px;
        border-radius: 18px;
        color: #111827;
        background: rgba(255,255,255,.96);
        border: 1px solid rgba(229,231,235,.9);
        box-shadow: 0 20px 60px rgba(17,24,39,.24);
        font-family: Inter, Arial, sans-serif;
        font-size: 13px;
        backdrop-filter: blur(12px);
      }
      #auto-rating-extension-panel * { box-sizing: border-box; }
      #auto-rating-extension-panel .ar-head {
        display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;
      }
      #auto-rating-extension-panel .ar-title { font-weight: 800; font-size: 15px; }
      #auto-rating-extension-panel .ar-sub { color:#6b7280; font-size:11px; margin-top:2px; }
      #auto-rating-extension-panel .ar-close {
        width:28px;height:28px;border:0;border-radius:10px;background:#f3f4f6;cursor:pointer;font-weight:900;
      }
      #auto-rating-extension-panel .ar-grid {
        display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin:10px 0;
      }
      #auto-rating-extension-panel .ar-rate {
        height:38px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;cursor:pointer;font-weight:800;color:#374151;
      }
      #auto-rating-extension-panel .ar-rate:hover { background:#eef2ff; border-color:#c7d2fe; }
      #auto-rating-extension-panel .ar-rate.main {
        color:white;border-color:transparent;background:linear-gradient(135deg,#2563eb,#7c3aed);
        box-shadow: 0 10px 22px rgba(37,99,235,.25);
      }
      #auto-rating-extension-panel .ar-actions { display:grid; grid-template-columns:1fr 1fr; gap:7px; }
      #auto-rating-extension-panel .ar-small {
        min-height:34px;border:1px solid #e5e7eb;border-radius:12px;background:white;cursor:pointer;font-weight:700;color:#374151;
      }
      #auto-rating-extension-panel .ar-status {
        margin-top:10px;padding:9px;border-radius:12px;background:#f9fafb;color:#4b5563;line-height:1.42;font-size:12px;
        border:1px solid #f3f4f6;
      }
      #auto-rating-extension-panel .ar-foot { margin-top:8px;color:#9ca3af;font-size:11px;line-height:1.35; }
    `;
    document.documentElement.appendChild(style);
    state.style = style;
  }

  function setPanelStatus(html) {
    const box = document.querySelector("#auto-rating-extension-panel .ar-status");
    if (box) box.innerHTML = html;
  }

  function injectPanel() {
    ensurePanelStyle();

    if (state.panel && document.documentElement.contains(state.panel)) {
      state.panel.style.display = state.panel.style.display === "none" ? "block" : "block";
      return { mode: "panel" };
    }

    const panel = document.createElement("div");
    panel.id = "auto-rating-extension-panel";
    panel.innerHTML = `
      <div class="ar-head">
        <div>
          <div class="ar-title">Auto Đánh Giá</div>
          <div class="ar-sub">Chọn theo text 0/1/2/3/4</div>
        </div>
        <button class="ar-close" title="Ẩn">×</button>
      </div>
      <div class="ar-grid">
        <button class="ar-rate" data-level="0">0</button>
        <button class="ar-rate" data-level="1">1</button>
        <button class="ar-rate" data-level="2">2</button>
        <button class="ar-rate" data-level="3">3</button>
        <button class="ar-rate main" data-level="4">4</button>
      </div>
      <div class="ar-actions">
        <button class="ar-small" data-action="test">Test mức 4</button>
        <button class="ar-small" data-action="clear">Xóa test</button>
      </div>
      <div class="ar-status">Bấm 0-4 để chọn nhanh trên trang.</div>
      <div class="ar-foot">Nếu form dài, kéo xuống phần chưa chọn rồi bấm lại.</div>
    `;

    panel.querySelector(".ar-close").addEventListener("click", () => {
      panel.style.display = "none";
    });

    panel.querySelectorAll(".ar-rate").forEach(button => {
      button.addEventListener("click", async () => {
        const muc = Number(button.dataset.level);
        panel.querySelectorAll(".ar-rate").forEach(b => b.classList.toggle("main", b === button));
        setPanelStatus("Đang chọn mức " + muc + "...");
        const result = await select(muc);
        setPanelStatus(
          "Mức <b>" + result.level + "</b><br>" +
          "Tìm thấy text: <b>" + result.foundText + "</b><br>" +
          "DevExpress: <b>" + result.devExpress + "</b> · " +
          "Label: <b>" + result.nativeLabels + "</b> · " +
          "Click: <b>" + result.textClick + "</b>"
        );
      });
    });

    panel.querySelector('[data-action="test"]').addEventListener("click", () => {
      const result = highlight(4);
      setPanelStatus("Đã tô màu <b>" + result.found + "</b> dòng mức 4.");
    });

    panel.querySelector('[data-action="clear"]').addEventListener("click", () => {
      clearHighlights();
      setPanelStatus("Đã xóa tô màu test.");
    });

    document.body.appendChild(panel);
    state.panel = panel;

    return { mode: "panel" };
  }

  if (mode === "select") return await select(level);
  if (mode === "highlight") return highlight(level);
  if (mode === "clear") return clearHighlights();
  if (mode === "panel") return injectPanel();

  return { error: true, message: "Unknown mode: " + mode };
}
