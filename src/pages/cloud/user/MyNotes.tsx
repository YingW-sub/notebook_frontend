/**
 * 普通用户 — 我的笔记（置顶、排序、导入、收藏、删除等）
 */
import NoteEditModal, { type NoteEditDraft } from '@/components/NoteEditModal';
import NoteSortDrawer from '@/components/NoteSortDrawer';
import NoteViewModal from '@/components/NoteViewModal';
import {
  deleteNote,
  importDocument,
  listNote,
  toggleFavorite,
  togglePin,
} from '@/services/api/note';
import { downloadNoteExport } from '@/utils/note-export';
import { plainTextToQuillHtml } from '@/utils/plainTextToQuillHtml';
import { convertPageData } from '@/utils/request';
import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  EyeOutlined,
  HolderOutlined,
  PlusOutlined,
  PushpinFilled,
  PushpinOutlined,
  StarFilled,
  StarOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Button,
  Dropdown,
  Modal,
  Tag,
  Tooltip,
  message,
} from 'antd';
import React, { useMemo, useRef, useState } from 'react';

export default () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | undefined>();
  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState<number | undefined>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [sortDrawerOpen, setSortDrawerOpen] = useState(false);
  const [sortItems, setSortItems] = useState<{ id: number; title?: string }[]>([]);
  const [importDraft, setImportDraft] = useState<NoteEditDraft | null>(null);
  const [draftKey, setDraftKey] = useState(0);
  const [importBusy, setImportBusy] = useState(false);

  const exportMenu = useMemo(
    () => (noteId: number) => ({
      items: [
        {
          key: 'md',
          label: intl.formatMessage({ id: 'pages.cloud.export.markdown' }),
          onClick: () => void downloadNoteExport('markdown', noteId),
        },
        {
          key: 'word',
          label: intl.formatMessage({ id: 'pages.cloud.export.word' }),
          onClick: () => void downloadNoteExport('word', noteId),
        },
        {
          key: 'pdf',
          label: intl.formatMessage({ id: 'pages.cloud.export.pdf' }),
          onClick: () => void downloadNoteExport('pdf', noteId),
        },
      ],
    }),
    [intl],
  );

  const openSortDrawer = async () => {
    try {
      const res = await listNote({ current: 1, pageSize: 2000 });
      const list = (res?.list || []) as API.NoteVO[];
      setSortItems(list.map((n) => ({ id: n.id as number, title: n.title as string })));
      setSortDrawerOpen(true);
    } catch {
      message.error(intl.formatMessage({ id: 'pages.cloud.msg.loadListFailed' }));
    }
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportBusy(true);
    try {
      const r = await importDocument(file, { throwError: true, skipErrorHandler: true });
      if (!r?.plainText?.trim()) {
        message.error(intl.formatMessage({ id: 'pages.cloud.msg.extractTextFailed' }));
        return;
      }
      const docType = r.sourceType || intl.formatMessage({ id: 'pages.cloud.msg.document' });
      setImportDraft({
        title: r.title || file.name.replace(/\.[^.]+$/, ''),
        content: plainTextToQuillHtml(r.plainText),
        summary: intl.formatMessage({ id: 'pages.cloud.msg.importSummaryPrefix' }, { type: docType }),
      });
      setDraftKey((k) => k + 1);
      setEditId(undefined);
      setModalOpen(true);
      message.success(intl.formatMessage({ id: 'pages.cloud.msg.importBodyOk' }));
    } catch (err: unknown) {
      const e2 = err as { info?: { message?: string }; message?: string };
      message.error(
        e2?.info?.message || e2?.message || intl.formatMessage({ id: 'pages.cloud.msg.importFailed' }),
      );
    } finally {
      setImportBusy(false);
    }
  };

  const columns: ProColumns<API.NoteVO>[] = [
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.pin' }),
      width: 64,
      search: false,
      render: (_, record) => {
        const pinned = Boolean(record.pinned);
        return (
          <Tooltip
            title={intl.formatMessage({
              id: pinned ? 'pages.cloud.tooltip.unpin' : 'pages.cloud.tooltip.pin',
            })}
          >
            <span
              role="presentation"
              style={{ cursor: 'pointer', fontSize: 18 }}
              onClick={async (ev) => {
                ev.stopPropagation();
                try {
                  await togglePin(record.id as number, { throwError: true });
                  message.success(
                    intl.formatMessage({
                      id: pinned ? 'pages.cloud.msg.unpinned' : 'pages.cloud.msg.pinned',
                    }),
                  );
                  actionRef.current?.reload();
                } catch (e: unknown) {
                  const er = e as { info?: { message?: string }; message?: string };
                  message.error(
                    er?.info?.message ||
                      er?.message ||
                      intl.formatMessage({ id: 'pages.cloud.msg.operationFailed' }),
                  );
                }
              }}
            >
              {pinned ? (
                <PushpinFilled style={{ color: '#faad14' }} />
              ) : (
                <PushpinOutlined style={{ color: '#bfbfbf' }} />
              )}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.title' }),
      dataIndex: 'title',
      ellipsis: true,
      width: 200,
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
      title: intl.formatMessage({ id: 'pages.cloud.col.category' }),
      dataIndex: 'categories',
      search: false,
      width: 160,
      render: (_, record) =>
        (record.categories || []).map((c: { id: number; categoryName: string }) => (
          <Tag key={c.id} color="blue">
            {c.categoryName}
          </Tag>
        )),
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
            } catch (err: unknown) {
              const er = err as { info?: { message?: string }; message?: string };
              message.error(
                er?.info?.message ||
                  er?.message ||
                  intl.formatMessage({ id: 'pages.cloud.msg.favoriteFailed' }),
              );
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
      width: 300,
      fixed: 'right',
      render: (_, record) => {
        return [
          <a
            key="view"
            onClick={() => {
              setViewId(record.id);
              setViewOpen(true);
            }}
          >
            <EyeOutlined /> {intl.formatMessage({ id: 'pages.cloud.action.view' })}
          </a>,
          <Dropdown key="export" menu={exportMenu(record.id as number)} trigger={['click']}>
            <a onClick={(ev) => ev.preventDefault()}>
              <ExportOutlined /> {intl.formatMessage({ id: 'pages.cloud.action.export' })}
            </a>
          </Dropdown>,
          <a
            key="edit"
            onClick={() => {
              setEditId(record.id as number);
              setImportDraft(null);
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
        ];
      },
    },
  ];

  const toolbarExportId =
    selectedRowKeys.length === 1 ? Number(selectedRowKeys[0]) : undefined;

  return (
    <PageContainer>
      <input
        ref={importInputRef}
        type="file"
        accept=".txt,.text,.doc,.docx,.pdf"
        style={{ display: 'none' }}
        onChange={onImportFile}
      />
      <ProTable<API.NoteVO>
        headerTitle={intl.formatMessage({ id: 'pages.cloud.header.myNotes' })}
        actionRef={actionRef}
        rowKey="id"
        search={false}
        rowSelection={{
          type: 'radio',
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        options={{
          density: true,
          reload: true,
          setting: true,
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="add"
            onClick={() => {
              setEditId(undefined);
              setImportDraft(null);
              setModalOpen(true);
            }}
          >
            <PlusOutlined /> {intl.formatMessage({ id: 'pages.cloud.toolbar.new' })}
          </Button>,
          <Button
            key="import"
            loading={importBusy}
            icon={<UploadOutlined />}
            onClick={() => importInputRef.current?.click()}
          >
            {intl.formatMessage({ id: 'pages.cloud.toolbar.import' })}
          </Button>,
          <Button key="sort" icon={<HolderOutlined />} onClick={() => void openSortDrawer()}>
            {intl.formatMessage({ id: 'pages.cloud.toolbar.sort' })}
          </Button>,
          <Tooltip
            key="export-tip"
            title={
              toolbarExportId == null
                ? intl.formatMessage({ id: 'pages.cloud.toolbar.exportTooltip' })
                : undefined
            }
          >
            <span>
              <Dropdown
                disabled={toolbarExportId == null}
                menu={
                  toolbarExportId != null ? exportMenu(toolbarExportId) : { items: [] }
                }
                trigger={['click']}
              >
                <Button icon={<ExportOutlined />} disabled={toolbarExportId == null}>
                  {intl.formatMessage({ id: 'pages.cloud.action.export' })}
                </Button>
              </Dropdown>
            </span>
          </Tooltip>,
        ]}
        tableAlertRender={false}
        request={async (params) => {
          const res = await listNote({
            current: params.current || 1,
            pageSize: params.pageSize || 10,
          });
          return convertPageData(res);
        }}
        columns={columns}
        scroll={{ x: 1280 }}
      />
      <NoteSortDrawer
        open={sortDrawerOpen}
        items={sortItems}
        onClose={() => setSortDrawerOpen(false)}
        onSaved={() => actionRef.current?.reload()}
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
          setImportDraft(null);
          setModalOpen(true);
        }}
      />
      <NoteEditModal
        open={modalOpen}
        noteId={editId}
        initialDraft={importDraft}
        draftKey={draftKey}
        onClose={(saved) => {
          setModalOpen(false);
          setEditId(undefined);
          setImportDraft(null);
          if (saved) actionRef.current?.reload();
        }}
      />
    </PageContainer>
  );
};
