// components/HexagramGenerator.tsx
'use client';

import React, { useState } from 'react';
import { Lunar } from 'lunar-typescript';
import hexagrams from '@/data/hexagrams';
import { Hexagram, Trigram, HourZodiac } from '@/types';
import styles from '@/components/HexagramGenerator.module.css';

// 添加在组件顶部的类型定义之后
const renderHexagram = (upper: number, lower: number, movingLine: number) => {
    const upperLines = trigrams[upper].lines;
    const lowerLines = trigrams[lower].lines;

    // 组合成六爻（注意顺序）
    const allLines = [...lowerLines, ...upperLines].reverse();

    return (
        <div className={styles.hexagramSymbol}>
            {allLines.map((line, index) => {
                const lineNumber = 6 - index; // 从初爻到上爻
                const isMoving = lineNumber === movingLine;

                return (
                    <div
                        key={index}
                        className={`${styles.yinYangLine} ${isMoving ? styles.movingLine : ''}`}
                    >
                        {line === 1 ? (
                            <span className={styles.yangLine}>━━━━━</span>
                        ) : (
                            <span className={styles.yinLine}>━　━</span>
                        )}
                        <span className={styles.lineNumber}>({lineNumber}爻)</span>
                    </div>
                );
            })}
        </div>
    );
};


const hourZodiacMap: HourZodiac[] = [
    { start: [23, 0], end: [1, 0], zodiac: '子', num: 1 },  // 子时
    { start: [1, 0], end: [3, 0], zodiac: '丑', num: 2 },
    { start: [3, 0], end: [5, 0], zodiac: '寅', num: 3 },
    { start: [5, 0], end: [7, 0], zodiac: '卯', num: 4 },
    { start: [7, 0], end: [9, 0], zodiac: '辰', num: 5 },
    { start: [9, 0], end: [11, 0], zodiac: '巳', num: 6 },
    { start: [11, 0], end: [13, 0], zodiac: '午', num: 7 },
    { start: [13, 0], end: [15, 0], zodiac: '未', num: 8 },
    { start: [15, 0], end: [17, 0], zodiac: '申', num: 9 },
    { start: [17, 0], end: [19, 0], zodiac: '酉', num: 10 },
    { start: [19, 0], end: [21, 0], zodiac: '戌', num: 11 },
    { start: [21, 0], end: [23, 0], zodiac: '亥', num: 12 }
];

const trigrams: Record<number, Trigram> = {
    // ...原有八卦配置
    1: { name: '乾', symbol: '☰', lines: [1, 1, 1] },
    2: { name: '兑', symbol: '☱', lines: [1, 1, 0] },
    3: { name: '离', symbol: '☲', lines: [1, 0, 1] },
    4: { name: '震', symbol: '☳', lines: [0, 0, 1] },
    5: { name: '巽', symbol: '☴', lines: [0, 1, 1] },
    6: { name: '坎', symbol: '☵', lines: [0, 1, 0] },
    7: { name: '艮', symbol: '☶', lines: [1, 0, 0] },
    8: { name: '坤', symbol: '☷', lines: [0, 0, 0] }
};

const ZodiacNumberMap: Record<string, number> = {
    // 地支与数字映射
    子: 1, 丑: 2, 寅: 3, 卯: 4,
    辰: 5, 巳: 6, 午: 7, 未: 8,
    申: 9, 酉: 10, 戌: 11, 亥: 12
};

function getCurrentZodiacHour(date: Date): HourZodiac {
    // 优化后的时辰计算逻辑
    const hour = date.getHours();
    const minute = date.getMinutes();

    const matched = hourZodiacMap.find(item => {
        const [startH, startM] = item.start;
        const endH = item.end[0] === 0 ? 24 : item.end[0];
        return (
            (hour > startH || (hour === startH && minute >= startM)) &&
            (hour < endH || (hour === endH && minute < item.end[1]))
        );
    });

    return matched || hourZodiacMap[0];
}

export default function HexagramGenerator() {
    const [result, setResult] = useState<{
        lunarDate: string;
        random: number;
        upper: number;
        lower: number;
        movingLine: number;
        hexagram: Hexagram;
    } | null>(null);

    const [aiResult, setAiResult] = useState('');
    const [loading, setLoading] = useState(false);

    const generateHexagram = async () => {
        setLoading(true);
        try {
            // 生成动态参数
            const date = new Date();
            const lunar = Lunar.fromDate(date);

            // 农历参数
            const lunarYear = lunar.getYear();
            const lunarMonth = lunar.getMonth();
            const lunarDay = lunar.getDay();
            const zodiacYearZhi = lunar.getYearZhi();

            // 时辰计算
            const zodiacHour = getCurrentZodiacHour(date);

            // 随机数处理
            const random = Math.floor(Math.random() * 900) + 100;
            const digits = String(random).padStart(3, '0').split('');
            const [hundreds, tens, ones] = digits.map(Number);

            // 卦象计算
            const yearNum = ZodiacNumberMap[zodiacYearZhi] || 1;
            const upper = (yearNum + lunarMonth + lunarDay + hundreds) % 8 || 8;
            const lower = (yearNum + lunarMonth + lunarDay + ZodiacNumberMap[zodiacHour.zodiac] + tens) % 8 || 8;
            const movingLine = (yearNum + lunarMonth + lunarDay + ZodiacNumberMap[zodiacHour.zodiac] + ones) % 6 || 6;

            // 查找卦象
            const hexagramKey = `${upper}${lower}`;
            const hexagram: Hexagram = hexagrams[hexagramKey] || {
                name: '未知卦',
                judgment: '无数据',
                lines: []
            };

            setResult({
                lunarDate: `${lunar.getYearInGanZhi()}年 ${lunarMonth}月${lunarDay}日 ${zodiacHour.zodiac}时`,
                random,
                upper,
                lower,
                movingLine,
                hexagram
            });

            // 调用AI请求
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `请解析此卦象：
            - 本卦：${hexagram.name}
            - 卦辞：${hexagram.judgment}
             ${hexagram.xiang ? `- 象辞：${hexagram.xiang}\n` : ''}
            - 动爻：第${movingLine}爻（${hexagram.lines[movingLine - 1] || '无数据'}）
            请用专业周易知识综合分析，生成20字运势总结`
                })
            });

            const data = await response.json();
            setAiResult(data.result || '解读失败');
        } catch (error) {
            console.error('生成失败:', error);
            setAiResult('系统错误，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <button onClick={generateHexagram} disabled={loading}>
                {loading ? '生成中...' : '获取卦象'}
            </button>

            {result && (
                <div className="result">
                    <h3>当前参数</h3>
                    <p>农历时间：{result.lunarDate}</p>
                    <p>随机数：{result.random}</p>

                    <h3>卦象解析</h3>
                    <div className="hexagram-symbol">
                        {renderHexagram(
                            result.upper,
                            result.lower,
                            result.movingLine
                        )}
                    </div>
                    <p>本卦：{result.hexagram.name}</p>
                    <p>卦辞：{result.hexagram.judgment}</p>

                    <h3>动爻信息</h3>
                    <p>第<span className="highlight">{result.movingLine}</span>爻</p>
                    <p>{result.hexagram.lines[result.movingLine - 1] || '无爻辞数据'}</p>
                </div>
            )}

            {aiResult && (
                <div className="ai-result">
                    <h4>AI解读</h4>
                    <p>{aiResult}</p>
                </div>
            )}
        </div>
    );
}
