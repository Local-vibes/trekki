// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock dnd-kit constructs to avoid pointer event issues in JSDOM
// Using a simplified mock for SortableItem to just render children
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
        arrayMove: (items, oldIndex, newIndex) => items, // Simple mock
        sortableKeyboardCoordinates: () => { },
    };
});

describe('App', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('renders initial empty state', () => {
        render(<App />);
        expect(screen.getByText(/Trekki/i)).toBeInTheDocument();
        expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument();
    });

    it('allows adding a todo', async () => {
        const user = userEvent.setup();
        render(<App />);

        const input = screen.getByPlaceholderText(/What needs to be done?/i);
        await user.type(input, 'New Task');

        // Find add button - checking by svg or structure
        // The component has <button type="submit" ...><Plus .../></button>
        // Just hitting enter on the input is easier and more robust for a form
        await user.type(input, '{enter}');

        expect(screen.getByText('New Task')).toBeInTheDocument();
    });

    it('allows editing a todo', async () => {
        const user = userEvent.setup();
        render(<App />);

        // Add task
        const input = screen.getByPlaceholderText(/What needs to be done?/i);
        await user.type(input, 'Task to Edit{enter}');

        // Find and click more button
        const moreBtn = screen.getByTitle('More actions');
        await user.click(moreBtn);

        // Find edit item in menu
        const editItem = screen.getByText('Edit Task');
        await user.click(editItem);

        // Edit input should appear
        const editInput = screen.getByDisplayValue('Task to Edit');
        await user.clear(editInput);
        await user.type(editInput, 'Edited Task{enter}');

        expect(screen.getByText('Edited Task')).toBeInTheDocument();
        expect(screen.queryByText('Task to Edit')).not.toBeInTheDocument();
    });

    it('allows deleting a todo', async () => {
        const user = userEvent.setup();
        render(<App />);

        // Add task
        const input = screen.getByPlaceholderText(/What needs to be done?/i);
        await user.type(input, 'Task to Delete{enter}');

        expect(screen.getByText('Task to Delete')).toBeInTheDocument();

        // Find delete button
        const moreBtn = screen.getByTitle('More actions');
        await user.click(moreBtn);
        const deleteItem = screen.getByText('Delete');
        await user.click(deleteItem);

        expect(screen.queryByText('Task to Delete')).not.toBeInTheDocument();
    });
});
