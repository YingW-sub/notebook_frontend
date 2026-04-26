import { aiChat, categorize, listAiModelOptions, polish, summary } from '@/services/api/ai';
import { CaretDownOutlined, RobotOutlined, SendOutlined } from '@ant-design/icons';
import { useModel } from '@umijs/max';
import {
  Button,
  Drawer,
  Dropdown,
  Empty,
  FloatButton,
  Input,
  Select,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const MODEL_STORAGE_KEY = 'cloud-notes-ai-float-model';

const DEFAULT_OPTIONS = [
  { value: 'qwen-turbo', label: '通义千问 · qwen-turbo（轻量）' },
  { value: 'qwen-plus', label: '通义千问 · qwen-plus' },
  { value: 'qwen-max', label: '通义千问 · qwen-max' },
  { value: 'deepseek-chat', label: 'DeepSeek · Chat（对话 / 满血版）' },
  { value: 'deepseek-coder', label: 'DeepSeek · Coder' },
  { value: 'moonshot-v1-8k', label: 'Kimi · moonshot-v1-8k' },
  { value: 'moonshot-v1-32k', label: 'Kimi · moonshot-v1-32k' },
  { value: 'moonshot-v1-128k', label: 'Kimi · moonshot-v1-128k（长文本）' },
];

const QUICK_LABELS = {
  polish: 'AI润色',
  summary: 'AI总结',
  categorize: '智能分类',
} as const;

type QuickKind = keyof typeof QUICK_LABELS;

type Opt = { value: string; label: string };
type Msg = { id: string; role: 'user' | 'assistant'; text: string };

/**
 * 全局悬浮 AI
 */
const AiFloatPanel: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Opt[]>(DEFAULT_OPTIONS);
  const [model, setModel] = useState<string>(() => {
    try {
      return localStorage.getItem(MODEL_STORAGE_KEY) || 'qwen-plus';
    } catch {
      return 'qwen-plus';
    }
  });

  // 初始值是一个空数组，且不会去后端数据库拉取数据，所以只要刷新网页，历史对话会立刻清空
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  // 判断是否登录，以及当前是否在登录页面（如果在登录页，就隐藏悬浮窗）
  const loggedIn = Boolean(initialState?.currentToken);
  const onLoginPage =
    typeof window !== 'undefined' && window.location.pathname.startsWith('/user/login');

  // 如果抽屉打开，并且已登录，则获取模型列表
  useEffect(() => {
    if (!open || !loggedIn) return;
    let cancelled = false;
    listAiModelOptions().then((list) => {
      if (cancelled || !Array.isArray(list) || !list.length) return;
      setOptions(list as Opt[]);
      const vals = (list as Opt[]).map((o) => o.value);
      setModel((m) => (vals.includes(m) ? m : vals[0]));
    });
    return () => {
      cancelled = true;
    };
  }, [open, loggedIn]);

  useEffect(() => {
    try {
      localStorage.setItem(MODEL_STORAGE_KEY, model);
    } catch {
      /* ignore */
    }
  }, [model]);

  // 如果抽屉打开，并且已登录，则获取模型列表
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  // 执行快捷操作
  const runQuickAction = useCallback(
    async (kind: QuickKind) => {
      const text = input.trim();
      if (!text) {
        message.warning('请先在输入框填写要处理的文本');
        return;
      }
      if (loading) return;
      const label = QUICK_LABELS[kind];
      const userMsg: Msg = {
        id: `${Date.now()}-uq`,
        role: 'user',
        text: `【${label}】\n${text}`,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);
      try {
        const body = { content: text, model };
        let res: Record<string, unknown> | undefined;
        if (kind === 'polish') {
          res = (await polish(body, {
            throwError: true,
            skipErrorHandler: true,
          })) as Record<string, unknown>;
        } else if (kind === 'summary') {
          res = (await summary(body, {
            throwError: true,
            skipErrorHandler: true,
          })) as Record<string, unknown>;
        } else {
          res = (await categorize(body, {
            throwError: true,
            skipErrorHandler: true,
          })) as Record<string, unknown>;
        }
        const reply = String(res?.result ?? '').trim() || '（无返回内容）';
        setMessages((prev) => [
          ...prev,
          { id: `${Date.now()}-qa`, role: 'assistant', text: reply },
        ]);
      } catch (e: unknown) {
        const err = e as { message?: string; info?: { message?: string } };
        const detail = err?.info?.message || err?.message || '请求失败，请检查网络或稍后重试。';
        setMessages((prev) => [
          ...prev,
          { id: `${Date.now()}-qe`, role: 'assistant', text: detail },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, model],
  );

  const quickMenuItems = [
    {
      key: 'polish',
      label: QUICK_LABELS.polish,
      onClick: () => void runQuickAction('polish'),
    },
    {
      key: 'summary',
      label: QUICK_LABELS.summary,
      onClick: () => void runQuickAction('summary'),
    },
    {
      key: 'categorize',
      label: QUICK_LABELS.categorize,
      onClick: () => void runQuickAction('categorize'),
    },
  ];

  // 发送消息
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Msg = { id: `${Date.now()}-u`, role: 'user', text };
    // 将用户消息和历史消息合并成数组，用于发给后端
    const historyPayload = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.text,
    }));

    // 将当前对话显示在屏幕上（更新 state）
    setMessages((prev) => [...prev, userMsg]);
    // 清空输入框
    setInput('');
    // 设置加载状态
    setLoading(true);
    try {
      // 调用后端 API
      const res = await aiChat(
        { model, messages: historyPayload },
        { throwError: true, skipErrorHandler: true },
      );
      const reply = (res?.result ??
        (res as { data?: { result?: string } })?.data?.result ??
        '') as string;
      // 将 AI 回复显示在屏幕上
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-a`,
          role: 'assistant',
          text: typeof reply === 'string' && reply ? reply : '（无返回内容）',
        },
      ]);
    } catch (e: unknown) {
      // 如果请求失败，将错误信息显示在屏幕上
      const err = e as { message?: string; info?: { message?: string } };
      const detail = err?.info?.message || err?.message || '请求失败，请检查网络或稍后重试。';
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-e`, role: 'assistant', text: detail },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, model]);

  // 如果未登录或当前在登录页面，则不显示悬浮窗
  if (!loggedIn || onLoginPage) {
    return null;
  }

  return (
    <>
      <FloatButton
        icon={<RobotOutlined />}
        type="primary"
        style={{ right: 24, bottom: 88, zIndex: 9999, position: 'fixed' }}
        tooltip="AI 助手"
        onClick={() => setOpen(true)}
      />
      <Drawer
        title="AI 助手"
        placement="right"
        width={420}
        open={open}
        onClose={() => setOpen(false)}
        destroyOnClose={false}
        styles={{ body: { padding: 12, display: 'flex', flexDirection: 'column', height: '100%' } }}
      >
        <Space direction="vertical" style={{ width: '100%', marginBottom: 8 }} size="small">
          <Select
            style={{ width: '100%' }}
            value={model}
            options={options}
            onChange={setModel}
            showSearch
            optionFilterProp="label"
            listHeight={320}
            placeholder="搜索或选择模型"
          />
        </Space>
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            padding: 8,
            marginBottom: 8,
            background: '#fafafa',
          }}
        >
          {messages.length === 0 && !loading ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="输入内容后开始对话" />
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                style={{
                  marginBottom: 12,
                  textAlign: m.role === 'user' ? 'right' : 'left',
                }}
              >
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {m.role === 'user' ? '我' : 'AI'}
                </Typography.Text>
                <div
                  style={{
                    display: 'inline-block',
                    maxWidth: '92%',
                    marginTop: 4,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: m.role === 'user' ? '#1677ff' : '#fff',
                    color: m.role === 'user' ? '#fff' : 'rgba(0,0,0,0.88)',
                    border: m.role === 'user' ? undefined : '1px solid #f0f0f0',
                    whiteSpace: 'pre-wrap',
                    textAlign: 'left',
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))
          )}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 16 }}>
              <Spin />
            </div>
          ) : null}
          <div ref={listEndRef} />
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
            padding: '8px 0 0',
            borderRadius: 8,
            background: 'linear-gradient(180deg, #f0f7ff 0%, #e6f4ff 100%)',
          }}
        >
          <Dropdown
            menu={{ items: quickMenuItems }}
            placement="topLeft"
            trigger={['click']}
            disabled={loading}
            getPopupContainer={() => document.body}
          >
            <Button
              type="primary"
              icon={<CaretDownOutlined />}
              style={{
                height: 52,
                width: 44,
                padding: 0,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="快捷：AI润色、AI总结、智能分类"
            />
          </Dropdown>
          <Input.TextArea
            style={{ flex: 1, background: '#fff' }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息，Shift+Enter 换行；左侧按钮可选 AI润色 / AI总结 / 智能分类"
            autoSize={{ minRows: 2, maxRows: 5 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={loading}
            style={{ height: 52, flexShrink: 0 }}
            onClick={() => send()}
          />
        </div>
        <Button
          type="link"
          size="small"
          style={{ paddingLeft: 0, marginTop: 4 }}
          onClick={() => setMessages([])}
        >
          清空对话
        </Button>
      </Drawer>
    </>
  );
};

export default AiFloatPanel;
