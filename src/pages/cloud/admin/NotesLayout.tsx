import { Outlet } from 'react-router-dom';

/**
 * 嵌套路由父级必须渲染 Outlet，否则子页（如用户笔记）主区域为空。
 */
export default function NotesLayout() {
  return <Outlet />;
}
