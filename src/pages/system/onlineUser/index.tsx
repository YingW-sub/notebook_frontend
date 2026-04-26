import { kickOnlineUser, listOnlineUser } from '@/services/api/onlineUser';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { message } from 'antd';
import React, { useRef } from 'react';

function renderSex(sex: unknown) {
  if (sex === 1 || sex === '1') return '男';
  if (sex === 0 || sex === '0') return '女';
  return '—';
}

const OnlineUserPage: React.FC = () => {
  const refAction = useRef<ActionType>(null);
  const { initialState } = useModel('@@initialState');
  const isRoot = String(initialState?.currentToken?.userCode || '').trim().toLowerCase() === 'root';

  const columns: ProColumns<API.OnlineUserVO>[] = [
    {
      title: '用户ID',
      dataIndex: 'userCode',
      fixed: true,
      width: 100,
      search: false,
    },
    {
      title: '姓名',
      search: false,
      dataIndex: 'userName',
      width: 100,
    },
    {
      title: '性别',
      dataIndex: 'sex',
      search: false,
      width: 60,
      render: (_, record) => renderSex(record?.sex),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      search: false,
      width: 72,
      render: (_, record) => (record?.enabled === true ? '启用' : '禁用'),
    },
    {
      title: '浏览器',
      search: false,
      dataIndex: 'browser',
      width: 150,
      ellipsis: true,
    },
    {
      title: '操作系统',
      dataIndex: 'os',
      search: false,
      width: 100,
    },
    {
      title: '部门',
      dataIndex: 'department',
      search: false,
      ellipsis: true,
    },
    {
      title: '上次动作',
      width: 170,
      search: false,
      sorter: true,
      dataIndex: 'lastAction',
      valueType: 'dateTime',
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => {
        const token = record?.accessToken as string | undefined;
        if (!isRoot || !token) {
          return <span style={{ color: '#bfbfbf' }}>—</span>;
        }
        return (
          <a
            key="kick"
            onClick={async () => {
              try {
                await kickOnlineUser(token, { throwError: true, skipErrorHandler: true });
                message.success('已踢出该会话');
                refAction.current?.reload();
              } catch (e: unknown) {
                const er = e as { info?: { message?: string }; message?: string };
                message.error(er?.info?.message || er?.message || '踢出失败');
              }
            }}
          >
            踢出
          </a>
        );
      },
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.OnlineUserVO>
        actionRef={refAction}
        rowKey={(r) => `${r.userCode}-${r.accessToken || ''}`}
        search={false}
        scroll={{ x: 100 }}
        request={async () => {
          const list = (await listOnlineUser()) || [];
          return {
            data: list as API.OnlineUserVO[],
            total: list.length,
            success: true,
          };
        }}
        columns={columns}
      />
    </PageContainer>
  );
};

export default OnlineUserPage;
