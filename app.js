import { calculate, holdingDays } from "./calculator.js";

const titles = { nav: "净值变化", profit: "本金与收益", rate: "区间收益率" };
const pages = {
  calculator: ["年化收益计算器", "从一段时间的净值或收益出发，轻松换算年化收益率。"],
  history: ["计算记录", "保留每一次计算，在相同口径下比较不同产品。"],
  guide: ["计算说明", "清楚的计算口径，是比较投资产品的第一步。"],
};
const storageKey = "annual-return-records-v1";
const byId = (id) => document.getElementById(id);
const form = byId("investment-form");
const fmt = (value, digits = 2) => value.toLocaleString("zh-CN", {
  minimumFractionDigits: digits, maximumFractionDigits: digits,
});
const pct = (value) => `${value > 0 ? "+" : ""}${fmt(value)}%`;
function date(offset = 0) {
  const value = new Date();
  value.setDate(value.getDate() + offset);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}
function defaults() {
  return {
    mode: "nav", principal: "10000", startNav: "1.0000", endNav: "1.0250",
    profit: "250", rate: "2.5", fees: false, subscription: "0", redemption: "0",
    period: "days", startDate: date(-90), endDate: date(), days: "90",
  };
}
function loadRecords() {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(data)) return [];
    return data.slice(0, 50).flatMap((item) => {
      try {
        if (typeof item?.id !== "string" || typeof item.name !== "string" ||
            !["compound", "simple"].includes(item.method) ||
            !Object.hasOwn(titles, item.inputs?.mode)) return [];
        return [{ ...item, result: calculate(item.inputs) }];
      } catch { return []; }
    });
  } catch { return []; }
}
let inputs = defaults();
let method = "compound";
let result = null;
let saved = false;
let records = loadRecords();

function notice(message = "") {
  for (const id of ["calculator-notice", "history-notice"]) {
    byId(id).textContent = message;
    byId(id).hidden = !message;
  }
}
function showPage(page) {
  for (const key of Object.keys(pages)) byId(`${key}-page`).hidden = key !== page;
  document.querySelectorAll("nav [data-page]").forEach((button) => {
    const active = button.dataset.page === page;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  [byId("page-title").textContent, byId("page-description").textContent] = pages[page];
  notice();
}
function selectButtons(attribute, value, className) {
  document.querySelectorAll(`[data-${attribute}]`).forEach((button) => {
    const selected = button.dataset[attribute] === value;
    button.classList.toggle(className, selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}
function fillForm(name = "") {
  for (const [key, value] of Object.entries(inputs)) {
    const field = form.elements.namedItem(key);
    if (!field) continue;
    if (field.type === "checkbox") field.checked = value;
    else field.value = value;
  }
  form.elements.namedItem("name").value = name;
}
function render() {
  document.querySelectorAll("[data-modes]").forEach((element) => {
    element.hidden = !element.dataset.modes.split(" ").includes(inputs.mode);
  });
  byId("days-fields").hidden = inputs.period !== "days";
  byId("dates-fields").hidden = inputs.period !== "dates";
  byId("fee-fields").hidden = !inputs.fees;
  selectButtons("mode", inputs.mode, "selected");
  selectButtons("period", inputs.period, "on");
  selectButtons("method", method, "on");
  selectButtons("days", String(Number(inputs.days)), "chosen");
  let days = 0;
  try { days = holdingDays(inputs); } catch {}
  byId("holding-days").textContent = days ? `实际持有 ${days} 天` : "请输入持有时间";
  let error = "";
  try { result = calculate(inputs); }
  catch (cause) { result = null; error = cause.message || "请检查输入"; }
  byId("error").textContent = error;
  byId("error").hidden = !error;
  byId("result-status").textContent = result ? "实时计算" : "等待输入";
  byId("annual-result").textContent = result ? pct(result[method]) : "—";
  byId("annual-result").classList.toggle("negative", result?.[method] < 0);
  byId("result-caption").textContent = method === "compound" ? "按收益再投资的复利口径折算" : "按收益不再投资的单利口径折算";
  byId("total-result").textContent = result ? pct(result.total) : "—";
  byId("total-result").className = result?.total < 0 ? "negative" : "positive";
  byId("days-result").textContent = result ? `${fmt(result.days, 0)} 天` : "—";
  byId("profit-result").textContent = result?.profit != null ? `${result.profit > 0 ? "+" : ""}${fmt(result.profit)} 元` : "—";
  byId("ending-result").textContent = result?.ending != null ? `${fmt(result.ending)} 元` : "—";
  byId("fee-result").textContent = result ? `${fmt(result.fee)} 元` : "—";
  byId("formula").textContent = method === "compound" ? "(1 + 区间收益率) ^ (365 / 持有天数) − 1" : "区间收益率 × (365 / 持有天数)";
  byId("save").disabled = !result || saved;
  byId("save").textContent = saved ? "已保存到计算记录" : "保存本次计算";
}
function changed() {
  saved = false;
  notice();
  render();
}
function persist(next) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(next));
    records = next;
    renderHistory();
    return true;
  } catch {
    notice("浏览器存储不可用，记录未更新。");
    return false;
  }
}
function renderHistory() {
  byId("record-count").textContent = records.length || "";
  byId("history-count").textContent = `${records.length} 条`;
  byId("empty-history").hidden = records.length > 0;
  byId("history-table").hidden = records.length === 0;
  const rows = records.map((record) => {
    const row = document.createElement("tr");
    const name = row.insertCell();
    const strong = document.createElement("strong");
    strong.textContent = record.name;
    const small = document.createElement("small");
    small.textContent = `${titles[record.inputs.mode]} · ${record.method === "compound" ? "复利" : "单利"}`;
    name.append(strong, small);
    row.insertCell().textContent = `${record.result.days} 天`;
    row.insertCell().textContent = pct(record.result.total);
    const annual = row.insertCell();
    annual.textContent = pct(record.result[record.method]);
    annual.className = record.result[record.method] < 0 ? "negative" : "positive";
    const actions = document.createElement("div");
    actions.className = "row-actions";
    const load = document.createElement("button");
    load.className = "text-button";
    load.textContent = "载入";
    load.addEventListener("click", () => {
      inputs = { ...defaults(), ...record.inputs };
      method = record.method;
      fillForm(record.name);
      changed();
      showPage("calculator");
    });
    const remove = document.createElement("button");
    remove.textContent = "删除";
    remove.setAttribute("aria-label", `删除 ${record.name}`);
    remove.addEventListener("click", () => {
      if (persist(records.filter((item) => item.id !== record.id))) {
        saved = false;
        render();
        notice("记录已删除。");
      }
    });
    actions.append(load, remove);
    row.insertCell().append(actions);
    return row;
  });
  byId("records").replaceChildren(...rows);
}
form.addEventListener("submit", (event) => event.preventDefault());
form.addEventListener("input", (event) => {
  const field = event.target;
  if (!field.name) return;
  if (field.name !== "name") inputs[field.name] = field.type === "checkbox" ? field.checked : field.value;
  changed();
});
document.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => showPage(button.dataset.page)));
for (const attribute of ["mode", "period", "method", "days"]) {
  document.querySelectorAll(`[data-${attribute}]`).forEach((button) => button.addEventListener("click", () => {
    if (attribute === "method") method = button.dataset.method;
    else inputs[attribute] = button.dataset[attribute];
    if (attribute === "days") form.elements.namedItem("days").value = inputs.days;
    changed();
  }));
}
byId("reset").addEventListener("click", () => {
  inputs = defaults();
  fillForm();
  changed();
});
byId("save").addEventListener("click", () => {
  if (!result || saved) return;
  const record = {
    id: crypto.randomUUID(),
    name: form.elements.namedItem("name").value.trim() || `${titles[inputs.mode]} · ${date()}`,
    inputs: { ...inputs }, method, result,
  };
  if (persist([record, ...records].slice(0, 50))) {
    saved = true;
    render();
    notice("已保存，可在计算记录中查看和重新载入。");
  }
});
fillForm();
render();
renderHistory();
