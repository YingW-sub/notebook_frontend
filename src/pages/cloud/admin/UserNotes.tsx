/**
 * 管理员（root）— 全站用户笔记，只读
 */
import { listNote } from '@/services/api/note';
import { convertPageData } from '@/utils/request';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Tag } from 'antd';
import React, { useRef } from 'react';
import { StarFilled, StarOutlined } from '@ant-design/icons';

export default () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>(null);

  const columns: ProColumns<API.NoteVO>[] = [
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.noteId' }),
      dataIndex: 'id',
      width: 100,
      search: false,
    },
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.title' }),
      dataIndex: 'title',
      ellipsis: true,
      width: 200,
      fieldProps: {
        placeholder: intl.formatMessage({ id: 'pages.cloud.placeholder.input' }),
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.ownerQuery' }),
      dataIndex: 'ownerUserCode',
      hideInTable: true,
      fieldProps: {
        placeholder: intl.formatMessage({ id: 'pages.cloud.col.ownerQueryPh' }),
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.owner' }),
      dataIndex: 'ownerName',
      width: 140,
      search: false,
      ellipsis: true,
      render: (_, record) => record.ownerName || '-',
    },
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.category' }),
      dataIndex: 'categories',
      width: 180,
      search: false,
      render: (_, record) =>
        (record.categories || []).map((c) => (
          <Tag key={c.id}>{c.categoryName}</Tag>
        )),
    },
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.favorite' }),
      dataIndex: 'isStarred',
      width: 72,
      search: false,
      render: (_, record) =>
        record.isStarred ? (
          <StarFilled style={{ color: '#fadb14', fontSize: 18 }} />
        ) : (
          <StarOutlined style={{ color: '#d9d9d9', fontSize: 18 }} />
        ),
    },
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.createTime' }),
      dataIndex: 'createTime',
      width: 170,
      search: false,
      valueType: 'dateTime',
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
        actionRef={actionRef}
        rowKey="id"
        options={{
          density: true,
          reload: true,
          setting: true,
        }}
        toolBarRender={() => []}
        request={async (params) => {
          const title =
            typeof params.title === 'string' ? params.title.trim() : undefined;
          const ownerUserCode =
            typeof params.ownerUserCode === 'string'
              ? params.ownerUserCode.trim()
              : undefined;
          const res = await listNote({
            current: params.current || 1,
            pageSize: params.pageSize || 10,
            ...(title ? { title } : {}),
            ...(ownerUserCode ? { ownerUserCode } : {}),
          } as API.NoteQueryDTO);
          return convertPageData(res);
        }}
        columns={columns}
        scroll={{ x: 1200 }}
      />
    </PageContainer>
  );
};
