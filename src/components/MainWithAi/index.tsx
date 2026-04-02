import React from 'react';
import { useLocation } from '@umijs/max';
import AiAssistantSider from '@/components/AiAssistantSider';

const LOGIN_PATH = '/user/login';

/**
 * 主内容区 + 可伸缩 AI 侧栏（登录后布局内使用）
 */
const MainWithAi: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  if (pathname === LOGIN_PATH) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        minHeight: '100%',
        alignItems: 'stretch',
        flex: 1,
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
      <AiAssistantSider />
    </div>
  );
};

export default MainWithAi;
