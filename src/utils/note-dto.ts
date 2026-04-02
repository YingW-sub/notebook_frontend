/** 兼容后端统一包装或扁平结构 */
export function unwrapNoteDto(raw: unknown): API.NoteDTO | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  if ('title' in o || 'content' in o || 'id' in o) {
    return raw as API.NoteDTO;
  }
  const inner = o.data;
  if (inner && typeof inner === 'object' && ('title' in inner || 'content' in inner || 'id' in inner)) {
    return inner as API.NoteDTO;
  }
  return undefined;
}
