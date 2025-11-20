import Big from 'big.js';
import dayjs from 'dayjs';

// 设置 Big.js 的全局精度 (可选，默认为 20)
// Big.DP = 40; 

/**
 * 定义函数输入参数的接口
 */
interface CalculationInputs {
    purchaseAmount: number;
    startNav: number;
    endNav: number;
    subscriptionRate: number; // 申购费率 (小数)
    redemptionRate: number;   // 赎回费率 (小数)
    startDate: string; // 使用 ISO 8601 格式的日期字符串
    endDate: string;   // 使用 ISO 8601 格式的日期字符串
}

/**
 * 定义函数输出结果的接口
 * 所有财务相关数值都以 string 类型返回，以确保精度不会丢失。
 */
interface CalculationOutputs {
    holdingDays: number;
    shares: string;
    subscriptionFee: string;
    redemptionFee: string;
    netProfit: string;
    totalReturnRatePercentage: string;
    annualizedReturnRatePercentage: string;
}

/**
 * 理财产品净值收益计算器 (使用 Big.js 实现高精度)
 * 严格按照提供的六个公式计算收益和费率。
 * @param inputs CalculationInputs 包含所有必要参数
 * @returns CalculationOutputs 包含所有计算结果的字符串对象
 */
function calculateFundProfitBigJs(inputs: CalculationInputs): CalculationOutputs {
    const {
        purchaseAmount,
        startNav,
        endNav,
        subscriptionRate,
        redemptionRate,
        startDate,
        endDate
    } = inputs;

    // --- 预先计算：持有天数 ---
    const startDay = dayjs(startDate);
    const endDay = dayjs(endDate);
    const holdingDays = endDay.diff(startDay, 'day') + 1; // 计算持有天数，加1是因为包括起止日

    if (holdingDays <= 0) {
        throw new Error("卖出日期必须晚于买入日期。");
    }

    // --- 转换为 Big 对象 ---
    const A = new Big(purchaseAmount);    // 买入金额
    const N_start = new Big(startNav);    // 买入净值
    const N_end = new Big(endNav);        // 卖出净值
    const R_sub = new Big(subscriptionRate); // 申购费率
    const R_red = new Big(redemptionRate);  // 赎回费率
    
    // --- 步骤 1：计算持有份额 ---
    // 份额 = A / [N_start * (1 + R_sub)]
    const shares = A.div(N_start.times(R_sub.plus(1)));

    // --- 步骤 2：计算申购费用 ---
    // 申购费用 = A - (A / (1 + R_sub))
    const subscriptionFee = A.minus(A.div(R_sub.plus(1)));

    // --- 步骤 3：计算赎回费用 ---
    // 赎回费用 = 份额 * N_end * R_red
    const redemptionFee = shares.times(N_end).times(R_red);

    // --- 步骤 4：计算净收益 ---
    // 净收益 = (N_end - N_start) * 份额 - (申购费用 + 赎回费用)
    const netProfit = N_end.minus(N_start)
                           .times(shares)
                           .minus(subscriptionFee.plus(redemptionFee));

    // --- 步骤 5：计算总收益率 ---
    // 总收益率 (小数) = 净收益 / A
    const totalReturnRate = netProfit.div(A);
    const totalReturnRatePercentage = totalReturnRate.times(100);

    // --- 步骤 6：计算年化收益率 ---
    // 年化收益率 (小数) = (1 + 总收益率) ^ (365 / 持有天数) - 1
    
    // Big.js 不原生支持非整数幂。必须依赖 Math.pow()。
    const exponent = 365 / holdingDays; 
    const base = totalReturnRate.plus(1).toNumber(); // 转换回标准JS浮点数

    // 使用 Math.pow() 进行幂运算，然后转回 Big 对象
    const annualizedReturnRate = new Big(Math.pow(base, exponent)).minus(1);

    const annualizedReturnRatePercentage = annualizedReturnRate.times(100);

    // --- 返回结果 (使用 .toFixed() 方法控制精度) ---
    return {
        holdingDays,
        shares: shares.toFixed(8), // 份额通常需要更高精度
        subscriptionFee: subscriptionFee.toFixed(2),
        redemptionFee: redemptionFee.toFixed(2),
        netProfit: netProfit.toFixed(2),
        totalReturnRatePercentage: totalReturnRatePercentage.toFixed(4),
        annualizedReturnRatePercentage: annualizedReturnRatePercentage.toFixed(4)
    };
}

// 导出函数，方便其他模块使用
export { calculateFundProfitBigJs, CalculationInputs, CalculationOutputs };
