import React from 'preact'
import { useState, useCallback } from 'preact/hooks'

// 假设您的高精度计算函数已集成到您的项目逻辑中
import { calculateFundProfitBigJs } from './calculator' 
import dayjs from 'dayjs'

/**
 * 默认输入值
 */
const defaultInputs = {
    purchaseAmount: 10000,
    startNav: 1.0001,
    endNav: 1.0002,
    subscriptionRate: 0, // 1.2%
    redemptionRate: 0,   // 0.5%
    startDate: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
    endDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
}

// --- 计算规则数据 ---
const CalculationRules = [
    { title: "1. 持有份额", formula: "买入金额 ÷ [买入净值 × (1 + 申购费率)]" },
    { title: "2. 申购费用", formula: "买入金额 - (买入金额 ÷ (1 + 申购费率))" },
    { title: "3. 赎回费用", formula: "持有份额 × 卖出净值 × 赎回费率" },
    { title: "4. 净收益", formula: "(卖出净值 - 买入净值) × 持有份额 - (申购费用 + 赎回费用)" },
    { title: "5. 总收益率", formula: "(净收益 ÷ 买入金额) × 100%" },
    { title: "6. 年化收益率", formula: "[(1 + 总收益率) ^ (365 ÷ 持有天数) - 1] × 100%" },
];

// --- 样式定义 ---
const styles = {
    mainContainer: {
        display: 'flex',
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '20px',
        gap: '30px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        borderRadius: '10px',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#fff',
    },
    // 左侧：输入表单
    formSection: {
        flex: 1, // 占据 1 份宽度
        paddingRight: '30px',
        borderRight: '1px solid #eee',
    },
    // 右侧：结果展示区 (占据 1 份宽度)
    resultSection: {
        flex: 1, 
        paddingLeft: '30px',
    },
    input: { padding: '10px', margin: '5px 0 15px', width: '100%', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '5px' },
    label: { fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#333' },
    button: { padding: '12px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '17px', width: '100%', marginTop: '20px', transition: 'background-color 0.3s' },
    resultBox: { padding: '25px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', marginTop: '20px' },
    profitText: { fontSize: '1.8em', fontWeight: 'bold', color: '#28a745', margin: '10px 0' },
    rateText: { fontSize: '1.2em', color: '#007bff' },
    errorBox: { padding: '15px', backgroundColor: '#fdd', border: '1px solid #f00', borderRadius: '5px', marginTop: '15px' },
    rulesTitle: { marginBottom: '15px' },
    ruleItem: { marginBottom: '15px' },
    ruleTitle: { margin: '5px 0', color: '#007bff' },
    ruleFormula: { display: 'block', backgroundColor: '#f4f4f4', padding: '8px', borderRadius: '4px', fontSize: '0.95em' },
    rulesSection: { marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' },
};

const FundCalculatorReact = () => {
    const [inputs, setInputs] = useState(defaultInputs);
    const [calculationResult, setCalculationResult] = useState(null);
    const [error, setError] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);

    // 通用输入处理函数
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setInputs(prev => ({ ...prev, [name]: value }));
        
        // 任何输入变化都清除之前的状态
        if (error || calculationResult) {
            setError(null);
            setCalculationResult(null);
        }
    }, [error, calculationResult]);

    // 提交处理函数
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setError(null);
        setCalculationResult(null);
        setIsCalculating(true);

        try {
            const finalInputs = {
                purchaseAmount: Number(inputs.purchaseAmount),
                startNav: Number(inputs.startNav),
                endNav: Number(inputs.endNav),
                subscriptionRate: Number(inputs.subscriptionRate), 
                redemptionRate: Number(inputs.redemptionRate),
                startDate: new Date(inputs.startDate),
                endDate: new Date(inputs.endDate),
            };

            if (isNaN(finalInputs.startDate.getTime()) || isNaN(finalInputs.endDate.getTime())) {
                throw new Error("请检查日期的格式是否正确 (YYYY-MM-DD)。");
            }
            
            // ** 在这里调用您的 calculateFundProfitBigJs 函数 **
            const result = await calculateFundProfitBigJs(finalInputs);
            
            setCalculationResult(result);

        } catch (err) {
            setError(err.message || "计算过程中发生错误。");
        } finally {
            setIsCalculating(false);
        }

    }, [inputs]);

    return (
        <div style={styles.mainContainer}>
            
            {/* --- 左侧: 输入表单 --- */}
            <div style={styles.formSection}>
                <h2>📊 理财净值收益计算</h2>
                
                {/* 输入表单 */}
                <form onSubmit={handleSubmit}>
                    
                    {/* 金额、净值、费率、日期输入字段... */}
                    <label style={styles.label}>投入金额 (元)</label>
                    <input type="number" name="purchaseAmount" value={inputs.purchaseAmount} onChange={handleInputChange} required step="any" style={styles.input} />
                    
                    <label style={styles.label}>买入净值</label>
                    <input type="number" name="startNav" value={inputs.startNav} onChange={handleInputChange} required step="0.0001" style={styles.input} />
                    
                    <label style={styles.label}>卖出净值</label>
                    <input type="number" name="endNav" value={inputs.endNav} onChange={handleInputChange} required step="0.0001" style={styles.input} />
                    
                    <label style={styles.label}>申购费率 (小数，如 0.012)</label>
                    <input type="number" name="subscriptionRate" value={inputs.subscriptionRate} onChange={handleInputChange} required step="0.0001" style={styles.input} />
                    
                    <label style={styles.label}>赎回费率 (小数，如 0.005)</label>
                    <input type="number" name="redemptionRate" value={inputs.redemptionRate} onChange={handleInputChange} required step="0.0001" style={styles.input} />

                    <label style={styles.label}>买入日期</label>
                    <input type="date" name="startDate" value={inputs.startDate} onChange={handleInputChange} required style={styles.input} />
                    
                    <label style={styles.label}>卖出日期</label>
                    <input type="date" name="endDate" value={inputs.endDate} onChange={handleInputChange} required style={styles.input} />

                    <button type="submit" disabled={isCalculating} style={styles.button}>
                        {isCalculating ? '计算中...' : '🚀 开始计算'}
                    </button>
                </form>

                {/* 错误显示 */}
                {error && (
                    <div style={styles.errorBox}>
                        <p style={{ color: '#c00', margin: 0, fontWeight: 'bold' }}>⚠️ 计算错误</p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.9em' }}>{error}</p>
                    </div>
                )}
            </div>

            {/* --- 右侧: 结果展示区 --- */}
            <div style={styles.resultSection}>
                {calculationResult && (
                    <div style={styles.resultBox}>
                        <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>✅ 最终收益</h3>
                        
                        <p style={styles.profitText}>
                            净收益: <span>{calculationResult.netProfit}</span> 元
                        </p>
                        
                        <p style={styles.rateText}>
                            年化收益率: <strong>{calculationResult.annualizedReturnRatePercentage}%</strong>
                        </p>
                        <p style={styles.rateText}>
                            总收益率: <strong>{calculationResult.totalReturnRatePercentage}%</strong>
                        </p>

                        <hr style={{ margin: '15px 0' }} />
                        
                        <p>持有天数: <strong>{calculationResult.holdingDays}</strong> 天 | 份额: <strong>{calculationResult.shares}</strong> 份</p>
                        <p>总交易费用: <strong>{(parseFloat(calculationResult.subscriptionFee) + parseFloat(calculationResult.redemptionFee)).toFixed(2)}</strong> 元 (含申购费：{calculationResult.subscriptionFee} | 赎回费：{calculationResult.redemptionFee})</p>
                    </div>
                )}
            </div>

            {/* --- 页面底部: 规则展示区 --- */}
            <div style={styles.rulesSection}>
                <h2 style={styles.rulesTitle}>📚 计算规则说明</h2>
                <p style={{ color: '#555', borderBottom: '1px dashed #ccc', paddingBottom: '10px' }}>
                    本计算器遵循以下六步规则进行计算。
                </p>
                {CalculationRules.map((rule, index) => (
                    <div key={index} style={styles.ruleItem}>
                        <h4 style={styles.ruleTitle}>{rule.title}</h4>
                        <code style={styles.ruleFormula}>
                            {rule.formula}
                        </code>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const App = FundCalculatorReact;
