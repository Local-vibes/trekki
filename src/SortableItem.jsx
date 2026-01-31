import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export function SortableItem(props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        //zIndex: isDragging ? 10 : 10,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
    };

    return (
        <div ref={setNodeRef} style={style} className={`sortable-item-wrapper ${isDragging ? 'dragging' : ''}`} {...attributes} {...listeners} tabIndex={-1}>
            <div className="sortable-content">
                {props.children}
            </div>
        </div>
    );
}
