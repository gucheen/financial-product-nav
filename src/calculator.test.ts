import { describe, expect, test } from "bun:test";
import { calculate, holdingDays, type Inputs } from "./calculator";
const base: Inputs = {
  mode: "nav",
  principal: "10000",
  startNav: "1",
  endNav: "1.025",
  profit: "250",
  rate: "2.5",
  fees: false,
  subscription: "0",
  redemption: "0",
  period: "days",
  startDate: "2024-01-01",
  endDate: "2025-01-01",
  days: "90",
};
describe("年化收益计算", () => {
  test("三种输入方式得到相同收益率", () => {
    for (const mode of ["nav", "profit", "rate"] as const) {
      const result = calculate({ ...base, mode });
      expect(result.total).toBe(2.5);
      expect(result.simple).toBeCloseTo(10.13888889, 7);
      expect(result.compound).toBeCloseTo((1.025 ** (365 / 90) - 1) * 100, 9);
    }
  });
  test("全年收益与年化相同", () => {
    const result = calculate({ ...base, days: "365" });
    expect(result.simple).toBe(2.5);
    expect(result.compound).toBeCloseTo(2.5, 10);
  });
  test("申购外扣法及赎回费用计入本金损益", () => {
    const result = calculate({
      ...base,
      principal: "10100",
      endNav: "1.1",
      fees: true,
      subscription: "1",
      redemption: "1",
    });
    expect(result.fee).toBe(210);
    expect(result.ending).toBe(10890);
    expect(result.profit).toBe(790);
  });
  test("零收益、负收益和全部亏损", () => {
    expect(calculate({ ...base, endNav: "1" }).compound).toBe(0);
    expect(calculate({ ...base, endNav: ".9" }).compound).toBeLessThan(0);
    expect(calculate({ ...base, endNav: "0" }).compound).toBe(-100);
    expect(
      calculate({ ...base, mode: "profit", profit: "-10000" }).compound,
    ).toBe(-100);
  });
  test("日历按实际间隔，包含闰日且不重复计算起始日", () => {
    expect(holdingDays({ ...base, period: "dates" })).toBe(366);
    expect(
      holdingDays({
        ...base,
        period: "dates",
        startDate: "2024-02-28",
        endDate: "2024-03-01",
      }),
    ).toBe(2);
    expect(
      holdingDays({
        ...base,
        period: "dates",
        startDate: "2024-03-01",
        endDate: "2024-03-02",
      }),
    ).toBe(1);
  });
  test("拒绝无效日期、金额、天数、费率及超额亏损", () => {
    const cases: Partial<Inputs>[] = [
      { days: "0" },
      { days: "-1" },
      { days: "1.5" },
      { days: "" },
      { principal: "0" },
      { principal: "" },
      { startNav: "0" },
      { endNav: "-1" },
      { fees: true, redemption: "100" },
      { fees: true, subscription: "-1" },
      { mode: "profit", profit: "-10001" },
      { mode: "rate", rate: "-101" },
      { mode: "rate", rate: "" },
      { period: "dates", startDate: "2024-02-30" },
      { period: "dates", endDate: "2024-01-01" },
      { period: "dates", endDate: "2023-12-31" },
      { mode: "rate", rate: "1e300", days: "1" },
    ];
    for (const values of cases)
      expect(() => calculate({ ...base, ...values })).toThrow();
  });
  test("收益率模式不依赖本金，关闭费率不使用残留输入", () => {
    expect(
      calculate({ ...base, mode: "rate", principal: "" }).profit,
    ).toBeNull();
    expect(
      calculate({ ...base, subscription: "", redemption: "-100" }).fee,
    ).toBe(0);
  });
});
