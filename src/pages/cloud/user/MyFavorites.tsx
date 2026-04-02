/**
 * 普通用户 — 我的收藏
 */
import NoteEditModal from '@/components/NoteEditModal';
import NoteViewModal from '@/components/NoteViewModal';
import { deleteNote, listNote, toggleFavorite } from '@/services/api/note';
import { convertPageData } from '@/utils/request';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Modal, message } from 'antd';
import React, { useRef, useState } from 'react';

export default () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | undefined>();
  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState<number | undefined>();

  const columns: ProColumns<API.NoteVO>[] = [
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.title' }),
      dataIndex: 'title',
      ellipsis: true,
      render: (_, record) => (
        <a
          onClick={() => {
            setViewId(record.id);
            setViewOpen(true);
          }}
        >
          {record.title}
        </a>
      ),
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
      render: (_, record) => (
        <span
          role="presentation"
          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
          onClick={async (e) => {
            e.stopPropagation();
            try {
              await toggleFavorite(record.id as number, { throwError: true });
              message.success(
                intl.formatMessage({
                  id: record.isStarred ? 'pages.cloud.msg.unfavorited' : 'pages.cloud.msg.favorited',
                }),
              );
              actionRef.current?.reload();
            } catch {
              /* errorHandler 已提示 */
            }
          }}
        >
          {record.isStarred ? (
            <StarFilled style={{ color: '#fadb14', fontSize: 18 }} />
          ) : (
            <StarOutlined style={{ color: '#d9d9d9', fontSize: 18 }} />
          )}
        </span>
      ),
    },
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.createTime' }),
      dataIndex: 'createTime',
      width: 170,
      search: false,
      valueType: 'dateTime',
      sorter: true,
    },
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.updateTime' }),
      dataIndex: 'updateTime',
      width: 170,
      search: false,
      valueType: 'dateTime',
      sorter: true,
    },
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.operation' }),
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, record) => [
        <a
          key="view"
          onClick={() => {
            setViewId(record.id);
            setViewOpen(true);
          }}
        >
          <EyeOutlined /> {intl.formatMessage({ id: 'pages.cloud.action.view' })}
        </a>,
        <a
          key="edit"
          onClick={() => {
            setEditId(record.id as number);
            setModalOpen(true);
          }}
        >
          <EditOutlined /> {intl.formatMessage({ id: 'pages.cloud.action.edit' })}
        </a>,
        <a
          key="del"
          onClick={() => {
            Modal.confirm({
              title: intl.formatMessage({ id: 'pages.cloud.confirm.moveToRecycle' }),
              okText: intl.formatMessage({ id: 'pages.cloud.common.ok' }),
              cancelText: intl.formatMessage({ id: 'pages.cloud.common.cancel' }),
              onOk: async () => {
                try {
                  await deleteNote(record.id as number, {
                    throwError: true,
                    skipErrorHandler: true,
                  });
                  message.success(intl.formatMessage({ id: 'pages.cloud.msg.deleted' }));
                  actionRef.current?.reload();
                } catch (e: unknown) {
                  const er = e as { info?: { message?: string }; message?: string };
                  message.error(
                    er?.info?.message ||
                      er?.message ||
                      intl.formatMessage({ id: 'pages.cloud.msg.deleteFailed' }),
                  );
                  throw e;
                }
              },
            });
          }}
        >
          <DeleteOutlined /> {intl.formatMessage({ id: 'pages.cloud.action.delete' })}
        </a>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.NoteVO>
        headerTitle={intl.formatMessage({ id: 'pages.cloud.header.myFavorites' })}
        actionRef={actionRef}
        rowKey="id"
        search={false}
        request={async (params) => {
          const res = await listNote({
            current: params.current || 1,
            pageSize: params.pageSize || 10,
            onlyStarred: true,
          });
          return convertPageData(res);
        }}
        columns={columns}
        scroll={{ x: 1060 }}
      />
      <NoteViewModal
        open={viewOpen}
        noteId={viewId}
        onClose={() => {
          setViewOpen(false);
          setViewId(undefined);
        }}
        onEdit={(id) => {
          setEditId(id);
          setModalOpen(true);
        }}
      />
      <NoteEditModal
        open={modalOpen}
        noteId={editId}
        onClose={(saved) => {
          setModalOpen(false);
          setEditId(undefined);
          if (saved) actionRef.current?.reload();
        }}
      />
    </PageContainer>
  );
};
