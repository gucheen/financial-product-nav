import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { calculate, holdingDays } from "../calculator.js";

const base = {
  mode: "nav", principal: "10000", startNav: "1", endNav: "1.025",
  profit: "250", rate: "2.5", fees: false, subscription: "0", redemption: "0",
  period: "days", startDate: "2024-01-01", endDate: "2025-01-01", days: "90",
};
const closeTo = (actual, expected, digits) =>
  assert.ok(Math.abs(actual - expected) < 0.5 * 10 ** -digits, `${actual} ≈ ${expected}`);

describe("年化收益计算", () => {
  test("三种输入方式得到相同收益率", () => {
    for (const mode of ["nav", "profit", "rate"]) {
      const result = calculate({ ...base, mode });
      assert.equal(result.total, 2.5);
      closeTo(result.simple, 10.13888889, 7);
      closeTo(result.compound, (1.025 ** (365 / 90) - 1) * 100, 9);
    }
  });
  test("全年收益与年化相同", () => {
    const result = calculate({ ...base, days: "365" });
    assert.equal(result.simple, 2.5);
    closeTo(result.compound, 2.5, 10);
  });
  test("申购外扣法及赎回费用计入本金损益", () => {
    const result = calculate({ ...base, principal: "10100", endNav: "1.1", fees: true, subscription: "1", redemption: "1" });
    assert.equal(result.fee, 210);
    assert.equal(result.ending, 10890);
    assert.equal(result.profit, 790);
  });
  test("零收益、负收益和全部亏损", () => {
    assert.equal(calculate({ ...base, endNav: "1" }).compound, 0);
    assert.ok(calculate({ ...base, endNav: ".9" }).compound < 0);
    assert.equal(calculate({ ...base, endNav: "0" }).compound, -100);
    assert.equal(calculate({ ...base, mode: "profit", profit: "-10000" }).compound, -100);
  });
  test("日历按实际间隔，包含闰日且不重复计算起始日", () => {
    assert.equal(holdingDays({ ...base, period: "dates" }), 366);
    assert.equal(holdingDays({ ...base, period: "dates", startDate: "2024-02-28", endDate: "2024-03-01" }), 2);
    assert.equal(holdingDays({ ...base, period: "dates", startDate: "2024-03-01", endDate: "2024-03-02" }), 1);
  });
  test("拒绝无效日期、金额、天数、费率及超额亏损", () => {
    const cases = [
      { days: "0" }, { days: "-1" }, { days: "1.5" }, { days: "" },
      { principal: "0" }, { principal: "" }, { startNav: "0" }, { endNav: "-1" },
      { fees: true, redemption: "100" }, { fees: true, subscription: "-1" },
      { mode: "profit", profit: "-10001" }, { mode: "rate", rate: "-101" },
      { mode: "rate", rate: "" }, { period: "dates", startDate: "2024-02-30" },
      { period: "dates", endDate: "2024-01-01" }, { period: "dates", endDate: "2023-12-31" },
      { mode: "rate", rate: "1e300", days: "1" },
    ];
    for (const values of cases) assert.throws(() => calculate({ ...base, ...values }));
  });
  test("收益率模式不依赖本金，关闭费率不使用残留输入", () => {
    assert.equal(calculate({ ...base, mode: "rate", principal: "" }).profit, null);
    assert.equal(calculate({ ...base, subscription: "", redemption: "-100" }).fee, 0);
  });
  test("金额计算保留十进制精度", () => {
    const result = calculate({ ...base, mode: "profit", principal: "0.1", profit: "0.2", days: "365" });
    assert.equal(result.ending, 0.3);
    assert.equal(result.total, 200);
  });
});
