/**
 * 普通用户 — 分类管理
 */
import { addCategory, deleteCategory, listCategory, updateCategory } from '@/services/api/category';
import { openConfirm } from '@/utils/ui';
import { PlusOutlined } from '@ant-design/icons';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Form, Input, Modal, message } from 'antd';
import React, { useRef, useState } from 'react';

export default () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>(null);
  const [form] = Form.useForm<API.CategoryDTO>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<API.CategoryDTO | null>(null);

  const columns: ProColumns<API.CategoryDTO>[] = [
    {
      title: intl.formatMessage({ id: 'pages.cloud.category.nameLabel' }),
      dataIndex: 'categoryName',
      render: (dom, record) => (
        <a
          onClick={() => {
            setEditing(record);
            form.setFieldsValue(record);
            setOpen(true);
          }}
        >
          {dom}
        </a>
      ),
    },
    {
      title: intl.formatMessage({ id: 'pages.cloud.col.operation' }),
      valueType: 'option',
      width: 120,
      render: (_, record) => [
        <a
          key="edit"
          onClick={() => {
            setEditing(record);
            form.setFieldsValue(record);
            setOpen(true);
          }}
        >
          {intl.formatMessage({ id: 'pages.cloud.action.modify' })}
        </a>,
        <a
          key="del"
          onClick={() => {
            openConfirm(intl.formatMessage({ id: 'pages.cloud.confirm.deleteCategory' }), async () => {
              await deleteCategory(record.id!);
              message.success(intl.formatMessage({ id: 'pages.cloud.msg.deleted' }));
              actionRef.current?.reload();
            });
          }}
        >
          {intl.formatMessage({ id: 'pages.cloud.action.delete' })}
        </a>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.CategoryDTO>
        headerTitle={intl.formatMessage({ id: 'pages.cloud.header.categoryManage' })}
        actionRef={actionRef}
        rowKey="id"
        search={false}
        pagination={false}
        toolBarRender={() => [
          <Button
            type="primary"
            key="add"
            onClick={() => {
              setEditing(null);
              form.resetFields();
              setOpen(true);
            }}
          >
            <PlusOutlined /> {intl.formatMessage({ id: 'pages.cloud.category.newBtn' })}
          </Button>,
        ]}
        request={async () => {
          const list = await listCategory();
          return { data: list || [], success: true, total: (list || []).length };
        }}
        columns={columns}
      />
      <Modal
        title={
          editing
            ? intl.formatMessage({ id: 'pages.cloud.category.editTitle' })
            : intl.formatMessage({ id: 'pages.cloud.category.createTitle' })
        }
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        onOk={async () => {
          const v = await form.validateFields();
          if (editing?.id) {
            await updateCategory({ ...v, id: editing.id });
            message.success(intl.formatMessage({ id: 'pages.cloud.category.saved' }));
          } else {
            await addCategory(v);
            message.success(intl.formatMessage({ id: 'pages.cloud.category.created' }));
          }
          setOpen(false);
          setEditing(null);
          form.resetFields();
          actionRef.current?.reload();
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="categoryName"
            label={intl.formatMessage({ id: 'pages.cloud.category.nameLabel' })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: 'pages.cloud.category.nameRequired' }),
              },
            ]}
          >
            <Input maxLength={50} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};
