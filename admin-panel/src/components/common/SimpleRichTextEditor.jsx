import { useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { BoldOutlined, LinkOutlined, DisconnectOutlined } from '@ant-design/icons';
import { Button, Tooltip, Input, Popover, Space } from 'antd';
import { useState } from 'react';
import './SimpleRichTextEditor.css';

const LinkPopover = ({ editor }) => {
  const [url, setUrl] = useState('');
  const [open, setOpen] = useState(false);

  const handleSetLink = () => {
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url, target: '_blank' })
        .run();
    }
    setUrl('');
    setOpen(false);
  };

  const handleOpen = (visible) => {
    if (visible) {
      const existingLink = editor.getAttributes('link').href || '';
      setUrl(existingLink);
    }
    setOpen(visible);
  };

  return (
    <Popover
      open={open}
      onOpenChange={handleOpen}
      trigger="click"
      content={
        <Space.Compact style={{ width: 300 }}>
          <Input
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPressEnter={handleSetLink}
            size="small"
          />
          <Button type="primary" size="small" onClick={handleSetLink}>
            Apply
          </Button>
        </Space.Compact>
      }
    >
      <Tooltip title="Insert Link">
        <Button
          type="text"
          size="small"
          icon={<LinkOutlined />}
          className={editor.isActive('link') ? 'toolbar-btn-active' : ''}
        />
      </Tooltip>
    </Popover>
  );
};

const SimpleRichTextEditor = ({ value, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        dropcursor: false,
        gapcursor: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html === '<p></p>' ? '' : html);
    },
    editorProps: {
      attributes: {
        class: 'simple-rich-text-content',
      },
    },
  });

  const syncValue = useCallback(() => {
    if (editor && value !== undefined) {
      const currentHtml = editor.getHTML();
      const normalizedCurrent = currentHtml === '<p></p>' ? '' : currentHtml;
      const normalizedValue = value || '';
      if (normalizedCurrent !== normalizedValue) {
        editor.commands.setContent(normalizedValue, false);
      }
    }
  }, [editor, value]);

  useEffect(() => {
    syncValue();
  }, [syncValue]);

  if (!editor) return null;

  return (
    <div className="simple-rich-text-editor">
      <div className="simple-rich-text-toolbar">
        <Tooltip title="Bold">
          <Button
            type="text"
            size="small"
            icon={<BoldOutlined />}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'toolbar-btn-active' : ''}
          />
        </Tooltip>
        <LinkPopover editor={editor} />
        {editor.isActive('link') && (
          <Tooltip title="Remove Link">
            <Button
              type="text"
              size="small"
              danger
              icon={<DisconnectOutlined />}
              onClick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}
            />
          </Tooltip>
        )}
      </div>
      <EditorContent editor={editor} />
      {!value && placeholder && (
        <div className="simple-rich-text-placeholder">{placeholder}</div>
      )}
    </div>
  );
};

export default SimpleRichTextEditor;
