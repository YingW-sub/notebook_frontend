import { extractNoteAnnotations } from '@/utils/note-annotations';
import { CommentOutlined } from '@ant-design/icons';
import { Empty, List, Typography } from 'antd';
import React from 'react';
import './index.less';

export type NoteAnnotationPanelProps = {
  /** 当前正文 HTML */
  html: string;
  className?: string;
};

/** 右侧批注列表（类似 Word 批注窗格，内容为解析出的【批注】条目） */
const NoteAnnotationPanel: React.FC<NoteAnnotationPanelProps> = ({ html, className }) => {
  const items = extractNoteAnnotations(html);

  return (
    <div className={['note-annotation-panel', className].filter(Boolean).join(' ')}>
      <div className="note-annotation-panel__head">
        <CommentOutlined />
        <Typography.Text strong>批注</Typography.Text>
        <Typography.Text type="secondary" className="note-annotation-panel__hint">
          正文内以引用块显示；此处汇总便于对照
        </Typography.Text>
      </div>
      {items.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无批注" />
      ) : (
        <List
          size="small"
          dataSource={items}
          renderItem={(text, i) => (
            <List.Item className="note-annotation-panel__item">
              <div>
                <Typography.Text type="secondary" className="note-annotation-panel__idx">
                  {i + 1}.
                </Typography.Text>
                <Typography.Paragraph style={{ marginBottom: 0 }} ellipsis={{ rows: 6 }}>
                  {text}
                </Typography.Paragraph>
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default NoteAnnotationPanel;
