/**
 * 站内通知：未读角标 + 下拉列表（登录后显示）
 */
import {
  notificationList,
  notificationMarkAllRead,
  notificationMarkRead,
  notificationUnreadCount,
  type UserNotificationVO,
} from '@/services/api/notification';
import { getNotificationPanelTheme } from '@/utils/notificationPanelTheme';
import { BellOutlined } from '@ant-design/icons';
import { useEmotionCss } from '@ant-design/use-emotion-css';
import { useIntl, useModel } from '@umijs/max';
import { Badge, Button, Dropdown, Empty, List, Spin, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

const POLL_MS = 45000;

const NotificationBell: React.FC = () => {
  const intl = useIntl();
  const { initialState } = useModel('@@initialState');
  const panelTheme = useMemo(
    () => getNotificationPanelTheme(initialState?.settings?.navTheme),
    [initialState?.settings?.navTheme],
  );
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<UserNotificationVO[]>([]);

  const refreshUnread = useCallback(async () => {
    if (!initialState?.currentToken) return;
    const n = await notificationUnreadCount();
    setUnread(typeof n === 'number' ? n : 0);
  }, [initialState?.currentToken]);

  const loadList = useCallback(async () => {
    if (!initialState?.currentToken) return;
    setLoading(true);
    try {
      const res = await notificationList({ current: 1, pageSize: 20 });
      setItems((res?.list as UserNotificationVO[]) || []);
    } finally {
      setLoading(false);
    }
  }, [initialState?.currentToken]);

  useEffect(() => {
    void refreshUnread();
    const t = window.setInterval(() => void refreshUnread(), POLL_MS);
    const onFocus = () => void refreshUnread();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(t);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshUnread]);

  useEffect(() => {
    if (open) {
      void loadList();
      void refreshUnread();
    }
  }, [open, loadList, refreshUnread]);

  const actionClassName = useEmotionCss(({ token }) => ({
    display: 'flex',
    alignItems: 'center',
    height: 48,
    padding: '0 12px',
    cursor: 'pointer',
    borderRadius: token.borderRadius,
    '&:hover': {
      backgroundColor: token.colorBgTextHover,
    },
  }));

  const onMarkAll = async () => {
    try {
      await notificationMarkAllRead({ throwError: true });
      await loadList();
      await refreshUnread();
    } catch {
      /* handled */
    }
  };

  if (!initialState?.currentToken) {
    return null;
  }

  const dropdownRender = () => (
    <div
      style={{
        width: 360,
        maxHeight: 420,
        overflow: 'auto',
        background: panelTheme.panelBg,
        border: panelTheme.panelBorder,
        boxShadow: 'var(--ant-box-shadow-secondary)',
        borderRadius: 8,
        padding: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Typography.Text strong style={{ color: panelTheme.headerStrongColor }}>
          {intl.formatMessage({ id: 'component.notification.title' })}
        </Typography.Text>
        <Button
          type="link"
          size="small"
          style={panelTheme.markAllLinkColor ? { color: panelTheme.markAllLinkColor } : undefined}
          onClick={() => void onMarkAll()}
        >
          {intl.formatMessage({ id: 'component.notification.markAll' })}
        </Button>
      </div>
      <Spin spinning={loading}>
        {items.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={intl.formatMessage({ id: 'component.notification.empty' })}
            styles={{ description: { color: panelTheme.emptyDescColor } }}
          />
        ) : (
          <List
            size="small"
            dataSource={items}
            renderItem={(it) => (
              <List.Item
                style={{
                  cursor: 'pointer',
                  opacity: it.read ? panelTheme.itemReadOpacity : 1,
                  background: it.read ? 'transparent' : panelTheme.itemUnreadBg,
                  borderRadius: 6,
                  padding: '8px 10px',
                  marginBottom: 6,
                }}
                onClick={async () => {
                  if (!it.read && it.id != null) {
                    await notificationMarkRead(it.id);
                  }
                  await loadList();
                  await refreshUnread();
                }}
              >
                <List.Item.Meta
                  title={
                    <span style={{ fontSize: 13, color: panelTheme.titleColor, fontWeight: it.read ? 400 : 500 }}>
                      {it.title}
                    </span>
                  }
                  description={
                    <span
                      style={{
                        fontSize: 12,
                        whiteSpace: 'pre-wrap',
                        color: panelTheme.descColor,
                      }}
                    >
                      {it.body || ''}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Spin>
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => dropdownRender()}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
    >
      <span className={actionClassName} role="presentation">
        <Badge count={unread} size="small" offset={[4, 0]}>
          <BellOutlined style={{ fontSize: 18 }} />
        </Badge>
      </span>
    </Dropdown>
  );
};

export default NotificationBell;
