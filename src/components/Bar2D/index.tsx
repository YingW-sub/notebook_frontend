/**
 * 柱状图组件（基于已安装的 echarts）
 */
import EChartsReact from 'echarts-for-react';
import * as echarts from 'echarts';
import { useModel } from '@umijs/max';
import React, { useMemo } from 'react';

interface Bar2DProps {
  id?: string;
  xData: string[];
  yData: number[];
  style?: React.CSSProperties;
}

function barGradient(top: string, bottom: string) {
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: top },
    { offset: 1, color: bottom },
  ]);
}

const BAR_GRADIENT_PAIRS: [string, string][] = [
  ['#7eb6ff', '#2563eb'],
  ['#5eead4', '#0d9488'],
  ['#a7f3d0', '#059669'],
  ['#fde68a', '#d97706'],
  ['#fda4af', '#e11d48'],
  ['#c4b5fd', '#6d28d9'],
  ['#fbcfe8', '#db2777'],
  ['#fed7aa', '#ea580c'],
];

export default ({ xData, yData, style }: Bar2DProps) => {
  const { initialState } = useModel('@@initialState');
  const isDark = initialState?.settings?.navTheme === 'realDark';

  const option = useMemo(() => {
    const text = isDark ? '#f1f5f9' : 'rgba(0, 0, 0, 0.88)';
    const textSecondary = isDark ? 'rgba(226, 232, 240, 0.65)' : 'rgba(0, 0, 0, 0.45)';
    const axisLine = isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(15, 23, 42, 0.12)';
    const splitLine = isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.06)';
    const tooltipBg = isDark ? 'rgba(30, 41, 59, 0.96)' : 'rgba(255, 255, 255, 0.98)';
    const tooltipBorder = isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(37, 99, 235, 0.2)';

    const emptyGraphic = {
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '暂无数据',
            fill: textSecondary,
            fontSize: 15,
            fontWeight: 500,
          },
        },
      ],
    };

    if (!xData.length || !yData.length) {
      return {
        ...emptyGraphic,
        xAxis: { show: false },
        yAxis: { show: false },
        series: [],
      };
    }

    return {
      animationDuration: 900,
      animationEasing: 'cubicOut',
      tooltip: {
        trigger: 'axis',
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: isDark ? '#f8fafc' : '#0f172a', fontSize: 13 },
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(37, 99, 235, 0.12)',
          },
        },
        formatter: (params: { name?: string; value?: number }[]) => {
          const p = params[0];
          if (!p) return '';
          return `<div style="font-weight:600;margin-bottom:4px">${p.name}</div>笔记数：<b>${p.value}</b>`;
        },
      },
      grid: {
        left: 52,
        right: 28,
        bottom: xData.length > 8 ? 56 : 40,
        top: 24,
      },
      xAxis: {
        type: 'category',
        data: xData,
        axisLabel: {
          rotate: xData.length > 6 ? 28 : 0,
          fontSize: 11,
          color: textSecondary,
          margin: 14,
        },
        axisLine: { lineStyle: { color: axisLine } },
        axisTick: { alignWithLabel: true, lineStyle: { color: axisLine } },
      },
      yAxis: {
        type: 'value',
        name: '笔记数',
        nameTextStyle: { color: textSecondary, fontSize: 12, padding: [0, 0, 0, 8] },
        axisLabel: { color: textSecondary, fontSize: 12 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: splitLine, type: 'dashed' } },
      },
      series: [
        {
          type: 'bar',
          data: yData.map((v, i) => {
            const [t, b] = BAR_GRADIENT_PAIRS[i % BAR_GRADIENT_PAIRS.length];
            return {
              value: v,
              itemStyle: {
                color: barGradient(t, b),
                borderRadius: [8, 8, 4, 4],
                shadowColor: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(37, 99, 235, 0.25)',
                shadowBlur: isDark ? 0 : 12,
                shadowOffsetY: 4,
              },
            };
          }),
          barMaxWidth: 48,
          barGap: '28%',
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 20,
              shadowColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(37, 99, 235, 0.35)',
            },
          },
        },
      ],
    };
  }, [xData, yData, isDark]);

  return (
    <EChartsReact
      option={option}
      style={{ height: 420, width: '100%', ...style }}
      notMerge={true}
    />
  );
};
