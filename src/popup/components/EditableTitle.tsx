import { useState, useRef, useEffect } from 'react';

interface EditableTitleProps {
  value: string;
  onSave: (newTitle: string) => Promise<void>;
}

export default function EditableTitle({ value, onSave }: EditableTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const handleSave = async (): Promise<void> => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) {
      setDraft(value);
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch {
      setDraft(value);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <span
        className="font-medium text-sm text-gray-900 truncate flex-1 cursor-pointer hover:text-blue-600"
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        title="雙擊編輯標題"
      >
        {value}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      className="font-medium text-sm text-gray-900 flex-1 border-b border-blue-400 outline-none bg-transparent px-0"
      value={draft}
      disabled={saving}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => handleSave()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
          setDraft(value);
          setEditing(false);
        }
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}
