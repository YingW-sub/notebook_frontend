/**
 * 名称：管理员对话框
 * 作者：李洪文
 * 单位：山东大学
 * 上次修改：2023-3-3
 */
import { getAdmin, addAdmin, updateAdmin } from '@/services/api/admin';
import {
  ModalForm,
  ProForm,
  ProFormInstance,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { message, Typography } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { waitTime } from '@/utils/request';

interface InputDialogProps {
  visible: boolean;
  id?: number;
  onClose: (result: boolean) => void;
}

function BasicInfoFields(props: { userCodeDisabled: boolean; isEdit: boolean }) {
  return (
    <ProForm.Group>
      <ProFormText
        name="userCode"
        label="登录名称"
        disabled={props.userCodeDisabled}
        rules={[
          {
            required: true,
            message: '请输入登录名称！',
          },
        ]}
      />
      <ProFormText
        name="name"
        label="姓名"
        rules={[
          {
            required: true,
            message: '请输入姓名！',
          },
        ]}
      />
      <ProFormSelect<number>
        name="sex"
        width="xs"
        label="性别"
        valueEnum={{
          0: '女',
          1: '男',
        }}
      />
      <ProFormText.Password
        name="password"
        placeholder={props.isEdit ? '为空则不修改密码' : '请输入密码'}
        fieldProps={{ defaultValue: '', autoComplete: 'new-password' }}
        label="密码"
        rules={[
          {
            required: !props.isEdit,
            message: '请输入密码！',
          },
        ]}
      />
      <ProFormText name="email" label="电子邮箱" />
      <ProFormText name="phone" label="手机号" />
      <ProFormSelect
        name="enabled"
        width="xs"
        label="状态"
        valueEnum={{
          false: '禁用',
          true: '启用',
        }}
      />
    </ProForm.Group>
  );
}

export default function InputDialog(props: InputDialogProps) {
  const createFormRef = useRef<ProFormInstance>(null);
  /** 仅 root 账户禁止改登录名；其它用户允许管理员修改 userCode */
  const [lockLoginName, setLockLoginName] = useState(false);

  const initEditData = useCallback(async (id: number) => {
    // getAdmin 需要传数字 id；误传 { id } 会导致后端收到字符串 "{\"id\":n}\" 而报错
    const result = await getAdmin(id);
    if (result) {
      createFormRef.current?.setFieldsValue({
        ...result,
        sex: !result.sex ? '0' : '1',
        enabled: `${result.enabled}`,
      });
      const isRoot = String(result.userCode || '').trim().toLowerCase() === 'root';
      setLockLoginName(isRoot);
    }
  }, []);

  useEffect(() => {
    if (!props.visible) {
      setLockLoginName(false);
      return;
    }
    if (!props.id) {
      setLockLoginName(false);
      waitTime().then(() => {
        createFormRef.current?.setFieldsValue({ sex: '1', enabled: 'true' });
      });
      return;
    }
    setLockLoginName(false);
    initEditData(props.id);
  }, [props.id, props.visible, initEditData]);

  const onSubmitCreate = async (values: Record<string, unknown>) => {
    // 新建不传 modList，后端 applyDefaultEndUserPrivileges：笔记 + 分类 的 page/add/update/delete
    const { modList: _m, ...rest } = values;
    await addAdmin(rest as API.AdminDTO);
    message.success('保存成功');
    props.onClose(true);
    return true;
  };

  const onSubmitEdit = async (values: any) => {
    const { modList: _m, ...rest } = values;
    await updateAdmin({ ...rest, id: props.id });
    message.success('保存成功');
    props.onClose(true);
    return true;
  };

  if (!props.id) {
    return (
      <ModalForm
        width={800}
        title="新建操作员"
        open={props.visible}
        formRef={createFormRef}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => props.onClose(false),
          bodyStyle: { padding: '32px 40px 48px' },
        }}
        onFinish={onSubmitCreate}
      >
        <BasicInfoFields userCodeDisabled={false} isEdit={false} />
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 8 }}>
          新建账号将自动开通云笔记功能：笔记与分类的查看、新建、修改、删除（含收藏、回收站等）
        </Typography.Paragraph>
      </ModalForm>
    );
  }

  return (
    <ModalForm
      width={800}
      title="修改操作员"
      open={props.visible}
      formRef={createFormRef}
      modalProps={{
        destroyOnClose: true,
        onCancel: () => props.onClose(false),
        bodyStyle: { padding: '32px 40px 48px' },
      }}
      onFinish={onSubmitEdit}
    >
      <BasicInfoFields userCodeDisabled={lockLoginName} isEdit />
    </ModalForm>
  );
}
