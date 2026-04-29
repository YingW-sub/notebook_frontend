/**
 * 管理员 — 分类说明
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
