import { getNote } from '@/services/api/note';
import { listCategory } from '@/services/api/category';
import { isRichHtmlContent } from '@/utils/note-content';
import { unwrapNoteDto } from '@/utils/note-dto';
import 'react-quill/dist/quill.snow.css';
import NoteAnnotationPanel from '@/components/NoteAnnotationPanel';
import { useIntl } from '@umijs/max';
import { Button, Col, Empty, Modal, Row, Spin, Tag, Typography, message } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './index.less';

export type NoteViewModalProps = {
  open: boolean;
  noteId?: number;
  onClose: () => void;
  /** 在查看弹窗中点击「编辑」时回调，由父级打开编辑弹窗 */
  onEdit?: (id: number) => void;
};

const NoteViewModal: React.FC<NoteViewModalProps> = ({ open, noteId, onClose, onEdit }) => {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const [dto, setDto] = useState<API.NoteDTO | null>(null);
  const [categoryMap, setCategoryMap] = useState<Map<number, string>>(new Map());
  const loadSeqRef = useRef(0);

  const load = useCallback(async (id: number) => {
    const seq = ++loadSeqRef.current;
    setLoading(true);
    setDto(null);
    try {
      const [raw, cats] = await Promise.all([
        getNote(id, { throwError: true, skipErrorHandler: true }),
        listCategory(),
      ]);
      if (seq !== loadSeqRef.current) return;
      const map = new Map<number, string>();
      (cats || []).forEach((c) => {
        if (c.id != null) map.set(c.id, c.categoryName || String(c.id));
      });
      setCategoryMap(map);
      const unwrapped = unwrapNoteDto(raw);
      if (unwrapped) {
        setDto(unwrapped);
      } else {
        message.error(intl.formatMessage({ id: 'pages.cloud.noteEdit.loadEmpty' }));
      }
    } catch (e: unknown) {
      if (seq !== loadSeqRef.current) return;
      const err = e as { message?: string; info?: { message?: string } };
      message.error(
        err?.info?.message ||
          err?.message ||
          intl.formatMessage({ id: 'pages.cloud.noteEdit.loadFailed' }),
      );
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
    }
  }, [intl]);

  useEffect(() => {
    if (!open) {
      loadSeqRef.current += 1;
      setDto(null);
      return;
    }
    if (!noteId) {
      setDto(null);
      return;
    }
    const t = window.setTimeout(() => void load(noteId), 0);
    return () => clearTimeout(t);
  }, [open, noteId, load]);

  const categoryIds = (dto?.categoryIds as number[] | undefined) || [];
  const content = (dto?.content as string | undefined) ?? '';

  return (
    <Modal
      title={intl.formatMessage({ id: 'pages.cloud.noteView.title' })}
      open={open}
      onCancel={onClose}
      width={960}
      style={{ top: 24 }}
      styles={{ body: { maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' } }}
      destroyOnClose
      footer={[
        <Button key="close" onClick={onClose}>
          {intl.formatMessage({ id: 'pages.cloud.noteView.close' })}
        </Button>,
        ...(noteId != null && onEdit
          ? [
              <Button
                key="edit"
                type="primary"
                onClick={() => {
                  onClose();
                  onEdit(noteId);
                }}
              >
                {intl.formatMessage({ id: 'pages.cloud.noteView.editNote' })}
              </Button>,
            ]
          : []),
      ]}
    >
      <Spin spinning={loading}>
        {!dto && !loading ? (
          <Empty description={intl.formatMessage({ id: 'pages.cloud.noteView.empty' })} />
        ) : dto ? (
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <Typography.Title level={4} style={{ marginTop: 0 }}>
              {(dto.title as string) || intl.formatMessage({ id: 'pages.cloud.noteView.noTitle' })}
            </Typography.Title>
            {(dto.summary as string)?.trim() ? (
              <div style={{ marginBottom: 16 }}>
                <Typography.Text type="secondary">
                  {intl.formatMessage({ id: 'pages.cloud.noteView.summaryLabel' })}
                </Typography.Text>
                <div style={{ marginTop: 4, color: 'rgba(0,0,0,0.65)' }}>{dto.summary as string}</div>
              </div>
            ) : null}
            {categoryIds.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <Typography.Text type="secondary">
                  {intl.formatMessage({ id: 'pages.cloud.noteView.categoryLabel' })}
                </Typography.Text>
                <div style={{ marginTop: 8 }}>
                  {categoryIds.map((cid) => (
                    <Tag key={cid} color="blue">
                      {categoryMap.get(cid) ?? `ID ${cid}`}
                    </Tag>
                  ))}
                </div>
              </div>
            ) : null}
            <Typography.Text type="secondary">
              {isRichHtmlContent(content)
                ? intl.formatMessage({ id: 'pages.cloud.noteView.bodyRich' })
                : intl.formatMessage({ id: 'pages.cloud.noteView.bodyPlain' })}
            </Typography.Text>
            {isRichHtmlContent(content) ? (
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col xs={24} lg={15}>
                  <div
                    className="ql-snow note-view-rich"
                    style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: 6,
                      background: '#fafafa',
                      maxHeight: 'min(520px, 55vh)',
                      overflow: 'auto',
                    }}
                  >
                    <div
                      className="ql-editor"
                      style={{ minHeight: 120 }}
                      dangerouslySetInnerHTML={{ __html: content || '<p><br></p>' }}
                    />
                  </div>
                </Col>
                <Col xs={24} lg={9}>
                  <NoteAnnotationPanel html={content} />
                </Col>
              </Row>
            ) : (
              <pre
                style={{
                  marginTop: 8,
                  marginBottom: 0,
                  padding: 12,
                  background: '#fafafa',
                  border: '1px solid #f0f0f0',
                  borderRadius: 6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: 14,
                  lineHeight: 1.65,
                  maxHeight: 'min(520px, 55vh)',
                  overflow: 'auto',
                }}
              >
                {content || intl.formatMessage({ id: 'pages.cloud.noteView.bodyEmpty' })}
              </pre>
            )}
          </div>
        ) : null}
      </Spin>
    </Modal>
  );
};

export default NoteViewModal;
