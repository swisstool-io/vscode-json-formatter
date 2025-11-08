import * as vscode from 'vscode';

/**
 * Activates the JSON Formatter extension.
 * Registers commands for beautifying, minifying, and sorting JSON.
 */
export function activate(context: vscode.ExtensionContext) {
  // Register beautify command
  const beautifyCmd = vscode.commands.registerCommand(
    'jsonFormatter.beautify',
    async (uri?: vscode.Uri) => {
      await formatJson(uri, 'beautify');
    }
  );

  // Register minify command
  const minifyCmd = vscode.commands.registerCommand(
    'jsonFormatter.minify',
    async (uri?: vscode.Uri) => {
      await formatJson(uri, 'minify');
    }
  );

  // Register sort command
  const sortCmd = vscode.commands.registerCommand(
    'jsonFormatter.sort',
    async (uri?: vscode.Uri) => {
      await formatJson(uri, 'sort');
    }
  );

  // Register combined beautify + sort command
  const beautifySortCmd = vscode.commands.registerCommand(
    'jsonFormatter.beautifySort',
    async (uri?: vscode.Uri) => {
      await formatJson(uri, 'beautifySort');
    }
  );

  context.subscriptions.push(beautifyCmd, minifyCmd, sortCmd, beautifySortCmd);
}

/**
 * Strip comments from JSON/JSONC text
 */
function stripJsonComments(text: string): string {
  // Remove single-line comments
  let result = text.replace(/\/\/.*$/gm, '');
  
  // Remove multi-line comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Remove trailing commas before } or ]
  result = result.replace(/,(\s*[}\]])/g, '$1');
  
  return result;
}

/**
 * Main function to format JSON files based on the specified action.
 */
async function formatJson(uri: vscode.Uri | undefined, action: 'beautify' | 'minify' | 'sort' | 'beautifySort') {
  const editor = vscode.window.activeTextEditor;

  // Target URI from context or active doc
  if (!uri) {
    uri = editor?.document.uri;
  }
  
  if (!uri) {
    vscode.window.showWarningMessage('No file selected.');
    return;
  }
  
  if (uri.scheme !== 'file') {
    vscode.window.showWarningMessage('Only local files can be formatted.');
    return;
  }

  // Check if file is JSON or JSONC
  const isJsonFile = uri.fsPath.endsWith('.json') || uri.fsPath.endsWith('.jsonc');
  const languageId = editor?.document.languageId;
  const isJsonLanguage = languageId === 'json' || languageId === 'jsonc';
  
  if (!isJsonFile && !isJsonLanguage) {
    vscode.window.showWarningMessage('File must be a JSON or JSONC file.');
    return;
  }

  // Read source text either from open doc (preserve EOL) or FS
  let text: string;
  let eol: vscode.EndOfLine = vscode.EndOfLine.LF;
  let selectionRange: vscode.Range | undefined;
  let isSelection = false;

  const openDoc = vscode.workspace.textDocuments.find(d => d.uri.fsPath === uri!.fsPath);
  
  if (openDoc) {
    // Check if there's a selection and if it's in the active editor
    if (editor && editor.document === openDoc && !editor.selection.isEmpty) {
      selectionRange = new vscode.Range(editor.selection.start, editor.selection.end);
      text = openDoc.getText(selectionRange);
      isSelection = true;
    } else {
      text = openDoc.getText();
    }
    eol = openDoc.eol;
  } else {
    const buf = await vscode.workspace.fs.readFile(uri);
    text = Buffer.from(buf).toString('utf8');
    // Detect EOL from file content
    if (text.includes('\r\n')) {
      eol = vscode.EndOfLine.CRLF;
    }
  }

  // Get configuration
  const config = vscode.workspace.getConfiguration('jsonFormatter');
  const recursiveSort = config.get<boolean>('sort.recursive', true);
  const caseInsensitive = config.get<boolean>('sort.caseInsensitive', true);
  const showSuccessToast = config.get<boolean>('showSuccessToast', false);

  // Strip comments for JSONC files
  const isJsonc = uri.fsPath.endsWith('.jsonc') || languageId === 'jsonc';
  if (isJsonc) {
    text = stripJsonComments(text);
  }

  // Parse JSON
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e: any) {
    // Try stripping comments even for .json files as a fallback
    if (!isJsonc) {
      try {
        const strippedText = stripJsonComments(text);
        data = JSON.parse(strippedText);
      } catch {
        vscode.window.showErrorMessage(`Invalid JSON: ${e.message}`);
        return;
      }
    } else {
      vscode.window.showErrorMessage(`Invalid JSON: ${e.message}`);
      return;
    }
  }

  // Get indentation settings
  // Pass the text for detection even if document is not open
  const indentationInfo = await getIndentationSettings(openDoc, editor, text);
  
  // Transform
  const transform = (d: any) => {
    if (action === 'minify') {
      return JSON.stringify(d);
    }
    
    const sorted = (action === 'sort' || action === 'beautifySort') 
      ? sortObjectKeys(d, recursiveSort, caseInsensitive) 
      : d;
    
    return JSON.stringify(sorted, null, indentationInfo.indent);
  };

  let formatted = transform(data);

  // Normalize EOL to match original document
  const eolChar = eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
  formatted = formatted.replace(/\r?\n/g, eolChar);

  // Apply edit
  const edit = new vscode.WorkspaceEdit();
  
  if (openDoc) {
    if (selectionRange) {
      // Replace only the selection
      edit.replace(uri, selectionRange, formatted);
    } else {
      // Replace entire document
      const fullRange = new vscode.Range(
        openDoc.lineAt(0).range.start,
        openDoc.lineAt(openDoc.lineCount - 1).range.end
      );
      edit.replace(uri, fullRange, formatted);
    }
    
    const success = await vscode.workspace.applyEdit(edit);
    
    if (!success) {
      vscode.window.showErrorMessage('Failed to apply formatting.');
      return;
    }
    
    // Save if configured to format on save and document is dirty
    if (!isSelection && openDoc.isDirty) {
      await openDoc.save();
    }
  } else {
    // File not open in editor, write directly
    await vscode.workspace.fs.writeFile(uri, Buffer.from(formatted, 'utf8'));
  }

  // Show success message
  const actionLabel = getActionLabel(action);
  if (showSuccessToast) {
    vscode.window.showInformationMessage(`JSON ${actionLabel} completed successfully.`);
  } else {
    vscode.window.setStatusBarMessage(`JSON ${actionLabel} done`, 3000);
  }
}

/**
 * Get indentation settings from document or editor configuration
 */
async function getIndentationSettings(
  document: vscode.TextDocument | undefined,
  editor: vscode.TextEditor | undefined,
  text?: string
): Promise<{ indent: string | number }> {
  
  // Try to detect from document first, or from provided text
  const textToAnalyze = document ? document.getText() : text;
  if (textToAnalyze) {
    const detected = detectIndentation(textToAnalyze);
    if (detected !== null) {
      // Return exactly what was detected
      return { indent: detected };
    }
  }
  
  // Fall back to editor settings
  const editorConfig = vscode.workspace.getConfiguration('editor');
  const insertSpaces = editorConfig.get<boolean>('insertSpaces', true);
  const tabSize = editorConfig.get<number>('tabSize', 2);
  
  // Check if there's an active text editor with specific settings
  if (editor) {
    const editorInsertSpaces = editor.options.insertSpaces;
    const editorTabSize = editor.options.tabSize;
    
    if (typeof editorInsertSpaces === 'boolean') {
      if (editorInsertSpaces) {
        return { indent: typeof editorTabSize === 'number' ? editorTabSize : tabSize };
      } else {
        return { indent: '\t' };
      }
    }
  }
  
  return { indent: insertSpaces ? tabSize : '\t' };
}

/**
 * Detect indentation from existing JSON content
 */
function detectIndentation(text: string): string | number | null {
  // Look for the first indented line after an opening brace or bracket
  const lines = text.split(/\r?\n/);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for tab indentation first (more specific)
    if (line.match(/^\t/)) {
      return '\t';
    }
    
    // Check for space indentation (looking for consistent patterns)
    const spaceMatch = line.match(/^( +)["\[\{]/);
    if (spaceMatch) {
      // Found spaces before a JSON structure character
      const spaces = spaceMatch[1].length;
      // Common indentations are 2 or 4 spaces
      if (spaces === 2 || spaces === 4) {
        return spaces;
      }
    }
    
    // Also check for any line that starts with spaces and has content
    const generalSpaceMatch = line.match(/^( +)\S/);
    if (generalSpaceMatch) {
      const spaces = generalSpaceMatch[1].length;
      // Accept any consistent spacing, but prefer 2 or 4
      if (spaces > 0) {
        return spaces;
      }
    }
  }
  
  return null;
}

/**
 * Get human-readable action label
 */
function getActionLabel(action: string): string {
  switch (action) {
    case 'beautify':
      return 'beautified';
    case 'minify':
      return 'minified';
    case 'sort':
      return 'sorted';
    case 'beautifySort':
      return 'beautified and sorted';
    default:
      return 'formatted';
  }
}

/**
 * Recursively sorts object keys alphabetically.
 * Arrays and primitive values are preserved as-is.
 */
function sortObjectKeys(obj: any, recursive: boolean = true, caseInsensitive: boolean = true): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return recursive ? obj.map(item => sortObjectKeys(item, recursive, caseInsensitive)) : obj;
  }

  const sorted: any = {};
  const keys = Object.keys(obj).sort((a, b) => {
    if (caseInsensitive) {
      return a.localeCompare(b, undefined, { sensitivity: 'base' });
    }
    return a.localeCompare(b);
  });
  
  for (const key of keys) {
    sorted[key] = recursive ? sortObjectKeys(obj[key], recursive, caseInsensitive) : obj[key];
  }

  return sorted;
}

/**
 * Called when the extension is deactivated.
 */
export function deactivate() {
}
