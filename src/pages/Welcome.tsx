import { PageContainer } from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import { Button } from 'antd';
import React from 'react';
import './Welcome.less';

const PATH_MY_NOTES = '/cloud/notes/my';
const PATH_ADMIN_USER_NOTES = '/cloud-admin/notes/users';

const Welcome: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const isRoot = String(initialState?.currentToken?.userCode || '')
    .trim()
    .toLowerCase() === 'root';
  const isDark = initialState?.settings?.navTheme === 'realDark';

  const btnLabel = isRoot ? '用户笔记' : '我的笔记';
  const targetPath = isRoot ? PATH_ADMIN_USER_NOTES : PATH_MY_NOTES;

  return (
    <PageContainer title={false} breadcrumb={false} ghost>
      <div className={`welcomeRoot ${isDark ? 'welcomeRootDark' : ''}`}>
        <div className={`welcomeMapLayer ${isDark ? 'welcomeMapLayerDark' : ''}`} />
        <div className="welcomeInner">
          <h1 className={`welcomeTitle ${isDark ? 'welcomeTitleDark' : 'welcomeTitleLight'}`}>
            开启高效的一天！
          </h1>
          <Button
            type="primary"
            size="large"
            className="welcomeBtn"
            onClick={() => history.push(targetPath)}
          >
            {btnLabel}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};

export default Welcome;
