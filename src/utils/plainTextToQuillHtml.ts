function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 将纯文本转为 Quill 可用的简单 HTML（每行一段） */
export function plainTextToQuillHtml(plain: string): string {
  if (plain == null || !plain.trim()) return '<p><br></p>';
  const lines = plain.replace(/\r\n/g, '\n').split('\n');
  return lines.map((line) => `<p>${line.trim() ? esc(line) : '<br>'}</p>`).join('');
}
