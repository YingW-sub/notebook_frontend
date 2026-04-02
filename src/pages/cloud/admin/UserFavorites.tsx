/**
 * 管理员（root）— 全站用户收藏笔记，只读
 */
import { listNote } from '@/services/api/note';
import { convertPageData } from '@/utils/request';
import { PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Modal, Space, Typography } from 'antd';
import React, { useState } from 'react';
import { StarFilled } from '@ant-design/icons';

export default () => {
  const intl = useIntl();
  const [preview, setPreview] = useState<API.NoteVO | null>(null);

  const columns: ProColumns<API.NoteVO>[] = [
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.title' }),
      dataIndex: 'title',
      ellipsis: true,
      render: (_, record) => (
        <a onClick={() => setPreview(record)}>{record.title}</a>
      ),
    },
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.owner' }),
      dataIndex: 'ownerName',
      width: 120,
      ellipsis: true,
      render: (_, record) => record.ownerName || '-',
    },
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.summary' }),
      dataIndex: 'summary',
      ellipsis: true,
      search: false,
    },
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.favorite' }),
      dataIndex: 'isStarred',
      width: 72,
      search: false,
      render: () => <StarFilled style={{ color: '#fadb14', fontSize: 18 }} />,
    },
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.updateTime' }),
      dataIndex: 'updateTime',
      width: 170,
      search: false,
      valueType: 'dateTime',
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.NoteVO>
        headerTitle={intl.formatMessage({ id: 'pages.cloud.header.adminUserFavorites' })}
        rowKey="id"
        search={false}
        options={{ density: true, reload: true, setting: true }}
        toolBarRender={false}
        request={async (params) => {
          const res = await listNote({
            current: params.current || 1,
            pageSize: params.pageSize || 10,
            onlyStarred: true,
          });
          return convertPageData(res);
        }}
        columns={columns}
        scroll={{ x: 960 }}
      />
      <Modal
        title={preview?.title}
        open={!!preview}
        onCancel={() => setPreview(null)}
        footer={null}
        width={640}
      >
        {preview && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Typography.Text type="secondary">
                {intl.formatMessage({ id: 'pages.cloud.admin.expandOwner' })}
              </Typography.Text>{' '}
              {preview.ownerName || '-'}
            </div>
            <Typography.Paragraph>{preview.summary || '—'}</Typography.Paragraph>
          </Space>
        )}
      </Modal>
    </PageContainer>
  );
};
