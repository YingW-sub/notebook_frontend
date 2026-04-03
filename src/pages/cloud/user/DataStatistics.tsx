/**
 * 普通用户 — 数据统计（按分类笔记数量）
 */
import CardChart from '@/components/CardChart';
import { getCategoryStatistics } from '@/services/api/note';
import { AppstoreOutlined, FileTextOutlined } from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Col, Row, Spin, Statistic } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import './DataStatistics.less';

type Row = { name: string; value: number };

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <ProCard
    bordered={false}
    style={{
      borderRadius: 12,
      background: `linear-gradient(135deg, ${color}14 0%, ${color}06 100%)`,
      border: `1px solid ${color}18`,
    }}
    styles={{ body: { padding: '20px 24px' } }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${color}22 0%, ${color}10 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 12,
            color: 'rgba(0,0,0,0.45)',
            marginBottom: 4,
            fontWeight: 500,
          }}
        >
          {title}
        </div>
        <Statistic
          value={value}
          valueStyle={{
            fontSize: 28,
            fontWeight: 700,
            color: 'rgba(0,0,0,0.88)',
            lineHeight: 1.2,
          }}
          suffix=""
        />
      </div>
    </div>
  </ProCard>
);

export default () => {
  const intl = useIntl();
  const [loading, setLoading] = useState(true);
  const [barData, setBarData] = useState<Row[]>([]);
  const [pieData, setPieData] = useState<(Row & { percent?: string })[]>([]);

  const totalNotes = useMemo(() => barData.reduce((s, r) => s + r.value, 0), [barData]);
  const categoryCount = barData.length;

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
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={12}>
            <StatCard
              title={intl.formatMessage({ id: 'pages.cloud.stats.noteCountMetric' })}
              value={totalNotes}
              icon={<FileTextOutlined />}
              color="#3b82f6"
            />
          </Col>
          <Col xs={24} sm={12}>
            <StatCard
              title={intl.formatMessage({ id: 'pages.cloud.stats.categoryCountMetric' })}
              value={categoryCount}
              icon={<AppstoreOutlined />}
              color="#10b981"
            />
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <ProCard
              className="statsSectionCard"
              bordered={false}
              title={intl.formatMessage({ id: 'pages.cloud.stats.barByCategory' })}
            >
              <CardChart id="user-cat-bar" chartType="bar" data={barData} height={380} />
            </ProCard>
          </Col>
          <Col xs={24} lg={12}>
            <ProCard
              className="statsSectionCard"
              bordered={false}
              title={intl.formatMessage({ id: 'pages.cloud.stats.pieByCategory' })}
            >
              <CardChart id="user-cat-pie" chartType="pie" data={pieData} height={380} />
            </ProCard>
          </Col>
        </Row>
      </Spin>
    </PageContainer>
  );
};
