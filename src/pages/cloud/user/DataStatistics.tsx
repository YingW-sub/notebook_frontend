/**
 * 普通用户 — 数据统计（按分类笔记数量）
 */
import CardChart from '@/components/CardChart';
import { getCategoryStatistics } from '@/services/api/note';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import './DataStatistics.less';

type Row = { name: string; value: number };

export default () => {
  const intl = useIntl();
  const [loading, setLoading] = useState(true);
  const [barData, setBarData] = useState<Row[]>([]);
  const [pieData, setPieData] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const raw = await getCategoryStatistics();
        const rows: Row[] = (raw || []).map((item: Record<string, any>) => ({
          name: String(item.categoryName ?? item.category_name ?? '-'),
          value: Number(item.noteCount ?? item.note_count ?? 0),
        }));
        setBarData(rows);
        const total = rows.reduce((s, r) => s + r.value, 0) || 1;
        setPieData(
          rows.map((r) => ({
            ...r,
            percent: ((r.value / total) * 100).toFixed(1),
          })),
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <PageContainer>
      <Spin spinning={loading}>
        <ProCard
          className="statsSectionCard"
          bordered={false}
          title={intl.formatMessage({ id: 'pages.cloud.stats.barByCategory' })}
          style={{ marginBottom: 20 }}
        >
          <CardChart id="user-cat-bar" chartType="bar" data={barData} height={340} />
        </ProCard>
        <ProCard
          className="statsSectionCard"
          bordered={false}
          title={intl.formatMessage({ id: 'pages.cloud.stats.pieByCategory' })}
        >
          <CardChart id="user-cat-pie" chartType="pie" data={pieData} height={400} />
        </ProCard>
      </Spin>
    </PageContainer>
  );
};
