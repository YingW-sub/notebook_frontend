import { reorderNotes } from '@/services/api/note';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HolderOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Drawer, Typography, message } from 'antd';
import React, { useEffect, useState } from 'react';

export type NoteSortItem = { id: number; title?: string };

function SortRow({ item }: { item: NoteSortItem }) {
  const intl = useIntl();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(item.id),
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '10px 12px',
    marginBottom: 8,
    background: isDragging ? '#e6f4ff' : '#fafafa',
    border: '1px solid #f0f0f0',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'grab',
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <HolderOutlined style={{ color: '#8c8c8c' }} />
      <Typography.Text ellipsis style={{ flex: 1 }}>
        {item.title ||
          intl.formatMessage({ id: 'pages.cloud.sort.noteFallback' }, { id: item.id })}
      </Typography.Text>
    </div>
  );
}

export type NoteSortDrawerProps = {
  open: boolean;
  items: NoteSortItem[];
  onClose: () => void;
  onSaved: () => void;
};

const NoteSortDrawer: React.FC<NoteSortDrawerProps> = ({ open, items, onClose, onSaved }) => {
  const intl = useIntl();
  const [local, setLocal] = useState<NoteSortItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setLocal([...items]);
  }, [open, items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = local.findIndex((x) => String(x.id) === String(active.id));
    const newIndex = local.findIndex((x) => String(x.id) === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    setLocal(arrayMove(local, oldIndex, newIndex));
  };

  const handleSave = async () => {
    const orderedIds = local.map((x) => x.id);
    setSaving(true);
    try {
      await reorderNotes(orderedIds, { throwError: true });
      message.success(intl.formatMessage({ id: 'pages.cloud.sort.saved' }));
      onSaved();
      onClose();
    } catch (e: unknown) {
      const err = e as { info?: { message?: string }; message?: string };
      message.error(
        err?.info?.message ||
          err?.message ||
          intl.formatMessage({ id: 'pages.cloud.sort.saveFailed' }),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={intl.formatMessage({ id: 'pages.cloud.sort.title' })}
      placement="right"
      width={400}
      open={open}
      onClose={onClose}
      extra={
        <Button type="primary" loading={saving} onClick={() => void handleSave()}>
          {intl.formatMessage({ id: 'pages.cloud.sort.save' })}
        </Button>
      }
    >
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        {intl.formatMessage({ id: 'pages.cloud.sort.hint' })}
      </Typography.Paragraph>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={local.map((x) => String(x.id))} strategy={verticalListSortingStrategy}>
          {local.map((it) => (
            <div key={it.id} style={{ marginBottom: 4 }}>
              <SortRow item={it} />
            </div>
          ))}
        </SortableContext>
      </DndContext>
    </Drawer>
  );
};

export default NoteSortDrawer;
