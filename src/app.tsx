import Footer from '@/components/Footer';
import RightContent from '@/components/RightContent';
import { LinkOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import AiFloatPanel from '@/components/AiFloatPanel';
import InteractivePet from '@/components/InteractivePet';
import React from 'react';
import { getCurrentUser } from './services/api/authentication';

const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/user/login';

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentToken?: API.Token;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.Token | undefined>;
}> {
  const fetchUserInfo = async () => {
    try {
      return await getCurrentUser({
        skipErrorHandler: true,
      });
    } catch (error) {
      history.push(loginPath);
    }
    return undefined;
  };
  // 如果不是登录页面，执行
  const { location } = history;
  if (location.pathname !== loginPath) {
    const currentToken = await fetchUserInfo();
    return {
      fetchUserInfo,
      currentToken,
      settings: defaultSettings,
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  layoutInitialState = initialState ?? null;
  layoutSetInitialState = setInitialState as typeof layoutSetInitialState;
  waterMarkPropsHolder.content = initialState?.currentToken?.userName;

  return {
    token: LAYOUT_TOKEN,
    rightContentRender: stableRightContentRender,
    waterMarkProps: waterMarkPropsHolder,
    footerRender: stableFooterRender,
    onPageChange: stableOnPageChange,
    layoutBgImgList: LAYOUT_BG_IMG_LIST,
    links: isDev ? DEV_LINKS : EMPTY_LINKS,
    menuHeaderRender: undefined,
    childrenRender: stableChildrenRender,
    ...initialState?.settings,
  };
};

const LAYOUT_BG_IMG_LIST = [
  {
    src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
    left: 85,
    bottom: 100,
    height: '303px',
  },
  {
    src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
    bottom: -68,
    right: -45,
    height: '303px',
  },
  {
    src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
    bottom: 0,
    left: 0,
    width: '331px',
  },
];


const LAYOUT_TOKEN = {
  colorBgAppListIconHover: 'rgba(0,0,0,0.06)',
  colorTextAppListIconHover: 'rgba(255,255,255,0.95)',
  colorTextAppListIcon: 'rgba(255,255,255,0.85)',
  sider: {
    colorBgCollapsedButton: '#fff',
    colorTextCollapsedButtonHover: 'rgba(0,0,0,0.65)',
    colorTextCollapsedButton: 'rgba(0,0,0,0.45)',
    colorMenuBackground: '#004FD9',
    colorBgMenuItemCollapsedHover: 'rgba(0,0,0,0.06)',
    colorBgMenuItemCollapsedSelected: 'rgba(0,0,0,0.15)',
    colorBgMenuItemCollapsedElevated: 'rgba(0,0,0,0.85)',
    colorMenuItemDivider: 'rgba(255,255,255,0.15)',
    colorBgMenuItemHover: 'rgba(0,0,0,0.06)',
    colorBgMenuItemSelected: 'rgba(0,0,0,0.15)',
    colorTextMenuSelected: '#fff',
    colorTextMenuItemHover: 'rgba(255,255,255,0.75)',
    colorTextMenu: 'rgba(255,255,255,0.75)',
    colorTextMenuSecondary: 'rgba(255,255,255,0.65)',
    colorTextMenuTitle: 'rgba(255,255,255,0.95)',
    colorTextMenuActive: 'rgba(255,255,255,0.95)',
    colorTextSubMenuSelected: '#fff',
  },
};

const DEV_LINKS = [
  <a
    key="openapi"
    href="http://localhost:9311/swagger-ui.html"
    target="_blank"
    rel="noreferrer"
  >
    <LinkOutlined />
    <span>OpenAPI 文档</span>
  </a>,
];

const EMPTY_LINKS: React.ReactNode[] = [];

const waterMarkPropsHolder: { content?: string } = {};

let layoutInitialState: {
  settings?: Partial<LayoutSettings>;
  currentToken?: API.Token;
} | null = null;

let layoutSetInitialState: ((fn: (prev: any) => any) => void) | null = null;
let lastTokenSyncAt = 0;
const TOKEN_SYNC_INTERVAL_MS = 15000;// 每15秒检查一次

const samePrivSet = (a?: string[], b?: string[]) => {
  const sa = [...(a || [])].sort();
  const sb = [...(b || [])].sort();
  return JSON.stringify(sa) === JSON.stringify(sb);
};

const syncCurrentTokenIfNeeded = () => {
  if (!layoutInitialState?.currentToken) {
    return;
  }
  const now = Date.now();
  // 检查距离上次同步是否超过15秒
  if (now - lastTokenSyncAt < TOKEN_SYNC_INTERVAL_MS) {
    return;
  }
  lastTokenSyncAt = now;
  // 调用 getCurrentUser 获取最新用户信息
  getCurrentUser({ skipErrorHandler: true })
    .then((freshToken) => {
      if (!freshToken) {
        return;
      }
      const oldToken = layoutInitialState?.currentToken;
      // 比较 userCode、userName、privSet(权限集合) 是否变化
      const changed =
        oldToken?.userCode !== freshToken.userCode ||
        oldToken?.userName !== freshToken.userName ||
        !samePrivSet(oldToken?.privSet, freshToken.privSet);
      // 如果有变化，更新全局状态
      if (changed) {
        layoutSetInitialState?.((preInitialState) => ({
          ...preInitialState,
          currentToken: freshToken,
        }));
      }
    })
    .catch(() => undefined);
};

const stableOnPageChange = () => {
  const { location } = history;
  // 如果没有登录，重定向到 login
  if (!layoutInitialState?.currentToken && location.pathname !== loginPath) {
    history.push(loginPath);
    return;
  }
  // 已登录则同步 token
  syncCurrentTokenIfNeeded();
};

const stableFooterRender = () => <Footer />;

const stableRightContentRender = () => <RightContent />;

const stableChildrenRender = (children: React.ReactNode) => (
  <>
    <div style={{ position: 'relative', minHeight: '100%' }}>{children}</div>
    <AiFloatPanel />
    <InteractivePet />
    <SettingDrawer
      disableUrlParams
      enableDarkTheme
      settings={layoutInitialState?.settings}
      onSettingChange={(settings) => {
        layoutSetInitialState?.((preInitialState) => ({
          ...preInitialState,
          settings,
        }));
      }}
    />
  </>
);



/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request = {
  ...errorConfig,
};
