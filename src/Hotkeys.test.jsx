// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock dnd-kit constructs
vi.mock('@dnd-kit/sortable', () => {
    return {
        SortableContext: ({ children }) => <>{children}</>,
        useSortable: ({ id }) => ({
            attributes: {},
            listeners: {},
            setNodeRef: (node) => node,
            transform: null,
            transition: null,
            isDragging: false,
        }),
        verticalListSortingStrategy: {},
        arrayMove: (items, oldIndex, newIndex) => items,
        sortableKeyboardCoordinates: () => { },
    };
});

describe('Hotkeys', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('enters edit mode when pressing lowercase e on hovered task', async () => {
        const user = userEvent.setup();
        render(<App />);

        // Add task
        const input = screen.getByPlaceholderText(/What needs to be done?/i);
        await user.type(input, 'Task 1{enter}');
        input.blur();

        const taskText = screen.getByText('Task 1');
        // Find the todo item container. The text is inside span.todo-text, which is inside div.todo-item
        // We can get closest('.todo-item') or just find by class if we add test id, 
        // but let's try getting parent.
        const taskItem = taskText.closest('.todo-item');

        // Hover
        await fireEvent.mouseEnter(taskItem);

        // Press 'e'
        await user.keyboard('e');

        // Should be in edit mode - input visible
        expect(screen.getByDisplayValue('Task 1')).toBeInTheDocument();
    });

    it('deletes task when pressing d on hovered task', async () => {
        const user = userEvent.setup();
        render(<App />);

        // Add task
        const input = screen.getByPlaceholderText(/What needs to be done?/i);
        await user.type(input, 'Task 2{enter}');
        input.blur();

        const taskText = screen.getByText('Task 2');
        const taskItem = taskText.closest('.todo-item');

        // Hover
        await fireEvent.mouseEnter(taskItem);

        // Press 'd'
        await user.keyboard('d');

        // Should be deleted
        expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
    });

    it('toggles task completion when pressing c on hovered task', async () => {
        const user = userEvent.setup();
        render(<App />);

        // Add task
        const input = screen.getByPlaceholderText(/What needs to be done?/i);
        await user.type(input, 'Task 3{enter}');
        input.blur();

        const taskText = screen.getByText('Task 3');
        const taskItem = taskText.closest('.todo-item');

        // Initial state: not completed
        // Check for completed class or check icon. 
        // In App.jsx: .todo-checkbox ${todo.completed ? 'completed' : ''}
        const checkbox = taskItem.querySelector('.todo-checkbox');
        expect(checkbox).not.toHaveClass('completed');

        // Hover
        await fireEvent.mouseEnter(taskItem);

        // Press 'c'
        await user.keyboard('c');

        // Should be completed
        expect(checkbox).toHaveClass('completed');

        // Press 'c' again
        await user.keyboard('c');

        // Should be not completed
        expect(checkbox).not.toHaveClass('completed');
    });

    it('shows help modal when pressing h or ?', async () => {
        const user = userEvent.setup();
        render(<App />);

        // Input is auto-focused, so we need to blur it first
        const input = screen.getByPlaceholderText(/What needs to be done?/i);
        input.blur();

        // Press 'h'
        await user.keyboard('h');
        // Check for modal presence
        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();

        // Close it with Escape
        await user.keyboard('{Escape}');

        // Should be closed
        expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();

        // Test '?' as well
        await user.keyboard('?');
        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();

        // Close with Escape again
        await user.keyboard('{Escape}');
        expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
    });
});
