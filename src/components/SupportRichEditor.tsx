import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const SUPPORT_EDITOR_MODULES = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean'],
    ],
    clipboard: { matchVisual: true },
};

const SUPPORT_EDITOR_FORMATS = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link',
];

interface SupportRichEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
    disabled?: boolean;
}

const SupportRichEditor = ({
    value,
    onChange,
    placeholder = 'Describe your issue or type your message...',
    className = '',
    minHeight = '120px',
    disabled = false,
}: SupportRichEditorProps) => {
    return (
        <div className={`support-rich-editor ${className}`}>
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                modules={SUPPORT_EDITOR_MODULES}
                formats={SUPPORT_EDITOR_FORMATS}
                readOnly={disabled}
                style={{ minHeight }}
                className="support-quill-editor"
            />
            <style>{`
                .support-rich-editor .ql-container {
                    min-height: ${minHeight};
                    font-size: 14px;
                }
                .support-rich-editor .ql-editor {
                    min-height: ${minHeight};
                }
                .support-rich-editor .ql-toolbar.ql-snow {
                    border-radius: 6px 6px 0 0;
                    border-color: #e0e6ed;
                }
                .support-rich-editor .ql-container.ql-snow {
                    border-radius: 0 0 6px 6px;
                    border-color: #e0e6ed;
                }
                .dark .support-rich-editor .ql-toolbar.ql-snow,
                .dark .support-rich-editor .ql-container.ql-snow {
                    border-color: rgba(255,255,255,0.1);
                }
                .support-rich-editor .ql-editor.ql-blank::before {
                    color: #999;
                }
            `}</style>
        </div>
    );
};

export default SupportRichEditor;
