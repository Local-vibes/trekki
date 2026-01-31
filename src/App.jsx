import React, { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Check, X, Pencil } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { HelpModal } from './HelpModal';

function App() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('todos')
    return saved ? JSON.parse(saved) : []
  })
  const [inputValue, setInputValue] = useState('')

  // Edit state
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const editInputRef = useRef(null)
  const mainInputRef = useRef(null)

  // Hotkeys state
  const [hoveredId, setHoveredId] = useState(null)
  const [showHelp, setShowHelp] = useState(false)

  // History state
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])

  const pushToHistory = (newTodos) => {
    setPast(p => [...p, todos])
    setFuture([])
    setTodos(newTodos)
  }

  const undo = () => {
    if (past.length === 0) return
    const previous = past[past.length - 1]
    const newPast = past.slice(0, past.length - 1)
    setPast(newPast)
    setFuture([todos, ...future])
    setTodos(previous)
  }

  const redo = () => {
    if (future.length === 0) return
    const next = future[0]
    const newFuture = future.slice(1)
    setPast([...past, todos])
    setFuture(newFuture)
    setTodos(next)
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey

      // Undo/Redo shortcuts
      if (isCmdOrCtrl) {
        if (e.key.toLowerCase() === 'z') {
          if (e.shiftKey) {
            e.preventDefault()
            redo()
          } else {
            e.preventDefault()
            undo()
          }
          return
        }
      }

      switch (e.key.toLowerCase()) {
        case 'u':
          e.preventDefault()
          undo()
          break
        case 'r':
          e.preventDefault()
          redo()
          break
        case 'a':
          e.preventDefault()
          if (mainInputRef.current) {
            mainInputRef.current.focus()
          }
          break
        case 'e':
          if (hoveredId && !editingId) {
            e.preventDefault()
            const todoToEdit = todos.find(t => t.id === hoveredId)
            if (todoToEdit) startEditing(todoToEdit)
          }
          break
        case 'd':
          if (hoveredId) {
            e.preventDefault()
            deleteTodo(hoveredId)
          }
          break
        case 'c':
          if (hoveredId && !editingId) {
            e.preventDefault()
            toggleTodo(hoveredId)
          }
          break
        case 'h':
        case '?':
          e.preventDefault()
          setShowHelp(true)
          break
        case 'escape':
          if (showHelp) {
            e.preventDefault()
            setShowHelp(false)
          }
          break
        case 'arrowup':
        case 'arrowdown': {
          if (todos.length === 0) return
          e.preventDefault()

          const currentIndex = hoveredId ? todos.findIndex(t => t.id === hoveredId) : -1
          const isUp = e.key.toLowerCase() === 'arrowup'
          const isReorder = (e.ctrlKey || e.metaKey) && e.shiftKey
          if (isReorder) {
            if (currentIndex === -1) return
            if (isUp && currentIndex === 0) return
            if (!isUp && currentIndex === todos.length - 1) return

            const nextIndex = isUp ? currentIndex - 1 : currentIndex + 1
            const newTodos = [...todos]
            const [movedItem] = newTodos.splice(currentIndex, 1)
            newTodos.splice(nextIndex, 0, movedItem)
            pushToHistory(newTodos)
          } else {
            // Navigation with looping
            let nextIndex
            if (currentIndex === -1) {
              nextIndex = isUp ? todos.length - 1 : 0
            } else {
              if (isUp) {
                nextIndex = currentIndex <= 0 ? todos.length - 1 : currentIndex - 1
              } else {
                nextIndex = currentIndex >= todos.length - 1 ? 0 : currentIndex + 1
              }
            }
            setHoveredId(todos[nextIndex].id)
          }
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hoveredId, editingId, todos, showHelp, past, future])

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingId])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = todos.findIndex((item) => item.id === active.id);
      const newIndex = todos.findIndex((item) => item.id === over.id);
      pushToHistory(arrayMove(todos, oldIndex, newIndex));
    }
  };

  const addTodo = (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const newTodo = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    }

    pushToHistory([newTodo, ...todos])
    setInputValue('')
  }

  const toggleTodo = (id) => {
    if (editingId === id) return // Prevent toggling while editing
    pushToHistory(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id) => {
    pushToHistory(todos.filter(todo => todo.id !== id))
  }

  // Edit handlers
  const startEditing = (todo) => {
    setEditingId(todo.id)
    setEditText(todo.text)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const saveEdit = (id) => {
    if (!editText.trim()) return

    pushToHistory(todos.map(todo =>
      todo.id === id ? { ...todo, text: editText.trim() } : todo
    ))
    setEditingId(null)
    setEditText('')
  }

  const handleEditKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      saveEdit(id)
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  return (
    <div className="glass-card">
      <h1 className="app-title">Trekki</h1>
      <p className="app-subtitle">Press h or ? for help</p>

      <form onSubmit={addTodo} className="input-container">
        <input
          ref={mainInputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && e.target.blur()}
          placeholder="What needs to be done?"
          autoFocus={!editingId}
        />
        <button type="submit" className="btn-add">
          <Plus size={20} />
        </button>
      </form>

      <div className="todo-list">
        {todos.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '2rem 0' }}>
            No tasks yet. Start by adding one!
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={todos}
              strategy={verticalListSortingStrategy}
            >
              {todos.map(todo => (
                <SortableItem key={todo.id} id={todo.id}>
                  <div
                    className={`todo-item ${editingId === todo.id ? 'editing' : ''} ${hoveredId === todo.id ? 'keyboard-selected' : ''}`}
                    onMouseEnter={() => setHoveredId(todo.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div
                      className={`todo-checkbox ${todo.completed ? 'completed' : ''} ${editingId === todo.id ? 'editing-placeholder' : ''}`}
                      onClick={() => editingId !== todo.id && toggleTodo(todo.id)}
                    >
                      {todo.completed && <Check size={14} color="white" />}
                    </div>

                    {editingId === todo.id ? (
                      <div className="edit-container">
                        <input
                          ref={editInputRef}
                          type="text"
                          className="edit-input"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => handleEditKeyDown(e, todo.id)}
                          onBlur={() => saveEdit(todo.id)}
                        />
                        <div className="edit-actions">
                          <button
                            className="btn-action btn-save"
                            onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                            onClick={() => saveEdit(todo.id)}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            className="btn-action btn-cancel"
                            onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                            onClick={cancelEdit}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>
                          {todo.text}
                        </span>
                        <div className="item-actions">
                          <button
                            className="btn-action btn-edit"
                            onClick={() => startEditing(todo)}
                            title="Edit task"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="btn-action btn-delete"
                            onClick={() => deleteTodo(todo.id)}
                            title="Delete task"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
        )
        }
      </div >
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div >
  )
}

export default App
