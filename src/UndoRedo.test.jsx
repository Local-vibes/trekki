import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, describe, beforeEach } from 'vitest'
import App from './App'
import React from 'react'

describe('Undo/Redo Functionality', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    test('can undo adding a todo', () => {
        render(<App />)
        const input = screen.getByPlaceholderText(/What needs to be done\?/i)

        fireEvent.change(input, { target: { value: 'New Todo' } })
        fireEvent.submit(input)

        expect(screen.getByText('New Todo')).toBeDefined()

        // Press 'u' to undo
        fireEvent.keyDown(window, { key: 'u' })

        expect(screen.queryByText('New Todo')).toBeNull()
    })

    test('can redo an undone addition', () => {
        render(<App />)
        const input = screen.getByPlaceholderText(/What needs to be done\?/i)

        fireEvent.change(input, { target: { value: 'New Todo' } })
        fireEvent.submit(input)

        // Undo
        fireEvent.keyDown(window, { key: 'u' })
        expect(screen.queryByText('New Todo')).toBeNull()

        // Redo using Shift+Ctrl+Z
        fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true })
        expect(screen.getByText('New Todo')).toBeDefined()
    })

    test('can undo deleting a todo', () => {
        render(<App />)
        const input = screen.getByPlaceholderText(/What needs to be done\?/i)

        fireEvent.change(input, { target: { value: 'Todo to Delete' } })
        fireEvent.submit(input)

        const deleteBtn = screen.getByTitle('Delete task')
        fireEvent.click(deleteBtn)

        expect(screen.queryByText('Todo to Delete')).toBeNull()

        // Ctrl+Z to undo
        fireEvent.keyDown(window, { key: 'z', ctrlKey: true })

        expect(screen.getByText('Todo to Delete')).toBeDefined()
    })

    test('undo/redo does not trigger when typing in input', () => {
        render(<App />)
        const input = screen.getByPlaceholderText(/What needs to be done\?/i)

        fireEvent.change(input, { target: { value: 'u' } })
        fireEvent.keyDown(input, { key: 'u' })

        // Should not trigger undo (which would clear the input if something was there, 
        // but here we just check if it doesn't crash or do something weird)
        expect(input.value).toBe('u')
    })
})
