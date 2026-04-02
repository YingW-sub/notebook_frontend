/**
 * 从笔记 HTML/纯文本中解析「【批注】…」条目（与编辑器插入格式一致）
 */
export function extractNoteAnnotations(htmlOrText: string | undefined | null): string[] {
  if (htmlOrText == null || !String(htmlOrText).trim()) return [];
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  let text: string;
  if (div) {
    div.innerHTML = htmlOrText;
    text = div.innerText || div.textContent || '';
  } else {
    text = String(htmlOrText).replace(/<[^>]+>/g, ' ');
  }
  text = text.replace(/\u00a0/g, ' ');
  const out: string[] = [];
  const re = /【批注】\s*([\s\S]*?)(?=【批注】|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const s = m[1].replace(/\s+/g, ' ').trim();
    if (s) out.push(s);
  }
  return out;
}
