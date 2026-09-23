import { useState } from "preact/hooks";
import type { ComponentChildren } from "preact";
import {
  calculate,
  holdingDays,
  type Inputs,
  type Mode,
  type Result,
} from "./calculator";

const modes: { key: Mode; title: string; subtitle: string; icon: string }[] = [
  {
    key: "nav",
    title: "净值变化",
    subtitle: "基金、银行理财等净值型产品",
    icon: "chart",
  },
  {
    key: "profit",
    title: "本金与收益",
    subtitle: "存款、债券及已知收益的产品",
    icon: "wallet",
  },
  {
    key: "rate",
    title: "区间收益率",
    subtitle: "将已有收益率换算为年化",
    icon: "percent",
  },
];
const date = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const defaults = (): Inputs => ({
  mode: "nav",
  principal: "10000",
  startNav: "1.0000",
  endNav: "1.0250",
  profit: "250",
  rate: "2.5",
  fees: false,
  subscription: "0",
  redemption: "0",
  period: "days",
  startDate: date(-90),
  endDate: date(0),
  days: "90",
});
const fmt = (n: number, digits = 2) =>
  n.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
const pct = (n: number) => `${n > 0 ? "+" : ""}${fmt(n)}%`;
type RecordItem = {
  id: string;
  name: string;
  inputs: Inputs;
  method: "compound" | "simple";
  result: Result;
};
const storageKey = "annual-return-records-v1";
function loadRecords(): RecordItem[] {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(data)) return [];
    return data.slice(0, 50).flatMap((item) => {
      try {
        if (
          typeof item.id !== "string" ||
          typeof item.name !== "string" ||
          !["compound", "simple"].includes(item.method) ||
          !modes.some((m) => m.key === item.inputs?.mode)
        )
          return [];
        return [{ ...item, result: calculate(item.inputs) }];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ComponentChildren> = {
    chart: (
      <>
        <path d="M4 4v16h16" />
        <path d="m7 14 4-4 4 2 5-7" />
        <path d="M16 5h4v4" />
      </>
    ),
    wallet: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="3" />
        <path d="M3 9h18m-5 4h5m-15-8V3h12" />
      </>
    ),
    percent: (
      <>
        <path d="m6 18 12-12" />
        <circle cx="7" cy="7" r="2.5" />
        <circle cx="17" cy="17" r="2.5" />
      </>
    ),
    calculator: (
      <>
        <rect x="5" y="2" width="14" height="20" rx="3" />
        <path d="M8 6h8M8 11h1m6 0h1m-8 4h1m6 0h1m-8 4h1m6 0h1" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    book: (
      <>
        <path d="M12 5v16M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    save: (
      <>
        <path d="M5 3h12l3 3v15H4V3Zm3 0v6h8V3M8 21v-8h8v8" />
      </>
    ),
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    reset: (
      <>
        <path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.65"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.chart}
    </svg>
  );
}
function Field({
  label,
  value,
  onInput,
  suffix,
  type = "number",
  hint,
}: {
  label: string;
  value: string;
  onInput: (v: string) => void;
  suffix?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <label class="field">
      <span>{label}</span>
      <div class="input-wrap">
        <input
          type={type}
          step="any"
          value={value}
          onInput={(e) => onInput(e.currentTarget.value)}
          required
        />
        {suffix && <span>{suffix}</span>}
      </div>
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function App() {
  const [inputs, setInputs] = useState<Inputs>(defaults);
  const [method, setMethod] = useState<"compound" | "simple">("compound");
  const [page, setPage] = useState<"calculator" | "history" | "guide">(
    "calculator",
  );
  const [records, setRecords] = useState<RecordItem[]>(loadRecords);
  const [name, setName] = useState("");
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState(false);
  function change<K extends keyof Inputs>(key: K, value: Inputs[K]) {
    setInputs((p) => ({ ...p, [key]: value }));
    setSaved(false);
    setNotice("");
  }
  let result: Result | null = null;
  let error = "";
  try {
    result = calculate(inputs);
  } catch (e) {
    error = e instanceof Error ? e.message : "请检查输入";
  }
  let days = 0;
  try {
    days = holdingDays(inputs);
  } catch {}
  const activeMode = modes.find((m) => m.key === inputs.mode)!;
  function persist(next: RecordItem[]) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setRecords(next);
      return true;
    } catch {
      setNotice("浏览器存储不可用，记录未保存。");
      return false;
    }
  }
  function save() {
    if (!result) return;
    if (
      persist(
        [
          {
            id: crypto.randomUUID(),
            name: name.trim() || `${activeMode.title} · ${date(0)}`,
            inputs: { ...inputs },
            result,
            method,
          },
          ...records,
        ].slice(0, 50),
      )
    ) {
      setSaved(true);
      setNotice("已保存，可在计算记录中查看和重新载入。");
    }
  }
  return (
    <div class="shell">
      <header class="page-nav">
        <nav>
          {(
            [
              { key: "calculator", label: "年化计算器", icon: "calculator" },
              { key: "history", label: "计算记录", icon: "clock" },
              { key: "guide", label: "计算说明", icon: "book" },
            ] as const
          ).map((item) => (
            <button
              class={page === item.key ? "nav-item active" : "nav-item"}
              onClick={() => setPage(item.key)}
            >
              <Icon name={item.icon} />
              {item.label}
              {item.key === "history" && records.length > 0 && (
                <span class="count">{records.length}</span>
              )}
            </button>
          ))}
        </nav>
      </header>
      <div class="workspace">
        <main>
          <div class="page-heading">
            <div>
              <h1>
                {page === "calculator"
                  ? "年化收益计算器"
                  : page === "history"
                    ? "计算记录"
                    : "计算说明"}
              </h1>
              <p>
                {page === "calculator"
                  ? "从一段时间的净值或收益出发，轻松换算年化收益率。"
                  : page === "history"
                    ? "保留每一次计算，在相同口径下比较不同产品。"
                    : "清楚的计算口径，是比较投资产品的第一步。"}
              </p>
            </div>
          </div>
          {page === "calculator" && (
            <>
              <div class="mode-grid">
                {modes.map((m) => (
                  <button
                    class={`mode-card ${inputs.mode === m.key ? "selected" : ""}`}
                    onClick={() => change("mode", m.key)}
                    aria-pressed={inputs.mode === m.key}
                  >
                    <div>
                      <strong>{m.title}</strong>
                      <small>{m.subtitle}</small>
                    </div>
                  </button>
                ))}
              </div>
              <div class="calculator-grid">
                <section class="card input-card">
                  <div class="section-head">
                    <h2>
                      输入投资信息
                    </h2>
                    <button
                      class="text-button"
                      onClick={() => {
                        setInputs(defaults());
                        setName("");
                        setSaved(false);
                        setNotice("");
                      }}
                    >
                      <Icon name="reset" size={14} /> 重置
                    </button>
                  </div>
                  <div class="form-content">
                    <label class="field">
                      <span>
                        产品名称 <em>选填</em>
                      </span>
                      <div class="input-wrap">
                        <input
                          type="text"
                          maxLength={60}
                          placeholder="给这笔投资起个名字"
                          value={name}
                          onInput={(e) => {
                            setName(e.currentTarget.value);
                            setSaved(false);
                          }}
                        />
                      </div>
                    </label>
                    {inputs.mode !== "rate" && (
                      <Field
                        label="投入本金"
                        value={inputs.principal}
                        suffix="元"
                        onInput={(v) => change("principal", v)}
                      />
                    )}
                    {inputs.mode === "nav" ? (
                      <div class="field-grid">
                        <Field
                          label="期初净值"
                          value={inputs.startNav}
                          onInput={(v) => change("startNav", v)}
                        />
                        <Field
                          label="期末净值"
                          value={inputs.endNav}
                          onInput={(v) => change("endNav", v)}
                        />
                      </div>
                    ) : inputs.mode === "profit" ? (
                      <Field
                        label="区间净收益"
                        value={inputs.profit}
                        suffix="元"
                        onInput={(v) => change("profit", v)}
                        hint="填入扣除全部费用后的收益，亏损请输入负数。"
                      />
                    ) : (
                      <Field
                        label="区间收益率"
                        value={inputs.rate}
                        suffix="%"
                        onInput={(v) => change("rate", v)}
                        hint="填入整个持有期间的收益率，非已年化收益率。"
                      />
                    )}
                    <div class="period-label">
                      <span>持有时间</span>
                      <div class="mini-tabs">
                        <button
                          class={inputs.period === "days" ? "on" : ""}
                          onClick={() => change("period", "days")}
                        >
                          按天数
                        </button>
                        <button
                          class={inputs.period === "dates" ? "on" : ""}
                          onClick={() => change("period", "dates")}
                        >
                          按日期
                        </button>
                      </div>
                    </div>
                    {inputs.period === "days" ? (
                      <>
                        <label class="input-wrap">
                          <input
                            aria-label="持有天数"
                            type="number"
                            min="1"
                            step="1"
                            value={inputs.days}
                            onInput={(e) =>
                              change("days", e.currentTarget.value)
                            }
                          />
                          <span>天</span>
                        </label>
                        <div class="presets">
                          {[7, 30, 90, 180, 365].map((d) => (
                            <button
                              class={Number(inputs.days) === d ? "chosen" : ""}
                              onClick={() => change("days", String(d))}
                            >
                              {d === 365 ? "1 年" : `${d} 天`}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div class="field-grid">
                        <Field
                          type="date"
                          label="开始日期"
                          value={inputs.startDate}
                          onInput={(v) => change("startDate", v)}
                        />
                        <Field
                          type="date"
                          label="结束日期"
                          value={inputs.endDate}
                          onInput={(v) => change("endDate", v)}
                        />
                      </div>
                    )}
                    <div class="date-note">
                      <Icon name="clock" size={14} />{" "}
                      {days ? `实际持有 ${days} 天` : "请输入持有时间"}
                      <span>一年按 365 天计算</span>
                    </div>
                    {inputs.mode === "nav" && (
                      <div class="fee-section">
                        <label class="fee-toggle">
                          <span>
                            计入交易费用 <small>申购费 / 赎回费</small>
                          </span>
                          <input
                            class="switch"
                            type="checkbox"
                            checked={inputs.fees}
                            onChange={(e) =>
                              change("fees", e.currentTarget.checked)
                            }
                          />
                        </label>
                        {inputs.fees && (
                          <div class="field-grid fees">
                            <Field
                              label="申购费率"
                              value={inputs.subscription}
                              suffix="%"
                              onInput={(v) => change("subscription", v)}
                            />
                            <Field
                              label="赎回费率"
                              value={inputs.redemption}
                              suffix="%"
                              onInput={(v) => change("redemption", v)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    <div class="live-hint">
                      <span class="live-dot" /> 修改输入后，计算结果实时更新
                    </div>
                  </div>
                </section>
                <section class="card result-card">
                  <div class="section-head">
                    <h2>
                      计算结果
                    </h2>
                    <span class="tag">{result ? "实时计算" : "等待输入"}</span>
                  </div>
                  <div class="result-content" aria-live="polite">
                    <div class="result-top">
                      <span>年化收益率</span>
                      <div class="method-tabs">
                        <button
                          class={method === "compound" ? "on" : ""}
                          onClick={() => {
                            setMethod("compound");
                            setSaved(false);
                          }}
                        >
                          复利
                        </button>
                        <button
                          class={method === "simple" ? "on" : ""}
                          onClick={() => {
                            setMethod("simple");
                            setSaved(false);
                          }}
                        >
                          单利
                        </button>
                      </div>
                    </div>
                    <div
                      class={`big-result ${result && result[method] < 0 ? "negative" : ""}`}
                    >
                      {result ? (
                        <>
                          {result[method] > 0 ? (
                            <span class="plus">+</span>
                          ) : (
                            ""
                          )}
                          {fmt(result[method])}
                          <span class="percent-sign">%</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                    <p class="result-caption">
                      {method === "compound"
                        ? "按收益再投资的复利口径折算"
                        : "按收益不再投资的单利口径折算"}
                    </p>
                    {error && (
                      <div class="error" role="alert">
                        {error}
                      </div>
                    )}
                    <div class="result-metrics">
                      <div>
                        <span>区间收益率</span>
                        <strong
                          class={
                            result && result.total < 0 ? "negative" : "positive"
                          }
                        >
                          {result ? pct(result.total) : "—"}
                        </strong>
                      </div>
                      <div>
                        <span>持有天数</span>
                        <strong>
                          {result ? fmt(result.days, 0) : "—"} <small>天</small>
                        </strong>
                      </div>
                    </div>
                    <div class="result-details">
                      <div>
                        <span>区间净收益</span>
                        <strong>
                          {result?.profit != null
                            ? `${result.profit > 0 ? "+" : ""}${fmt(result.profit)} 元`
                            : "—"}
                        </strong>
                      </div>
                      <div>
                        <span>期末资产金额</span>
                        <strong>
                          {result?.ending != null
                            ? `${fmt(result.ending)} 元`
                            : "—"}
                        </strong>
                      </div>
                      {inputs.mode === "nav" && (
                        <div>
                          <span>交易费用合计</span>
                          <strong>
                            {result ? `${fmt(result.fee)} 元` : "—"}
                          </strong>
                        </div>
                      )}
                    </div>
                    <div class="formula-box">
                      <span>
                        本次计算公式 <Icon name="percent" size={13} />
                      </span>
                      <code>
                        {method === "compound"
                          ? "(1 + 区间收益率) ^ (365 / 持有天数) − 1"
                          : "区间收益率 × (365 / 持有天数)"}
                      </code>
                    </div>
                    <button
                      class="save-button"
                      disabled={!result || saved}
                      onClick={save}
                    >
                      <Icon name="save" size={17} />
                      {saved ? "已保存到计算记录" : "保存本次计算"}
                      {!saved && <Icon name="arrow" size={17} />}
                    </button>
                    {notice && (
                      <p class="notice" role="status">
                        {notice}
                      </p>
                    )}
                  </div>
                </section>
              </div>
              <div class="insight">
                <div>
                  <p>
                    年化收益率是对历史区间收益的折算，不代表未来实际收益。持有时间越短，短期波动对年化结果的影响越大。
                  </p>
                </div>
                <button class="text-button" onClick={() => setPage("guide")}>
                  了解计算口径 <Icon name="arrow" size={15} />
                </button>
              </div>
            </>
          )}
          {page === "history" && (
            <section class="card history">
              <div class="section-head">
                <h2>
                  已保存的计算 <span class="tag">{records.length} 条</span>
                </h2>
                <button
                  class="text-button"
                  onClick={() => setPage("calculator")}
                >
                  新建计算 <Icon name="arrow" size={16} />
                </button>
              </div>
              {records.length === 0 ? (
                <div class="empty">
                  <Icon name="clock" size={40} />
                  <h3>暂无计算记录</h3>
                  <p>保存一次计算后，即可在这里查看和重新载入。</p>
                  <button
                    class="save-button"
                    onClick={() => setPage("calculator")}
                  >
                    开始计算 <Icon name="arrow" size={18} />
                  </button>
                </div>
              ) : (
                <div class="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>产品 / 计算方式</th>
                        <th>持有时间</th>
                        <th>区间收益率</th>
                        <th>年化收益率</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <strong>{r.name}</strong>
                            <small>
                              {
                                modes.find((m) => m.key === r.inputs.mode)
                                  ?.title
                              }{" "}
                              · {r.method === "compound" ? "复利" : "单利"}
                            </small>
                          </td>
                          <td>{r.result.days} 天</td>
                          <td>{pct(r.result.total)}</td>
                          <td
                            class={
                              r.result[r.method] < 0 ? "negative" : "positive"
                            }
                          >
                            <b>{pct(r.result[r.method])}</b>
                          </td>
                          <td>
                            <div class="row-actions">
                              <button
                                class="text-button"
                                onClick={() => {
                                  setInputs(r.inputs);
                                  setMethod(r.method);
                                  setName(r.name);
                                  setSaved(false);
                                  setNotice("");
                                  setPage("calculator");
                                }}
                              >
                                载入
                              </button>
                              <button
                                class="icon-button"
                                aria-label={`删除 ${r.name}`}
                                onClick={() =>
                                  persist(
                                    records.filter((item) => item.id !== r.id),
                                  )
                                }
                              >
                                <Icon name="trash" size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div class="history-note">
                记录仅保存在当前浏览器，最多保留最近 50
                条；清除浏览器数据会删除记录。
              </div>
              {notice && (
                <p class="notice" role="status">
                  {notice}
                </p>
              )}
            </section>
          )}
          {page === "guide" && (
            <div class="guide-grid">
              <section class="card guide">
                <h2>选择适合你的输入方式</h2>
                {modes.map((m, i) => (
                  <article>
                    <span class="step">0{i + 1}</span>
                    <div>
                      <h3>{m.title}</h3>
                      <p>
                        {m.key === "nav"
                          ? "适合没有期间申赎、分红或拆分的净值型产品。通过期初、期末净值计算收益，可按外扣法计入申购费及赎回费。"
                          : m.key === "profit"
                            ? "知道投入本金与区间净收益时使用。收益应包含期间利息、分红并扣除全部费用，亏损填负数。"
                            : "已经知道持有期间的累计收益率时使用，无需输入本金。此模式不计算收益金额。"}
                      </p>
                    </div>
                  </article>
                ))}
                <p class="guide-note">
                  以上计算适用于单笔投入的区间收益。期间多次追加、赎回或分红再投资，需使用现金流或复权数据计算，本工具暂不支持。
                </p>
              </section>
              <section class="card guide">
                <h2>两种年化口径</h2>
                <h3>复利年化</h3>
                <code>(1 + 区间收益率) ^ (365 / 天数) − 1</code>
                <p>假设每个周期获得相同收益并再投资，用于比较复合增长速度。</p>
                <h3>单利年化</h3>
                <code>区间收益率 × 365 / 天数</code>
                <p>不假设收益再投资，将区间收益按时间线性折算。</p>
                <h3>时间与费用</h3>
                <p>
                  日期采用结束日期减开始日期，同日不计算，全年固定按 365
                  天。净值模式的份额为本金 ÷ (1 + 申购费率) ÷
                  期初净值；期末资产扣除赎回费后再减本金得到净收益。金额与费用使用十进制计算，复利幂运算使用浮点近似。
                </p>
                <a
                  class="source-link"
                  href="https://www.sec.gov/investor/tools/mfcc/rate-of-return-help.htm"
                  target="_blank"
                  rel="noreferrer"
                >
                  参考：SEC 收益率说明 ↗
                </a>
              </section>
            </div>
          )}
          <footer>
            <span>本地计算，数据不上传</span>
            <span>计算结果仅供参考</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
