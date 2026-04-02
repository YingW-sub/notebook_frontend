import { categorize, polish, summary } from '@/services/api/ai';
import {
  CloseOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RobotOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { Button, Divider, Empty, Input, Space, Spin, Typography, message } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const WIDTH_KEY = 'cloud-notes-ai-sider-width';
const COLLAPSE_KEY = 'cloud-notes-ai-sider-collapsed';
const MIN_W = 280;
const MAX_W = 560;
const DEFAULT_W = 360;

type ChatRole = 'user' | 'assistant';

type ChatItem = {
  id: string;
  role: ChatRole;
  text: string;
};

const AiAssistantSider: React.FC = () => {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [width, setWidth] = useState(() => {
    try {
      const n = Number(localStorage.getItem(WIDTH_KEY));
      if (Number.isFinite(n) && n >= MIN_W && n <= MAX_W) return n;
    } catch {
      /* ignore */
    }
    return DEFAULT_W;
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const listEndRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(WIDTH_KEY, String(width));
    } catch {
      /* ignore */
    }
  }, [width]);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const appendAssistant = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-a`, role: 'assistant', text: text || '（无返回内容）' },
    ]);
  }, []);

  const runAi = useCallback(
    async (action: 'polish' | 'summary' | 'categorize', content: string) => {
      const trimmed = content.trim();
      if (!trimmed) {
        message.warning('请先输入要处理的文字');
        return;
      }
      setLoading(true);
      try {
        let res: Record<string, any> | undefined;
        if (action === 'polish') res = await polish({ content: trimmed });
        else if (action === 'summary') res = await summary({ content: trimmed });
        else res = await categorize({ content: trimmed });
        const out = (res?.result ?? '') as string;
        appendAssistant(typeof out === 'string' ? out : JSON.stringify(out));
      } catch {
        message.error('请求失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    },
    [appendAssistant],
  );

  const onSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { id: `${Date.now()}-u`, role: 'user', text: trimmed }]);
    setInput('');
    await runAi('summary', trimmed);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = dragRef.current.startX - e.clientX;
      const next = Math.min(MAX_W, Math.max(MIN_W, dragRef.current.startW + delta));
      setWidth(next);
    };
    const onUp = () => {
      dragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startW: width };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  if (collapsed) {
    return (
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: 40,
          background: '#fafafa',
          borderLeft: '1px solid #f0f0f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 12,
          zIndex: 100,
        }}
      >
        <Button
          type="text"
          icon={<MenuUnfoldOutlined />}
          onClick={() => setCollapsed(false)}
          title="展开 AI 助手"
        />
        <Typography.Text
          type="secondary"
          style={{
            writingMode: 'vertical-rl',
            marginTop: 16,
            fontSize: 12,
            letterSpacing: 4,
          }}
        >
          AI
        </Typography.Text>
      </div>
    );
  }

  return (
    <>
      {/* 拖拽手柄 */}
      <div
        role="separator"
        aria-orientation="vertical"
        onMouseDown={startResize}
        style={{
          position: 'fixed',
          right: width,
          top: 0,
          bottom: 0,
          width: 6,
          cursor: 'col-resize',
          background: '#f5f5f5',
          borderLeft: '1px solid #e8e8e8',
          borderRight: '1px solid #e8e8e8',
          zIndex: 101,
        }}
      />
      <aside
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width,
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          borderLeft: '1px solid #f0f0f0',
          boxShadow: '-2px 0 8px rgba(0,0,0,0.04)',
          zIndex: 100,
        }}
      >
        <div
          style={{
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <RobotOutlined style={{ fontSize: 20, color: '#1677ff' }} />
          <Typography.Text strong style={{ flex: 1 }}>
            AI 助手
          </Typography.Text>
          <Button
            type="text"
            size="small"
            icon={<MenuFoldOutlined />}
            onClick={() => setCollapsed(true)}
            title="收起"
          />
        </div>
        <Divider style={{ margin: 0 }} />
        <div style={{ padding: '10px 14px 6px' }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            快捷功能
          </Typography.Text>
          <Space wrap style={{ marginTop: 8 }}>
            <Button
              size="small"
              onClick={() => runAi('polish', input)}
              disabled={loading || !input.trim()}
            >
              润色
            </Button>
            <Button
              size="small"
              onClick={() => runAi('summary', input)}
              disabled={loading || !input.trim()}
            >
              总结
            </Button>
            <Button
              size="small"
              onClick={() => runAi('categorize', input)}
              disabled={loading || !input.trim()}
            >
              分类
            </Button>
          </Space>
        </div>
        <Divider style={{ margin: 0 }} />
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 12,
            background: '#fafafa',
          }}
        >
          {loading && (
            <div style={{ textAlign: 'center', padding: 16 }}>
              <Spin />
            </div>
          )}
          {messages.length === 0 && !loading && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Typography.Text type="secondary">输入内容，AI 将为你处理</Typography.Text>
              }
            />
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                marginBottom: 10,
                textAlign: m.role === 'user' ? 'right' : 'left',
              }}
            >
              <Typography.Paragraph
                style={{
                  display: 'inline-block',
                  maxWidth: '100%',
                  margin: 0,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: m.role === 'user' ? '#e6f4ff' : '#fff',
                  border: m.role === 'assistant' ? '1px solid #f0f0f0' : undefined,
                  textAlign: 'left',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {m.text}
              </Typography.Paragraph>
            </div>
          ))}
          <div ref={listEndRef} />
        </div>
        <Divider style={{ margin: 0 }} />
        <div style={{ padding: 12 }}>
          <Input.TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入内容，按 Enter 发送（Shift+Enter 换行）"
            autoSize={{ minRows: 2, maxRows: 5 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <Button
            type="primary"
            block
            icon={<SendOutlined />}
            style={{ marginTop: 8 }}
            loading={loading}
            onClick={onSend}
          >
            发送
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CloseOutlined />}
            onClick={() => setMessages([])}
            style={{ padding: 0, marginTop: 4 }}
          >
            清空对话
          </Button>
        </div>
      </aside>
    </>
  );
};

export default AiAssistantSider;
