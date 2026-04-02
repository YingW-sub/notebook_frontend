/**
 * 通用卡片图表组件（柱状图 / 饼图，基于已安装的 echarts）
 */
import EChartsReact from 'echarts-for-react';
import { useIntl, useModel } from '@umijs/max';
import * as echarts from 'echarts';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import styles from './index.less';

interface Row {
  name: string;
  value: number;
  percent?: string;
}

interface CardChartProps {
  id?: string;
  chartType: 'bar' | 'pie';
  data: Row[];
  height?: number;
}

/** 柱状图：每组柱子的顶部/底部色（线性渐变） */
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

/** 饼图：与柱状图协调的实色 */
const PIE_COLORS = [
  '#3b82f6',
  '#14b8a6',
  '#22c55e',
  '#eab308',
  '#f43f5e',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
];

function barGradient(top: string, bottom: string) {
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: top },
    { offset: 1, color: bottom },
  ]);
}

export default ({ chartType, data, height = 360 }: CardChartProps) => {
  const intl = useIntl();
  const { initialState } = useModel('@@initialState');
  const isDark = initialState?.settings?.navTheme === 'realDark';
  const emptyLabel = intl.formatMessage({ id: 'pages.cloud.stats.empty' });

  const option = useMemo(() => {
    const text = isDark ? '#f1f5f9' : 'rgba(0, 0, 0, 0.88)';
    const textSecondary = isDark ? 'rgba(226, 232, 240, 0.65)' : 'rgba(0, 0, 0, 0.45)';
    const axisLine = isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(15, 23, 42, 0.12)';
    const splitLine = isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.06)';
    const tooltipBg = isDark ? 'rgba(30, 41, 59, 0.96)' : 'rgba(255, 255, 255, 0.98)';
    const tooltipBorder = isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(37, 99, 235, 0.2)';
    const pieBorder = isDark ? '#1e293b' : '#ffffff';

    const emptyGraphic = {
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: emptyLabel,
            fill: textSecondary,
            fontSize: 15,
            fontWeight: 500,
          },
        },
      ],
    };

    if (!data.length) {
      return {
        ...emptyGraphic,
        xAxis: { show: false },
        yAxis: { show: false },
        series: [],
      };
    }

    if (chartType === 'bar') {
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
            shadowStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(37, 99, 235, 0.12)' },
          },
          formatter: (params: { name?: string; value?: number }[]) => {
            const p = params[0];
            if (!p) return '';
            return `<div style="font-weight:600;margin-bottom:4px">${p.name}</div>笔记数：<b>${p.value}</b>`;
          },
        },
        grid: { left: 52, right: 28, bottom: data.length > 6 ? 48 : 36, top: 28 },
        xAxis: {
          type: 'category',
          data: data.map((r) => r.name),
          axisLabel: {
            rotate: data.length > 5 ? 24 : 0,
            fontSize: 12,
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
            data: data.map((r, i) => {
              const [t, b] = BAR_GRADIENT_PAIRS[i % BAR_GRADIENT_PAIRS.length];
              return {
                value: r.value,
                itemStyle: {
                  color: barGradient(t, b),
                  borderRadius: [8, 8, 4, 4],
                  shadowColor: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(37, 99, 235, 0.25)',
                  shadowBlur: isDark ? 0 : 12,
                  shadowOffsetY: 4,
                },
              };
            }),
            barMaxWidth: 52,
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
    }

    const total = data.reduce((s, r) => s + r.value, 0);

    return {
      animationDuration: 1000,
      animationEasing: 'cubicOut',
      tooltip: {
        trigger: 'item',
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: isDark ? '#f8fafc' : '#0f172a', fontSize: 13 },
        formatter: '{b}<br/><span style="font-weight:600">{c}</span> 篇（{d}%）',
      },
      legend: {
        bottom: 8,
        icon: 'roundRect',
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 16,
        textStyle: { color: textSecondary, fontSize: 12 },
      },
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: '38%',
          style: {
            text: '合计',
            textAlign: 'center',
            fill: textSecondary,
            fontSize: 13,
          },
        },
        {
          type: 'text',
          left: 'center',
          top: '44%',
          style: {
            text: String(total),
            textAlign: 'center',
            fill: text,
            fontSize: 26,
            fontWeight: 700,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          },
        },
        {
          type: 'text',
          left: 'center',
          top: '54%',
          style: {
            text: '篇笔记',
            textAlign: 'center',
            fill: textSecondary,
            fontSize: 12,
          },
        },
      ],
      series: [
        {
          type: 'pie',
          radius: ['44%', '68%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: true,
          padAngle: 2,
          itemStyle: {
            borderRadius: 8,
            borderColor: pieBorder,
            borderWidth: 3,
          },
          label: {
            formatter: '{b}\n{d}%',
            color: text,
            fontSize: 12,
            lineHeight: 18,
          },
          labelLine: {
            length: 14,
            length2: 10,
            lineStyle: { color: isDark ? 'rgba(226,232,240,0.4)' : 'rgba(15,23,42,0.35)' },
          },
          emphasis: {
            scale: true,
            scaleSize: 6,
            itemStyle: {
              shadowBlur: 24,
              shadowColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(15, 23, 42, 0.18)',
            },
            label: { fontWeight: 600 },
          },
          data: data.map((r, i) => ({
            name: r.name,
            value: r.value,
            itemStyle: { color: PIE_COLORS[i % PIE_COLORS.length] },
          })),
        },
      ],
    };
  }, [chartType, data, emptyLabel, isDark]);

  return (
    <div
      className={classNames(styles.cardChartWrap, {
        [styles.cardChartWrapDark]: isDark,
      })}
    >
      <EChartsReact option={option} style={{ height, width: '100%' }} notMerge={true} />
    </div>
  );
};
