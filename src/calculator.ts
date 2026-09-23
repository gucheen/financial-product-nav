import Big from "big.js";

export type Mode = "nav" | "profit" | "rate";
export interface Inputs {
  mode: Mode;
  principal: string;
  startNav: string;
  endNav: string;
  profit: string;
  rate: string;
  fees: boolean;
  subscription: string;
  redemption: string;
  period: "dates" | "days";
  startDate: string;
  endDate: string;
  days: string;
}
function decimal(value: string, label: string): Big {
  if (!value.trim() || !Number.isFinite(Number(value)))
    throw new Error(`请输入有效的${label}`);
  return new Big(value);
}
function dateValue(value: string): number {
  const time = Date.parse(value + "T00:00:00Z");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(time) ||
    new Date(time).toISOString().slice(0, 10) !== value
  )
    throw new Error("请输入有效的起止日期");
  return time;
}
export function holdingDays(input: Inputs): number {
  const days =
    input.period === "days"
      ? Number(input.days)
      : (dateValue(input.endDate) - dateValue(input.startDate)) / 86400000;
  if (!Number.isSafeInteger(days) || days <= 0)
    throw new Error("持有天数必须为正整数，结束日期须晚于开始日期");
  return days;
}
export function calculate(input: Inputs) {
  const days = holdingDays(input);
  let total: Big;
  let netProfit: Big | null = null;
  let fee = new Big(0);
  let principal: Big | null = null;
  if (input.mode === "rate") {
    total = decimal(input.rate, "区间收益率").div(100);
  } else {
    principal = decimal(input.principal, "投入本金");
    if (principal.lte(0)) throw new Error("投入本金必须大于 0");
    if (input.mode === "profit") {
      netProfit = decimal(input.profit, "净收益");
    } else {
      const start = decimal(input.startNav, "期初净值");
      const end = decimal(input.endNav, "期末净值");
      if (start.lte(0) || end.lt(0))
        throw new Error("期初净值必须大于 0，期末净值不能为负");
      const sub = input.fees
        ? decimal(input.subscription, "申购费率").div(100)
        : new Big(0);
      const red = input.fees
        ? decimal(input.redemption, "赎回费率").div(100)
        : new Big(0);
      if (sub.lt(0) || sub.gte(1) || red.lt(0) || red.gte(1))
        throw new Error("费率须在 0%（含）至 100%（不含）之间");
      const invested = principal.div(sub.plus(1));
      const gross = invested.div(start).times(end);
      fee = principal.minus(invested).plus(gross.times(red));
      netProfit = gross.times(new Big(1).minus(red)).minus(principal);
    }
    total = netProfit.div(principal);
  }
  if (total.lt(-1))
    throw new Error("亏损不能超过本金，区间收益率不能低于 -100%");
  const simple = total.times(365).div(days).times(100).toNumber();
  // 非整数次幂使用浮点运算；金额与费用在此之前保持十进制精度。
  const compound = total.eq(-1)
    ? -100
    : Math.expm1((Math.log1p(total.toNumber()) * 365) / days) * 100;
  if (
    ![
      simple,
      compound,
      total.toNumber(),
      netProfit?.toNumber() ?? 0,
      fee.toNumber(),
      principal?.plus(netProfit ?? 0).toNumber() ?? 0,
    ].every(Number.isFinite)
  )
    throw new Error("计算结果超出范围，请检查输入或延长计算区间");
  return {
    days,
    total: total.times(100).toNumber(),
    simple,
    compound,
    profit: netProfit?.toNumber() ?? null,
    ending: principal?.plus(netProfit ?? 0).toNumber() ?? null,
    fee: fee.toNumber(),
  };
}
export type Result = ReturnType<typeof calculate>;
