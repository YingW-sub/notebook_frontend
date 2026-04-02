/**
 * 普通用户 — 回收站（15 天内可恢复；可永久删除；超期不可恢复）
 */
import { listDeletedNotes, permanentDeleteNote, restoreNote } from '@/services/api/note';
import { convertPageData } from '@/utils/request';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Modal, Typography, message } from 'antd';
import React, { useRef } from 'react';

const RETENTION_MS = 15 * 24 * 60 * 60 * 1000;

function retentionHint(
  deleteTime: string | undefined,
  intl: { formatMessage: (descriptor: { id: string }, values?: Record<string, number>) => string },
) {
  if (!deleteTime) return { expired: false, text: '—' };
  const t = new Date(deleteTime).getTime();
  if (Number.isNaN(t)) return { expired: false, text: '—' };
  const end = t + RETENTION_MS;
  const left = end - Date.now();
  if (left <= 0)
    return { expired: true, text: intl.formatMessage({ id: 'pages.cloud.recycle.expired' }) };
  const d = Math.floor(left / (24 * 60 * 60 * 1000));
  const h = Math.floor((left % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const m = Math.floor((left % (60 * 60 * 1000)) / (60 * 1000));
  return {
    expired: false,
    text: intl.formatMessage(
      { id: 'pages.cloud.recycle.remaining' },
      { days: d, hours: h, minutes: m },
    ),
  };
}

export default () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>(null);

  const columns: ProColumns<API.NoteVO>[] = [
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.title' }),
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.summary' }),
      dataIndex: 'summary',
      ellipsis: true,
      search: false,
    },
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.deleteTime' }),
      dataIndex: 'deleteTime',
      width: 170,
      search: false,
      valueType: 'dateTime',
    },
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.retention' }),
      width: 200,
      search: false,
      render: (_, record) => {
        const { text, expired } = retentionHint(record.deleteTime as string, intl);
        return (
          <Typography.Text type={expired ? 'danger' : 'secondary'}>{text}</Typography.Text>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.operation' }),
      valueType: 'option',
      width: 220,
      render: (_, record) => {
        const { expired } = retentionHint(record.deleteTime as string, intl);
        return [
          <a
            key="restore"
            style={expired ? { color: '#bfbfbf', pointerEvents: 'none' } : undefined}
            onClick={() => {
              if (expired) {
                message.warning(intl.formatMessage({ id: 'pages.cloud.msg.retentionExpired' }));
                return;
              }
              Modal.confirm({
                title: intl.formatMessage({ id: 'pages.cloud.confirm.restore' }),
                okText: intl.formatMessage({ id: 'pages.cloud.action.restore' }),
                cancelText: intl.formatMessage({ id: 'pages.cloud.common.cancel' }),
                onOk: async () => {
                  try {
                    await restoreNote(record.id as number, {
                      throwError: true,
                      skipErrorHandler: true,
                    });
                    message.success(intl.formatMessage({ id: 'pages.cloud.msg.restored' }));
                    actionRef.current?.reload();
                  } catch (e: unknown) {
                    const er = e as { info?: { message?: string }; message?: string };
                    message.error(
                      er?.info?.message ||
                        er?.message ||
                        intl.formatMessage({ id: 'pages.cloud.msg.restoreFailed' }),
                    );
                    throw e;
                  }
                },
              });
            }}
          >
            {intl.formatMessage({ id: 'pages.cloud.action.restore' })}
          </a>,
          <a
            key="perm"
            style={expired ? { color: '#bfbfbf', pointerEvents: 'none' } : undefined}
            onClick={() => {
              if (expired) {
                message.warning(intl.formatMessage({ id: 'pages.cloud.msg.retentionWarning' }));
                return;
              }
              Modal.confirm({
                title: intl.formatMessage({ id: 'pages.cloud.confirm.permanentDelete' }),
                okText: intl.formatMessage({ id: 'pages.cloud.action.permanentDelete' }),
                okType: 'danger',
                cancelText: intl.formatMessage({ id: 'pages.cloud.common.cancel' }),
                onOk: async () => {
                  try {
                    await permanentDeleteNote(record.id as number, {
                      throwError: true,
                      skipErrorHandler: true,
                    });
                    message.success(intl.formatMessage({ id: 'pages.cloud.msg.permanentDeleted' }));
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
            {intl.formatMessage({ id: 'pages.cloud.action.permanentDelete' })}
          </a>,
        ];
      },
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.NoteVO>
        headerTitle={intl.formatMessage({ id: 'pages.cloud.header.recycleBin' })}
        actionRef={actionRef}
        rowKey="id"
        search={false}
        request={async (params) => {
          const res = await listDeletedNotes({
            current: params.current || 1,
            pageSize: params.pageSize || 10,
          });
          return convertPageData(res);
        }}
        columns={columns}
        scroll={{ x: 960 }}
      />
    </PageContainer>
  );
};
