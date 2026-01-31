import React, { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Check, X, Pencil, ChevronDown, FolderInput, MoreHorizontal, Settings2, Copy } from 'lucide-react'
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
  const [lists, setLists] = useState(() => {
    const savedLists = localStorage.getItem('trekki_lists')
    if (savedLists) return JSON.parse(savedLists)

    // Migration logic for existing single list
    const oldTodos = localStorage.getItem('todos')
    const initialItems = oldTodos ? JSON.parse(oldTodos) : []

    return [{
      id: 'default',
      name: 'General',
      items: initialItems,
      createdAt: new Date().toISOString()
    }]
  })

  const [activeListId, setActiveListId] = useState(() => {
    return localStorage.getItem('trekki_active_list') || 'default'
  })

  const [isListMenuOpen, setIsListMenuOpen] = useState(false)
  const [movingItemId, setMovingItemId] = useState(null)

  const activeList = lists.find(l => l.id === activeListId) || lists[0]
  const todos = activeList.items

  const [inputValue, setInputValue] = useState('')

  // Edit state
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const editInputRef = useRef(null)
  const mainInputRef = useRef(null)

  // Hotkeys state
  const [hoveredId, setHoveredId] = useState(null)
  const [hoveredListId, setHoveredListId] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportMarkdown, setExportMarkdown] = useState('')
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)

  // List edit state
  const [editingListId, setEditingListId] = useState(null)
  const [editListName, setEditListName] = useState('')
  const [openListMenuId, setOpenListMenuId] = useState(null)
  const listEditInputRef = useRef(null)

  // History state
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])

  const pushToHistory = (newListsOrTodos) => {
    setPast(p => [...p, lists])
    setFuture([])

    // Check if we passed a todo array (simple update to active list)
    if (Array.isArray(newListsOrTodos) && (newListsOrTodos.length === 0 || 'text' in newListsOrTodos[0])) {
      const newLists = lists.map(l =>
        l.id === activeListId ? { ...l, items: newListsOrTodos } : l
      )
      setLists(newLists)
    } else {
      // Must be the whole lists array
      setLists(newListsOrTodos)
    }
  }

  const undo = () => {
    if (past.length === 0) return
    const previous = past[past.length - 1]
    const newPast = past.slice(0, past.length - 1)
    setPast(newPast)
    setFuture([lists, ...future])
    setLists(previous)
  }

  const redo = () => {
    if (future.length === 0) return
    const next = future[0]
    const newFuture = future.slice(1)
    setPast([...past, lists])
    setFuture(newFuture)
    setLists(next)
  }

  // List management
  const addList = () => {
    const newList = {
      id: crypto.randomUUID(),
      name: 'New List',
      items: [],
      createdAt: new Date().toISOString()
    }
    pushToHistory([...lists, newList])
    setActiveListId(newList.id)
    setIsListMenuOpen(false)
  }

  const deleteList = (id) => {
    if (lists.length <= 1) return
    const newLists = lists.filter(l => l.id !== id)
    if (activeListId === id) {
      setActiveListId(newLists[0].id)
    }
    pushToHistory(newLists)
  }

  const startEditingList = (list) => {
    setEditingListId(list.id)
    setEditListName(list.name)
    setOpenListMenuId(null)
  }

  const cancelEditList = () => {
    setEditingListId(null)
    setEditListName('')
  }

  const saveEditList = (id) => {
    if (!editListName.trim()) {
      cancelEditList()
      return
    }
    const newLists = lists.map(l => l.id === id ? { ...l, name: editListName.trim() } : l)
    pushToHistory(newLists)
    setEditingListId(null)
    setEditListName('')
  }

  const handleListEditKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      saveEditList(id)
    } else if (e.key === 'Escape') {
      cancelEditList()
    }
  }

  const renameList = (id, newName) => {
    if (!newName.trim()) return
    const newLists = lists.map(l => l.id === id ? { ...l, name: newName.trim() } : l)
    setLists(newLists)
  }

  const moveTodo = (todoId, targetListId) => {
    const todoToMove = todos.find(t => t.id === todoId)
    if (!todoToMove) return

    const newLists = lists.map(l => {
      if (l.id === activeListId) {
        return { ...l, items: l.items.filter(t => t.id !== todoId) }
      }
      if (l.id === targetListId) {
        return { ...l, items: [todoToMove, ...l.items] }
      }
      return l
    })

    pushToHistory(newLists)
    setMovingItemId(null)
  }

  const buildMarkdownForActiveList = () => {
    const lines = [`# ${activeList.name}`, '']
    activeList.items.forEach((item) => {
      lines.push(item.completed ? `- [x] ${item.text}` : `- [ ] ${item.text}`)
    })
    return lines.join('\n')
  }

  const openExportModal = () => {
    setExportMarkdown(buildMarkdownForActiveList())
    setShowExportModal(true)
    setCopiedToClipboard(false)
  }

  const copyExportToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportMarkdown)
      setCopiedToClipboard(true)
      setTimeout(() => setCopiedToClipboard(false), 2000)
    } catch (_) {}
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
          if (isListMenuOpen && hoveredListId && !editingListId) {
            e.preventDefault()
            const listToEdit = lists.find(l => l.id === hoveredListId)
            if (listToEdit) startEditingList(listToEdit)
          } else if (hoveredId && !editingId) {
            e.preventDefault()
            const todoToEdit = todos.find(t => t.id === hoveredId)
            if (todoToEdit) startEditing(todoToEdit)
          }
          break
        case 'd':
          if (isListMenuOpen && hoveredListId) {
            e.preventDefault()
            const listToDelete = lists.find(l => l.id === hoveredListId)
            if (listToDelete && confirm(`Delete list "${listToDelete.name}" and all its tasks?`)) {
              deleteList(hoveredListId)
            }
          } else if (hoveredId) {
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
        case 'p':
          e.preventDefault()
          openExportModal()
          break
        case 'h':
        case '?':
          e.preventDefault()
          setShowHelp(true)
          break
        case 'escape':
          if (showExportModal) {
            e.preventDefault()
            setShowExportModal(false)
          }
          if (showHelp) {
            e.preventDefault()
            setShowHelp(false)
          }
          if (isListMenuOpen) {
            if (openListMenuId) {
              setOpenListMenuId(null)
            } else if (editingListId) {
              cancelEditList()
            } else {
              e.preventDefault()
              setIsListMenuOpen(false)
            }
          }
          if (movingItemId) {
            e.preventDefault()
            setMovingItemId(null)
          }
          break;
        case 'arrowup':
        case 'arrowdown': {
          if (isListMenuOpen) {
            e.preventDefault()
            const currentIndex = hoveredListId ? lists.findIndex(l => l.id === hoveredListId) : -1
            const isUp = e.key.toLowerCase() === 'arrowup'
            let nextIndex
            if (currentIndex === -1) {
              nextIndex = isUp ? lists.length - 1 : 0
            } else {
              if (isUp) {
                nextIndex = currentIndex <= 0 ? lists.length - 1 : currentIndex - 1
              } else {
                nextIndex = currentIndex >= lists.length - 1 ? 0 : currentIndex + 1
              }
            }
            setHoveredListId(lists[nextIndex].id)
            return
          }
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
  }, [hoveredId, hoveredListId, editingId, editingListId, openListMenuId, lists, todos, showHelp, showExportModal, past, future, isListMenuOpen, movingItemId])

  // Click away listener for menus
  useEffect(() => {
    const handleClickAway = (e) => {
      // Close list menu if click is outside switcher and dropdown
      if (isListMenuOpen && !e.target.closest('.dropdown-menu') && !e.target.closest('.breadcrumb-list')) {
        setIsListMenuOpen(false)
        setOpenListMenuId(null)
        setEditingListId(null)
      }

      // Close list action menu if click is outside
      if (openListMenuId && !e.target.closest('.item-action-menu') && !e.target.closest('.btn-more-list')) {
        setOpenListMenuId(null)
      }

      // Close item action menu if click is outside the "More" button and the menu itself
      if (movingItemId && !e.target.closest('.item-action-menu') && !e.target.closest('.btn-move')) {
        setMovingItemId(null)
      }
    }

    window.addEventListener('mousedown', handleClickAway)
    return () => window.removeEventListener('mousedown', handleClickAway)
  }, [isListMenuOpen, movingItemId, openListMenuId])

  useEffect(() => {
    localStorage.setItem('trekki_lists', JSON.stringify(lists))
  }, [lists])

  useEffect(() => {
    localStorage.setItem('trekki_active_list', activeListId)
  }, [activeListId])

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingId])

  useEffect(() => {
    if (editingListId && listEditInputRef.current) {
      listEditInputRef.current.focus()
    }
  }, [editingListId])

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
      <div className="header-container">
        <h1 className="app-title">
          <span className="breadcrumb-main">Trekki</span>
          <span className="breadcrumb-separator">/</span>
          <div
            className="breadcrumb-list"
            onClick={() => setIsListMenuOpen(!isListMenuOpen)}
          >
            {activeList.name}
            <ChevronDown size={18} />
          </div>
        </h1>
        {isListMenuOpen && (
          <div className="dropdown-menu">
            {lists.map(list => (
              <div
                key={list.id}
                className={`dropdown-item ${list.id === activeListId ? 'active' : ''} ${hoveredListId === list.id ? 'keyboard-selected' : ''} ${openListMenuId === list.id ? 'menu-open' : ''} ${editingListId === list.id ? 'editing' : ''}`}
                onClick={() => {
                  if (editingListId !== list.id) {
                    setActiveListId(list.id)
                    setIsListMenuOpen(false)
                  }
                }}
                onMouseEnter={() => setHoveredListId(list.id)}
                onMouseLeave={() => setHoveredListId(null)}
              >
                {editingListId === list.id ? (
                  <div className="list-edit-container">
                    <input
                      ref={listEditInputRef}
                      type="text"
                      className="list-edit-input"
                      value={editListName}
                      onChange={(e) => setEditListName(e.target.value)}
                      onKeyDown={(e) => handleListEditKeyDown(e, list.id)}
                      onBlur={() => saveEditList(list.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                ) : (
                  <>
                    <span className="list-item-name">{list.name}</span>
                    <div className={`list-item-actions ${openListMenuId === list.id ? 'menu-open' : ''}`}>
                      <div className="btn-more-list">
                        <button
                          className="btn-action"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenListMenuId(openListMenuId === list.id ? null : list.id)
                          }}
                          title="More actions"
                        >
                          <MoreHorizontal size={14} />
                        </button>

                        {openListMenuId === list.id && (
                          <div className="item-action-menu">
                            <div
                              className="action-menu-item"
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditingList(list)
                              }}
                            >
                              <Pencil size={14} />
                              <span>Rename</span>
                              <kbd className="menu-kbd">e</kbd>
                            </div>
                            {lists.length > 1 && (
                              <div
                                className="action-menu-item danger"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (confirm(`Delete list "${list.name}" and all its tasks?`)) deleteList(list.id)
                                }}
                              >
                                <Trash2 size={14} />
                                <span>Delete</span>
                                <kbd className="menu-kbd">d</kbd>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
            <div className="dropdown-divider"></div>
            <div className="dropdown-item btn-add-list" onClick={addList}>
              <Plus size={16} /> Add new list
            </div>
          </div>
        )}
      </div>
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
                    className={`todo-item ${editingId === todo.id ? 'editing' : ''} ${hoveredId === todo.id ? 'keyboard-selected' : ''} ${movingItemId === todo.id ? 'menu-open' : ''}`}
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
                        <div className={`item-actions ${movingItemId === todo.id ? 'menu-open' : ''}`}>
                          <div className="btn-move">
                            <button
                              className="btn-action"
                              onClick={() => setMovingItemId(movingItemId === todo.id ? null : todo.id)}
                              title="More actions"
                            >
                              <MoreHorizontal size={16} />
                            </button>


                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {movingItemId === todo.id && (
                    <div className="item-action-menu">
                      <div
                        className="action-menu-item"
                        onClick={() => {
                          startEditing(todo)
                          setMovingItemId(null)
                        }}
                      >
                        <Pencil size={14} />
                        <span>Edit</span>
                        <kbd className="menu-kbd">e</kbd>
                      </div>
                      <div className="action-menu-divider"></div>
                      <div className="action-menu-title">Move to List</div>
                      {lists.filter(l => l.id !== activeListId).length === 0 ? (
                        <div className="action-menu-item" style={{ opacity: 0.5, cursor: 'default' }}>
                          No other lists
                        </div>
                      ) : (
                        lists.filter(l => l.id !== activeListId).map(list => (
                          <div
                            key={list.id}
                            className="action-menu-item"
                            onClick={() => moveTodo(todo.id, list.id)}
                          >
                            <FolderInput size={14} />
                            <span>{list.name}</span>
                          </div>
                        ))
                      )}
                      <div
                        className="action-menu-item danger"
                        onClick={() => deleteTodo(todo.id)}
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                        <kbd className="menu-kbd">d</kbd>
                      </div>
                    </div>
                  )}
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
        )
        }
      </div >
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content export-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Export to Markdown</h2>
              <button className="btn-close-modal" onClick={() => setShowExportModal(false)}>
                <X size={20} />
              </button>
            </div>
            <pre className="export-markdown-preview">{exportMarkdown}</pre>
            <button type="button" className="btn-copy-export" onClick={copyExportToClipboard}>
              <Copy size={18} />
              {copiedToClipboard ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div >
  )
}

export default App
