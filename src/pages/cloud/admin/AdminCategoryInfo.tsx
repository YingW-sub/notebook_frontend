/**
 * 管理员 — 分类说明（分类数据按用户隔离，请在「用户笔记」中查看各笔记的分类标签）
 */
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Typography } from 'antd';
import React from 'react';

export default () => {
  const intl = useIntl();
  return (
    <PageContainer>
      <Typography.Paragraph>
        {intl.formatMessage({ id: 'pages.cloud.admin.categoryInfo' })}
      </Typography.Paragraph>
    </PageContainer>
  );
};
