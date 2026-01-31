import React from 'react';
import { X, Command } from 'lucide-react';

export function HelpModal({ onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>
                        <Command size={20} className="modal-icon" />
                        Keyboard Shortcuts
                    </h2>
                    <button className="btn-close-modal" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="shortcuts-list">
                    <div className="shortcut-item">
                        <kbd>↑</kbd> <span>/</span> <kbd>↓</kbd>
                        <span>Navigate items</span>
                    </div>
                    <div className="shortcut-item">
                        <kbd>a</kbd>
                        <span>Focus "Add item" input</span>
                    </div>
                    <div className="shortcut-item">
                        <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd>
                        <span>Move item up / down</span>
                    </div>
                    <div className="shortcut-item">
                        <kbd>u</kbd> <span>/</span> <kbd>Ctrl+Z</kbd>
                        <span>Undo last action</span>
                    </div>
                    <div className="shortcut-item">
                        <kbd>r</kbd> <span>/</span> <kbd>Ctrl+Shift+Z</kbd>
                        <span>Redo last action</span>
                    </div>
                    <div className="shortcut-item">
                        <kbd>e</kbd>
                        <span>Edit hovered/selected task</span>
                    </div>
                    <div className="shortcut-item">
                        <kbd>d</kbd>
                        <span>Delete hovered/selected task</span>
                    </div>
                    <div className="shortcut-item">
                        <kbd>c</kbd>
                        <span>Toggle task completion</span>
                    </div>
                    <div className="shortcut-item">
                        <kbd>h</kbd> <span>/</span> <kbd>?</kbd>
                        <span>Show this help</span>
                    </div>
                    <div className="shortcut-item">
                        <kbd>Esc</kbd>
                        <span>Cancel edit / Defocus / Close modal</span>
                    </div>
                    <div className="shortcut-item">
                        <kbd>Enter</kbd>
                        <span>Save edit</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
