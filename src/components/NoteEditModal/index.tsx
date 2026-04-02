import NoteAnnotationPanel from '@/components/NoteAnnotationPanel';
import NoteRichTextEditor, {
  type NoteEditorPagingMeta,
  type NoteRichTextEditorHandle,
} from '@/components/NoteRichTextEditor';
import { addNote, getNote, updateNote } from '@/services/api/note';
import { addCategory, listCategory } from '@/services/api/category';
import { normalizeNoteHtml } from '@/utils/note-content';
import { unwrapNoteDto } from '@/utils/note-dto';
import { CompressOutlined, ExpandOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Col, Form, Input, Modal, Row, Select, Space, Typography, message } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './index.less';

export type NoteEditDraft = {
  title?: string;
  content?: string;
  summary?: string;
};

export type NoteEditModalProps = {
  open: boolean;
  noteId?: number;
  onClose: (saved: boolean) => void;
  /** 导入文档等场景预填表单 */
  initialDraft?: NoteEditDraft | null;
  draftKey?: number;
};

const NoteEditModal: React.FC<NoteEditModalProps> = ({
  open,
  noteId,
  onClose,
  initialDraft,
  draftKey = 0,
}) => {
  const intl = useIntl();
  const [form] = Form.useForm<API.NoteDTO>();
  const watchedContent = Form.useWatch('content', form) ?? '';
  const [loading, setLoading] = useState(false);
  const [creatingCat, setCreatingCat] = useState(false);
  const [categories, setCategories] = useState<API.CategoryDTO[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [contentFullscreen, setContentFullscreen] = useState(false);
  const [pagingMeta, setPagingMeta] = useState<NoteEditorPagingMeta | null>(null);
  const loadSeqRef = useRef(0);
  const editorRef = useRef<NoteRichTextEditorHandle>(null);

  const handlePagingMetaChange = useCallback((meta: NoteEditorPagingMeta) => {
    setPagingMeta(meta);
  }, []);

  const reloadCategories = useCallback(async () => {
    const list = await listCategory();
    setCategories(list || []);
  }, []);

  useEffect(() => {
    if (!open) return;
    void reloadCategories();
  }, [open, reloadCategories]);

  const loadNoteIntoForm = useCallback(
    async (id: number) => {
      const seq = ++loadSeqRef.current;
      setLoading(true);
      try {
        const raw = await getNote(id, { throwError: true, skipErrorHandler: true });
        if (seq !== loadSeqRef.current) return;
        const dto = unwrapNoteDto(raw);
        if (dto) {
          form.setFieldsValue({
            title: dto.title ?? '',
            summary: dto.summary ?? '',
            content: dto.content ?? '',
            categoryIds: dto.categoryIds ?? [],
          });
        } else {
          message.error(intl.formatMessage({ id: 'pages.cloud.noteEdit.loadEmpty' }));
          form.resetFields();
        }
      } catch (e: unknown) {
        if (seq !== loadSeqRef.current) return;
        const err = e as { message?: string; info?: { message?: string } };
        message.error(
          err?.info?.message ||
            err?.message ||
            intl.formatMessage({ id: 'pages.cloud.noteEdit.loadFailed' }),
        );
        form.resetFields();
      } finally {
        if (seq === loadSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [form, intl],
  );

  useEffect(() => {
    if (!open) {
      loadSeqRef.current += 1;
      form.resetFields();
      setCategorySearch('');
      setCommentOpen(false);
      setCommentText('');
      setContentFullscreen(false);
      setPagingMeta(null);
      return;
    }
    if (noteId) {
      setCategorySearch('');
      const timer = window.setTimeout(() => {
        void loadNoteIntoForm(noteId);
      }, 0);
      return () => {
        clearTimeout(timer);
      };
    }
    setCategorySearch('');
    if (initialDraft) {
      form.setFieldsValue({
        title: initialDraft.title ?? '',
        summary: initialDraft.summary ?? '',
        content: initialDraft.content ?? '',
        categoryIds: [],
      });
    } else {
      form.resetFields();
    }
  }, [open, noteId, initialDraft, draftKey, form, loadNoteIntoForm]);

  useEffect(() => {
    if (!contentFullscreen) setPagingMeta(null);
  }, [contentFullscreen]);

  const trimmedSearch = categorySearch.trim();
  const canCreateCategory =
    trimmedSearch.length > 0 &&
    !categories.some((c) => (c.categoryName || '').trim() === trimmedSearch);

  const mergeCategoryId = (id: number) => {
    const raw = form.getFieldValue('categoryIds') as number[] | undefined;
    const ids = Array.isArray(raw) ? raw : [];
    if (!ids.includes(id)) {
      form.setFieldsValue({ categoryIds: [...ids, id] });
    }
  };

  const createCategoryFromSearch = async () => {
    const name = trimmedSearch;
    if (!name || creatingCat) return;

    const existing = categories.find((c) => (c.categoryName || '').trim() === name);
    if (existing?.id != null) {
      mergeCategoryId(existing.id);
      setCategorySearch('');
      return;
    }

    setCreatingCat(true);
    try {
      const newId = await addCategory({ categoryName: name }, { throwError: true });
      if (newId == null) {
        message.error(intl.formatMessage({ id: 'pages.cloud.noteEdit.createCatFailed' }));
        return;
      }
      await reloadCategories();
      mergeCategoryId(newId);
      message.success(intl.formatMessage({ id: 'pages.cloud.noteEdit.createCatOk' }));
      setCategorySearch('');
    } catch (e: unknown) {
      const err = e as { message?: string; info?: { errorMessage?: string } };
      const msg = String(err?.message || err?.info?.errorMessage || e || '');
      if (
        msg.includes('已存在') ||
        /\bexists\b|duplicate|already\s+exists|既に|すでに/i.test(msg)
      ) {
        await reloadCategories();
        const list = await listCategory();
        const found = (list || []).find((c) => (c.categoryName || '').trim() === name);
        if (found?.id != null) {
          setCategories(list || []);
          mergeCategoryId(found.id);
          message.info(intl.formatMessage({ id: 'pages.cloud.noteEdit.catExists' }));
          setCategorySearch('');
        } else {
          message.warning(msg);
        }
      } else {
        message.error(
          msg || intl.formatMessage({ id: 'pages.cloud.noteEdit.createCatFailedGeneric' }),
        );
      }
    } finally {
      setCreatingCat(false);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload: Record<string, unknown> = {
        ...values,
        content: normalizeNoteHtml(values.content as string),
      };
      setLoading(true);
      if (noteId) {
        const n = await updateNote({ ...payload, id: noteId });
        if (n !== undefined && n !== null)
          message.success(intl.formatMessage({ id: 'pages.cloud.noteEdit.saveOk' }));
      } else {
        const n = await addNote(payload);
        if (n !== undefined && n !== null)
          message.success(intl.formatMessage({ id: 'pages.cloud.noteEdit.createOk' }));
      }
      onClose(true);
      form.resetFields();
      setCategorySearch('');
      setContentFullscreen(false);
    } catch {
      /* validate */
    } finally {
      setLoading(false);
    }
  };

  const modalTitle = contentFullscreen
    ? intl.formatMessage({ id: 'pages.cloud.noteEdit.titleFullscreen' })
    : noteId
      ? intl.formatMessage({ id: 'pages.cloud.noteEdit.titleEdit' })
      : initialDraft
        ? intl.formatMessage({ id: 'pages.cloud.noteEdit.titleNewImport' })
        : intl.formatMessage({ id: 'pages.cloud.noteEdit.titleNew' });

  return (
    <Modal
      title={modalTitle}
      open={open}
      centered={!contentFullscreen}
      getContainer={() => document.body}
      onOk={handleOk}
      confirmLoading={loading}
      onCancel={() => {
        setContentFullscreen(false);
        onClose(false);
      }}
      width={contentFullscreen ? '100%' : 1040}
      style={contentFullscreen ? { top: 0, paddingBottom: 0, maxWidth: '100vw' } : { top: 24 }}
      styles={{
        body: contentFullscreen
          ? { maxHeight: undefined, overflow: 'hidden', padding: '8px 12px 10px', flex: 1, minHeight: 0 }
          : { maxHeight: 'calc(100vh - 168px)', overflowY: 'auto', paddingTop: 12 },
      }}
      wrapClassName={contentFullscreen ? 'note-edit-modal--content-full' : undefined}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        key={noteId != null ? String(noteId) : `new-${draftKey}`}
        style={
          contentFullscreen
            ? { display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, height: '100%' }
            : undefined
        }
      >
        {/* 全屏时仍挂载表单项（hidden），避免 preserve={false} 卸载导致标题/分类丢失 */}
        <>
            <Form.Item
              name="title"
              label={intl.formatMessage({ id: 'pages.cloud.noteEdit.labelTitle' })}
              hidden={contentFullscreen}
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({ id: 'pages.cloud.noteEdit.titleRequired' }),
                },
              ]}
            >
              <Input
                placeholder={intl.formatMessage({ id: 'pages.cloud.noteEdit.titlePh' })}
                maxLength={200}
                showCount
              />
            </Form.Item>
            <Form.Item
              name="summary"
              label={intl.formatMessage({ id: 'pages.cloud.noteEdit.labelSummary' })}
              hidden={contentFullscreen}
            >
              <Input.TextArea
                rows={2}
                placeholder={intl.formatMessage({ id: 'pages.cloud.noteEdit.summaryPh' })}
                maxLength={500}
                showCount
              />
            </Form.Item>
            <Form.Item
              name="categoryIds"
              label={intl.formatMessage({ id: 'pages.cloud.noteEdit.labelCategory' })}
              hidden={contentFullscreen}
            >
              <Select
                mode="multiple"
                allowClear
                showSearch
                searchValue={categorySearch}
                onSearch={setCategorySearch}
                onDropdownVisibleChange={(visible) => {
                  if (!visible) setCategorySearch('');
                }}
                placeholder={intl.formatMessage({ id: 'pages.cloud.noteEdit.categoryPh' })}
                options={categories.map((c) => ({
                  label: c.categoryName,
                  value: c.id!,
                }))}
                optionFilterProp="label"
                filterOption={(input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.trim().toLowerCase())
                }
                maxTagCount="responsive"
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    {canCreateCategory && (
                      <div
                        style={{
                          padding: '8px 12px',
                          cursor: creatingCat ? 'not-allowed' : 'pointer',
                          color: '#1677ff',
                          borderTop: '1px solid #f0f0f0',
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          if (!creatingCat) void createCategoryFromSearch();
                        }}
                      >
                        {creatingCat
                          ? intl.formatMessage({ id: 'pages.cloud.noteEdit.creatingCat' })
                          : intl.formatMessage(
                              { id: 'pages.cloud.noteEdit.createCategoryNamed' },
                              { name: trimmedSearch },
                            )}
                      </div>
                    )}
                  </>
                )}
              />
            </Form.Item>
        </>
        <Form.Item
          label={
            contentFullscreen ? undefined : intl.formatMessage({ id: 'pages.cloud.noteEdit.labelBody' })
          }
          tooltip={
            contentFullscreen
              ? undefined
              : intl.formatMessage({ id: 'pages.cloud.noteEdit.bodyTooltip' })
          }
          style={
            contentFullscreen
              ? { flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 0, minHeight: 0 }
              : undefined
          }
        >
          <Row gutter={12} style={{ width: '100%' }}>
            <Col xs={24} lg={contentFullscreen ? 24 : 15}>
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  ...(contentFullscreen ? { flex: 1, minHeight: 0 } : {}),
                }}
              >
                <Space size="small" wrap style={contentFullscreen ? { flexShrink: 0 } : undefined}>
                  {!contentFullscreen && (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {intl.formatMessage({ id: 'pages.cloud.noteEdit.readingHint' })}
                    </Typography.Text>
                  )}
                  <Button
                    type={contentFullscreen ? 'default' : 'primary'}
                    size="small"
                    icon={contentFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
                    onClick={() => setContentFullscreen((v) => !v)}
                  >
                    {contentFullscreen
                      ? intl.formatMessage({ id: 'pages.cloud.noteEdit.exitFullscreen' })
                      : intl.formatMessage({ id: 'pages.cloud.noteEdit.enterFullscreen' })}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      const ok = editorRef.current?.highlightSelection();
                      if (!ok)
                        message.warning(
                          intl.formatMessage({ id: 'pages.cloud.noteEdit.selectForHighlight' }),
                        );
                    }}
                  >
                    {intl.formatMessage({ id: 'pages.cloud.noteEdit.highlight' })}
                  </Button>
                  <Button size="small" onClick={() => setCommentOpen(true)}>
                    {intl.formatMessage({ id: 'pages.cloud.noteEdit.insertAnnotation' })}
                  </Button>
                  {contentFullscreen && (
                    <>
                      <Button
                        size="small"
                        disabled={!pagingMeta || pagingMeta.page <= 1}
                        onClick={() => editorRef.current?.scrollPage('prev')}
                      >
                        {intl.formatMessage({ id: 'pages.cloud.noteEdit.prevPage' })}
                      </Button>
                      <Button
                        size="small"
                        disabled={!pagingMeta || pagingMeta.page >= pagingMeta.pageCount}
                        onClick={() => editorRef.current?.scrollPage('next')}
                      >
                        {intl.formatMessage({ id: 'pages.cloud.noteEdit.nextPage' })}
                      </Button>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {pagingMeta
                          ? intl.formatMessage(
                              { id: 'pages.cloud.noteEdit.pageOf' },
                              {
                                current: pagingMeta.page,
                                total: pagingMeta.pageCount,
                              },
                            )
                          : intl.formatMessage({ id: 'pages.cloud.noteEdit.pageEllipsis' })}
                      </Typography.Text>
                    </>
                  )}
                </Space>
                <div
                  style={
                    contentFullscreen
                      ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }
                      : undefined
                  }
                >
                  <Form.Item name="content" noStyle>
                    <NoteRichTextEditor
                      ref={editorRef}
                      expanded={contentFullscreen}
                      onPagingMetaChange={contentFullscreen ? handlePagingMetaChange : undefined}
                    />
                  </Form.Item>
                </div>
              </div>
            </Col>
            {!contentFullscreen && (
              <Col xs={24} lg={9}>
                <NoteAnnotationPanel html={typeof watchedContent === 'string' ? watchedContent : ''} />
              </Col>
            )}
          </Row>
        </Form.Item>
      </Form>
      <Modal
        title={intl.formatMessage({ id: 'pages.cloud.noteEdit.annotationModalTitle' })}
        open={commentOpen}
        zIndex={contentFullscreen ? 1100 : undefined}
        destroyOnClose
        onOk={() => {
          const t = commentText.trim();
          if (!t) {
            message.warning(
              intl.formatMessage({ id: 'pages.cloud.noteEdit.annotationRequired' }),
            );
            return;
          }
          editorRef.current?.insertAnnotationAtCursor(t);
          setCommentOpen(false);
          setCommentText('');
        }}
        onCancel={() => {
          setCommentOpen(false);
          setCommentText('');
        }}
      >
        <Input.TextArea
          rows={4}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={intl.formatMessage({ id: 'pages.cloud.noteEdit.annotationPh' })}
        />
      </Modal>
    </Modal>
  );
};

export default NoteEditModal;
