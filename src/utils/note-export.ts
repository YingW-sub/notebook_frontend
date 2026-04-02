import { message } from 'antd';

export type NoteExportKind = 'markdown' | 'word' | 'pdf';

const paths: Record<NoteExportKind, string> = {
  markdown: 'exportNote',
  word: 'exportWord',
  pdf: 'exportPdf',
};

const fallbacks: Record<NoteExportKind, string> = {
  /** 富文本笔记服务端会改为 .html；纯文本仍为 .md */
  markdown: '笔记.md',
  word: '笔记.docx',
  pdf: '笔记.pdf',
};

function parseFilename(contentDisposition: string | null, fallback: string): string {
  if (!contentDisposition) return fallback;
  const star = /filename\*=UTF-8''([^;\s]+)/i.exec(contentDisposition);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].replace(/\+/g, ' '));
    } catch {
      return fallback;
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(contentDisposition);
  if (quoted?.[1]) return quoted[1];
  return fallback;
}

/** 携带 Cookie 下载笔记导出（与登录态一致） */
export async function downloadNoteExport(kind: NoteExportKind, noteId: number): Promise<void> {
  const path = paths[kind];
  const url = `/api/note/${path}?id=${noteId}`;
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        try {
          const j = (await res.json()) as { message?: string };
          message.error(j?.message || `导出失败 (${res.status})`);
        } catch {
          message.error(`导出失败 (${res.status})`);
        }
      } else {
        const text = await res.text();
        message.error(text?.slice(0, 200) || `导出失败 (${res.status})`);
      }
      return;
    }
    const name = parseFilename(res.headers.get('Content-Disposition'), fallbacks[kind]);
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
    message.success('已开始下载');
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : '导出失败');
  }
}
