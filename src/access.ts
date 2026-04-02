/**
 * @see https://umijs.org/zh-CN/plugins/plugin-access
 * */
export default function access(initialState: { currentToken?: API.Token } | undefined) {
  const { currentToken } = initialState || {};
  const { privSet = [], userCode } = currentToken || {};
  const normalizedUserCode = String(userCode || '').trim().toLowerCase();
  const isRoot = normalizedUserCode === 'root';
  return {
    hasPrivilege: (route: any) => {
      return isRoot || privSet.includes(route.name + '.page');
    },
    /** 仅 root 可见的云笔记管理菜单 */
    isRoot,
    /** 已登录且非 root 的普通用户云笔记菜单 */
    notRoot: Boolean(userCode) && !isRoot,
  };
}
