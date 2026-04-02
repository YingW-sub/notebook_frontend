/** 判断是否为富文本 HTML（用于查看时渲染；旧数据纯文本仍走纯文本展示） */
export function isRichHtmlContent(s: string | undefined | null): boolean {
  if (s == null || !s.trim()) return false;
  return /^\s*<[a-z][\s\S]*>/i.test(s);
}

/** Quill 空内容常为 <p><br></p>，保存前可压成空串 */
export function normalizeNoteHtml(html: string | undefined | null): string {
  if (html == null) return '';
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return html;
}
