# 🧩 JSON Formatter
[![CI](https://github.com/swisstool-io/vscode-json-formatter/actions/workflows/ci.yml/badge.svg)](https://github.com/swisstool-io/vscode-json-formatter/actions/workflows/ci.yml)
[![Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/swisstool.simple-json-formatter.svg?color=blue)](https://marketplace.visualstudio.com/items?itemName=swisstool.simple-json-formatter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)


How many times have you opened a messy JSON file that’s all on one line — or a config full of unordered keys and trailing commas?

**JSON Formatter** fixes that.
A small but powerful utility that makes your data readable, organized, and consistent.

Online formatters can sometimes process your data through remote servers, which may pose a risk if you’re working with **API keys, credentials, or sensitive configuration files**.
This extension runs **entirely offline**, inside your editor, keeping your data private and secure.


## ✨ Features

* **🎨 Beautify JSON** — Add proper indentation and spacing
* **📦 Minify JSON** — Compress JSON by removing extra whitespace
* **🔤 Sort Keys** — Alphabetically sort object keys (optionally recursive)
* **🪄 Beautify & Sort** — Combine both actions for perfect readability
* **💬 JSONC Support** — Works with JSON files that include comments
* **🔧 Smart Indentation** — Detects and preserves spaces or tabs
* **📝 Selection Formatting** — Works on selected text or entire file
* **⚙️ Configurable** — Customize sort behavior and notifications

## 🪄 Usage

### Command Palette

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run one of:

   * `JSON: Beautify`
   * `JSON: Minify`
   * `JSON: Sort Keys`
   * `JSON: Beautify & Sort`

### Context Menu

Right-click a `.json` or `.jsonc` file in:

* Explorer
* Editor
* Tab title
  → Select one of the available **JSON Formatter** actions.

### Keyboard Shortcut

`Shift+Alt+F` (Windows/Linux) or `Shift+Option+F` (macOS)
Triggers **Beautify** on the current file or selection.

### Selection Formatting

Select a block of JSON text → Run any formatter command →
Only that portion will be transformed.


## ⚙️ Configuration

You can tweak behavior in your VS Code settings:

```json
{
  "jsonFormatter.sort.recursive": true,        // Sort nested objects
  "jsonFormatter.sort.caseInsensitive": true,  // Ignore case when sorting keys
  "jsonFormatter.showSuccessToast": false      // Show toast instead of status bar
}
```


## 🧠 How It Works

* Automatically detects indentation (tabs or spaces)
* Strips single-line (`//`) and multi-line (`/* */`) comments in JSONC
* Removes trailing commas before parsing
* Preserves your file’s original line endings (LF / CRLF)
* Validates and shows clear errors if JSON is invalid
* Applies edits safely and atomically — never breaks your file


## 💡 Examples

### Beautify

**Before**

```json
{"name":"John","age":30,"city":"New York"}
```

**After**

```json
{
  "name": "John",
  "age": 30,
  "city": "New York"
}
```

### Sort Keys

**Before**

```json
{"zebra":1,"apple":2,"middle":3}
```

**After**

```json
{"apple":2,"middle":3,"zebra":1}
```

### JSONC Support

**Before**

```jsonc
{
  // App config
  "theme": "dark", // trailing comma
}
```

**After**

```json
{
  "theme": "dark"
}
```


## ⚠️ Known Limitations

* Comments are removed when formatting (JSONC standard)
* Very large JSON files (>10MB) may take slightly longer to process


## 🧩 Installation

**From Marketplace:**
```bash
ext install swisstool.simple-json-formatter
````

**From source:**

```bash
git clone https://github.com/swisstool-io/vscode-json-formatter
cd vscode-json-formatter
npm ci
npm run compile
npm run build:test
npm test
```

## 🧪 Requirements

| Platform          | Version               |
| ----------------- | --------------------- |
| VS Code           | 1.80+                 |
| OS                | macOS, Windows, Linux |
| Node.js (for dev) | 20.x                  |


## 💻 Development

To run locally:

```bash
npm run compile
code .
# Press F5 to start the Extension Host
```

## 🛠️ Part of the SwissTool Collection

A set of small, focused developer tools for VS Code — each designed to solve one problem cleanly and get out of your way.

Explore more at [swisstool.io](https://github.com/swisstool-io).


## 🤝 Contributing

Open source contributions are welcome. If you’d like to improve this extension or report an issue, feel free to open a pull request or discussion.

See [CONTRIBUTING.md](CONTRIBUTING.md) (coming soon) for guidelines.


---

**License:** [MIT](LICENSE) © 2025 — made with ❤️ by [Soufiane Rafik](https://github.com/soufrafik), part of [Swisstool.io](https://github.com/swisstool-io)
