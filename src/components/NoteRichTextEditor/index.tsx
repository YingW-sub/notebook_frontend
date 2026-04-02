import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import './index.less';

const toolbar = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ size: ['small', false, 'large', 'huge'] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  ['blockquote', 'link'],
  ['clean'],
];

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'size',
  'list',
  'bullet',
  'indent',
  'align',
  'blockquote',
  'link',
];

const modules = { toolbar };

export type NoteEditorPagingMeta = {
  page: number;
  pageCount: number;
};

export type NoteRichTextEditorHandle = {
  highlightSelection: () => boolean;
  insertAnnotationAtCursor: (text: string) => void;
  scrollPage: (dir: 'prev' | 'next') => void;
  getPagingMeta: () => NoteEditorPagingMeta | null;
};

export type NoteRichTextEditorProps = {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  expanded?: boolean;
  onPagingMetaChange?: (meta: NoteEditorPagingMeta) => void;
};

function readPagingMeta(root: HTMLElement): NoteEditorPagingMeta | null {
  const ch = root.clientHeight;
  const sh = root.scrollHeight;
  const st = root.scrollTop;
  if (ch <= 0) return null;
  const pageCount = Math.max(1, Math.ceil(sh / ch));
  const page = Math.min(pageCount, Math.floor(st / ch) + 1);
  return { page, pageCount };
}

const NoteRichTextEditor = forwardRef<NoteRichTextEditorHandle, NoteRichTextEditorProps>(
  (
    {
      value,
      onChange,
      placeholder = '在此输入正文，可使用工具栏设置格式',
      readOnly,
      expanded,
      onPagingMetaChange,
    },
    ref,
  ) => {
    const rqRef = useRef<ReactQuill>(null);
    const pagingCbRef = useRef(onPagingMetaChange);
    pagingCbRef.current = onPagingMetaChange;

    useImperativeHandle(ref, () => ({
      highlightSelection: () => {
        const quill = rqRef.current?.getEditor();
        if (!quill) return false;
        const range = quill.getSelection();
        if (!range || range.length === 0) return false;
        quill.format('background', '#fff566');
        return true;
      },
      insertAnnotationAtCursor: (text: string) => {
        const quill = rqRef.current?.getEditor();
        if (!quill || !text.trim()) return;
        quill.focus();
        const range = quill.getSelection(true);
        const index = range ? range.index : Math.max(0, quill.getLength() - 1);
        const safe = text
          .trim()
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
        // 使用引用块承载批注，右侧「批注」面板从正文解析【批注】汇总显示
        const html = `<blockquote><strong>【批注】</strong>${safe}</blockquote><p><br></p>`;
        quill.clipboard.dangerouslyPasteHTML(index, html);
      },
      scrollPage: (dir) => {
        const quill = rqRef.current?.getEditor();
        const root = quill?.root as HTMLElement | undefined;
        if (!root) return;
        const ch = root.clientHeight;
        const sh = root.scrollHeight;
        const st = root.scrollTop;
        if (ch <= 0) return;
        const delta = dir === 'next' ? ch : -ch;
        root.scrollTop = Math.max(0, Math.min(sh - ch, st + delta));
        const meta = readPagingMeta(root);
        if (meta) pagingCbRef.current?.(meta);
      },
      getPagingMeta: () => {
        const quill = rqRef.current?.getEditor();
        const root = quill?.root as HTMLElement | undefined;
        if (!root) return null;
        return readPagingMeta(root);
      },
    }));

    useEffect(() => {
      if (!expanded || !onPagingMetaChange) return;
      let alive = true;
      let rootEl: HTMLElement | null = null;
      let ro: ResizeObserver | null = null;

      const emit = () => {
        if (!rootEl) return;
        const meta = readPagingMeta(rootEl);
        if (meta) pagingCbRef.current?.(meta);
      };

      const tid = window.setTimeout(() => {
        if (!alive) return;
        const quill = rqRef.current?.getEditor();
        rootEl = (quill?.root as HTMLElement) || null;
        if (!rootEl) return;
        rootEl.addEventListener('scroll', emit, { passive: true });
        ro = new ResizeObserver(() => window.requestAnimationFrame(emit));
        ro.observe(rootEl);
        emit();
      }, 0);

      return () => {
        alive = false;
        window.clearTimeout(tid);
        if (rootEl) rootEl.removeEventListener('scroll', emit);
        ro?.disconnect();
      };
    }, [expanded, onPagingMetaChange, value]);

    return (
      <div
        className={['note-rich-text-editor', expanded ? 'note-rich-text-editor--expanded' : '']
          .filter(Boolean)
          .join(' ')}
      >
        <ReactQuill
          ref={rqRef}
          theme="snow"
          value={value ?? ''}
          onChange={(html) => onChange?.(html)}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      </div>
    );
  },
);

NoteRichTextEditor.displayName = 'NoteRichTextEditor';

export default NoteRichTextEditor;
