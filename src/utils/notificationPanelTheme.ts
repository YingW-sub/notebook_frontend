/**
 * 站内通知下拉与「整体风格设置」对齐：浅色模式浅底深字，夜间 realDark 深底浅字。
 */
export type NotificationPanelTheme = {
  panelBg: string;
  panelBorder: string;
  titleColor: string;
  descColor: string;
  headerStrongColor: string;
  itemUnreadBg: string;
  itemReadOpacity: number;
  markAllLinkColor?: string;
  emptyDescColor: string;
};

export function getNotificationPanelTheme(navTheme: string | undefined): NotificationPanelTheme {
  const isNight = navTheme === 'realDark';
  if (isNight) {
    return {
      panelBg: '#141414',
      panelBorder: '1px solid rgba(255, 255, 255, 0.12)',
      titleColor: 'rgba(255, 255, 255, 0.88)',
      descColor: 'rgba(255, 255, 255, 0.55)',
      headerStrongColor: 'rgba(255, 255, 255, 0.95)',
      itemUnreadBg: 'rgba(255, 255, 255, 0.08)',
      itemReadOpacity: 0.72,
      markAllLinkColor: '#69b1ff',
      emptyDescColor: 'rgba(255, 255, 255, 0.45)',
    };
  }
  return {
    panelBg: '#ffffff',
    panelBorder: '1px solid rgba(0, 0, 0, 0.06)',
    titleColor: 'rgba(0, 0, 0, 0.88)',
    descColor: 'rgba(0, 0, 0, 0.45)',
    headerStrongColor: 'rgba(0, 0, 0, 0.88)',
    itemUnreadBg: 'rgba(0, 0, 0, 0.04)',
    itemReadOpacity: 0.65,
    markAllLinkColor: undefined,
    emptyDescColor: 'rgba(0, 0, 0, 0.45)',
  };
}
