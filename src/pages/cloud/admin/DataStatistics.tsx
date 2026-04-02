/**
 * 管理员（root）— 数据统计：笔记/用户概览 + 各用户笔记数量柱状图
 */
import Bar2D from '@/components/Bar2D';
import { getStatsOverview, getUserNoteCountStats } from '@/services/api/admin';
import { FileTextOutlined, TeamOutlined } from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Col, Row, Statistic, Spin } from 'antd';
import React, { useEffect, useState } from 'react';

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
  const [noteCount, setNoteCount] = useState<number>(0);
  const [userCount, setUserCount] = useState<number>(0);
  const [xData, setXData] = useState<string[]>([]);
  const [yData, setYData] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [overview, raw] = await Promise.all([
          getStatsOverview(),
          getUserNoteCountStats({ topN: 50 }),
        ]);
        if (overview) {
          setNoteCount(Number(overview.noteCount ?? 0));
          setUserCount(Number(overview.userCount ?? 0));
        }
        const list = raw || [];
        setXData(
          list.map((row: Record<string, any>) => {
            const name = row.userName ?? row.user_name ?? '';
            const code = row.userCode ?? row.user_code ?? '';
            return String(name || code || '—');
          }),
        );
        setYData(
          list.map((row: Record<string, any>) => Number(row.noteCount ?? row.note_count ?? 0)),
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
              value={noteCount}
              icon={<FileTextOutlined />}
              color="#3b82f6"
            />
          </Col>
          <Col xs={24} sm={12}>
            <StatCard
              title={intl.formatMessage({ id: 'pages.cloud.stats.userCountMetric' })}
              value={userCount}
              icon={<TeamOutlined />}
              color="#10b981"
            />
          </Col>
        </Row>
        <ProCard
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow:
              '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)',
            border: '1px solid rgba(15, 23, 42, 0.06)',
          }}
          title={
            <span style={{ fontSize: 15, fontWeight: 600 }}>
              {intl.formatMessage({ id: 'pages.cloud.stats.topUserNotes' })}
            </span>
          }
        >
          {xData.length === 0 && !loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#999' }}>
              {intl.formatMessage({ id: 'pages.cloud.stats.empty' })}
            </div>
          ) : (
            <Bar2D id="admin-user-note-bar" xData={xData} yData={yData} style={{ height: 400 }} />
          )}
        </ProCard>
      </Spin>
    </PageContainer>
  );
};
