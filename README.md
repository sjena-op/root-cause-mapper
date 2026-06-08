# Problem Network

An interactive graph-based visualization tool built as a personal project to map, visualize, and analyze complex, interconnected problems affecting society. It leverages graph concepts and modern web UI tools to let users define societal issues and construct a visual cause-and-effect network.

---

## 🌟 The Vision
The core idea behind this project is to build a **Problem Network** that goes beyond a simple list of issues. By modeling problems as nodes and relationships (causes and effects) as directed edges, we can visualize the root causes of systemic societal challenges.

The application is built with simplicity, clean visualization, and scalability in mind, designed to run smoothly on desktop environments (like Ubuntu Linux) and deployable for public hosting so anyone can explore the network.

---

## 🛠️ Key Features

### 1. Interactive Workspace
* **Societal Issue Definition:** Define and customize problem nodes with labels, details, and difficulty ratings.
* **Canvas Visualization:** Interactive workspace where problem nodes can be positioned, edited, and dynamically added.
* **Quick Search:** Easily search and filter existing problems using a keyword search bar.
* **Smart Drag-and-Drop Relations (Planned/In Progress):** Establish relationships between problems by dropping one over another (dropping "over" to link as a cause, or "under" to link as an effect) with real-time hover previews.
* **Auto-Layout Engine:** Auto-adjust and conformation of the connector lines to present a clean, organized, directed acyclic/directed graph (DAG) layout using Dagre.

### 2. Graph & Network Analysis (Planned/In Progress)
Dedicated analytical tools to query the structure of the problem network:
* **Root Cause Finder:** Identify the "root(s)" of all problems (nodes with no incoming causes).
* **Cycle Detector:** Detect cyclic dependency behavior in the graph (identifying loops where problems sustain each other).
* **Longest Chain Search:** Locate the longest chain of problems to find the most deep-seated systemic paths.
* **Difficulty Profiling:** Instantly highlight the easiest and hardest problems to solve within the network.

---

## 🚀 Technical Stack
* **Framework:** React + Vite (Fast HMR development environment)
* **Visualization:** React Flow (interactive canvas) & Dagre Graph (auto-layout calculations)
* **Styling:** CSS
* **Target Environment:** Development optimized for Linux (Ubuntu) desktop.

---

## 💻 Getting Started

### Prerequisites
Make sure you have Node.js and npm installed.

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App
Start the development server locally:
```bash
npm run dev
```
Open your browser and navigate to the local URL (usually `http://localhost:5173`).
