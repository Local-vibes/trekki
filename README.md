# Trekki - Todo App

A sleek, modern Todo application built with **React** and **Bun**, featuring a premium glassmorphism design.

## Features

- 💎 **Premium Aesthetic**: Modern dark mode with glassmorphism effects and smooth transitions.
- ⚡ **Bun Powered**: High-performance runtime for development and dependency management.
- 💾 **Persistence**: Tasks are automatically saved to `localStorage`.
- 🎨 **Lucide Icons**: Beautiful, consistent iconography.
- 📱 **Responsive Design**: Optimized for various screen sizes.

## Getting Started

### Prerequisites

You need [Bun](https://bun.sh/) installed on your system.

### Installation

1. Clone the repository or download the files.
2. Install dependencies:
   ```bash
   bun install
   ```

### Development

Start the development server:
```bash
bun dev
```

### Building for Production

To create a production build:
```bash
bun run build
```

## How to use

### Lists

- Click the list name (e.g. "General") in the header to open the list switcher.
- Add a list: "Add new list" at the bottom of the dropdown.
- Switch list: click a list in the dropdown.
- Rename/delete: open the list dropdown, click the ⋮ (more) on a list → Rename or Delete (delete only when more than one list).

### Tasks

- Add: type in the input and press Enter or click the + button.
- Complete: click the checkbox.
- Reorder: drag and drop.
- Edit: click ⋮ on a task → Edit, or use keyboard (see shortcuts). Save with Enter, cancel with Esc.
- Delete / Move to list: ⋮ on a task → Delete or "Move to List" and pick a list.

### Export

- Export current list as Markdown: press `p` to open the export modal, then copy from the modal.

### Keyboard shortcuts

- Press **h** or **?** in the app to open the full shortcut list.
- Common: **a** = focus add-item input; **u** or **Ctrl+Z** = undo.

## Tech Stack

- **Framework**: [React](https://reactjs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Runtime**: [Bun](https://bun.sh/)
- **Styling**: Vanilla CSS (Custom Design System)
- **Icons**: [Lucide React](https://lucide.dev/)

## File Structure

- `src/App.jsx`: Main application logic and state management.
- `src/index.css`: Custom design system and glassmorphism styles.
- `src/main.jsx`: Application entry point.
