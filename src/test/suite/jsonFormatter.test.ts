import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

suite('JSON Formatter Test Suite', () => {
  let testWorkspaceRoot: string;
  
  suiteSetup(async () => {
    // Create a unique test workspace directory
    testWorkspaceRoot = path.join(os.tmpdir(), `json-formatter-test-${Date.now()}`);
    if (!fs.existsSync(testWorkspaceRoot)) {
      fs.mkdirSync(testWorkspaceRoot, { recursive: true });
    }
    
    // Ensure extension is activated
    const ext = vscode.extensions.getExtension('SwissTool.json-formatter');
    if (ext && !ext.isActive) {
      await ext.activate();
    }
  });

  suiteTeardown(async () => {
    // Clean up test workspace
    if (fs.existsSync(testWorkspaceRoot)) {
      fs.rmSync(testWorkspaceRoot, { recursive: true, force: true });
    }
  });

  test('Extension should be present and activated', async () => {
    const ext = vscode.extensions.getExtension('SwissTool.json-formatter');
    assert.ok(ext, 'Extension should be present');
    assert.ok(ext.isActive, 'Extension should be activated');
  });

  test('Should register all commands', async () => {
    const commands = await vscode.commands.getCommands();
    const expectedCommands = [
      'jsonFormatter.beautify',
      'jsonFormatter.minify',
      'jsonFormatter.sort',
      'jsonFormatter.beautifySort'
    ];
    
    for (const cmd of expectedCommands) {
      assert.ok(commands.includes(cmd), `Command ${cmd} should be registered`);
    }
  });

  test('Should beautify minified JSON', async () => {
    const testFile = path.join(testWorkspaceRoot, 'test-beautify.json');
    const minifiedJson = '{"name":"test","version":"1.0.0","nested":{"key":"value","array":[1,2,3]}}';
    fs.writeFileSync(testFile, minifiedJson);

    const uri = vscode.Uri.file(testFile);
    await vscode.commands.executeCommand('jsonFormatter.beautify', uri);

    // Give it a moment to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    const result = fs.readFileSync(testFile, 'utf8');
    const parsed = JSON.parse(result);
    
    assert.strictEqual(parsed.name, 'test');
    assert.strictEqual(parsed.version, '1.0.0');
    assert.strictEqual(parsed.nested.key, 'value');
    assert.deepStrictEqual(parsed.nested.array, [1, 2, 3]);
    assert.ok(result.includes('\n'), 'Result should be formatted with newlines');
    assert.ok(result.includes('  ') || result.includes('\t'), 'Result should be indented');
  });

  test('Should minify beautified JSON', async () => {
    const testFile = path.join(testWorkspaceRoot, 'test-minify.json');
    const beautifiedJson = `{
  "name": "test",
  "version": "1.0.0",
  "nested": {
    "key": "value",
    "array": [1, 2, 3]
  }
}`;
    fs.writeFileSync(testFile, beautifiedJson);

    const uri = vscode.Uri.file(testFile);
    await vscode.commands.executeCommand('jsonFormatter.minify', uri);

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = fs.readFileSync(testFile, 'utf8');
    assert.ok(!result.includes('\n'), 'Minified JSON should not contain newlines');
    assert.ok(!result.includes('  '), 'Minified JSON should not contain spaces');
    assert.strictEqual(
      result,
      '{"name":"test","version":"1.0.0","nested":{"key":"value","array":[1,2,3]}}'
    );
  });

  test('Should sort JSON properties alphabetically', async () => {
    const testFile = path.join(testWorkspaceRoot, 'test-sort.json');
    const unsortedJson = `{
  "zebra": "z",
  "apple": "a",
  "banana": "b",
  "Cherry": "C"
}`;
    fs.writeFileSync(testFile, unsortedJson);

    const uri = vscode.Uri.file(testFile);
    await vscode.commands.executeCommand('jsonFormatter.sort', uri);

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = fs.readFileSync(testFile, 'utf8');
    const parsed = JSON.parse(result);
    const keys = Object.keys(parsed);
    
    // Default should be case-insensitive
    assert.deepStrictEqual(keys, ['apple', 'banana', 'Cherry', 'zebra']);
  });

  test('Should sort nested objects recursively', async () => {
    const testFile = path.join(testWorkspaceRoot, 'test-sort-nested.json');
    const unsortedJson = `{
  "zebra": "z",
  "apple": {
    "zoo": "z",
    "ant": "a",
    "bear": "b"
  },
  "banana": "b"
}`;
    fs.writeFileSync(testFile, unsortedJson);

    const uri = vscode.Uri.file(testFile);
    await vscode.commands.executeCommand('jsonFormatter.sort', uri);

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = fs.readFileSync(testFile, 'utf8');
    const parsed = JSON.parse(result);
    const keys = Object.keys(parsed);
    const nestedKeys = Object.keys(parsed.apple);
    
    assert.deepStrictEqual(keys, ['apple', 'banana', 'zebra']);
    assert.deepStrictEqual(nestedKeys, ['ant', 'bear', 'zoo']);
  });

  test('Should beautify and sort JSON simultaneously', async () => {
    const testFile = path.join(testWorkspaceRoot, 'test-beautify-sort.json');
    const unsortedMinified = '{"zebra":"z","apple":"a","nested":{"zoo":"z","ant":"a"},"banana":"b"}';
    fs.writeFileSync(testFile, unsortedMinified);

    const uri = vscode.Uri.file(testFile);
    await vscode.commands.executeCommand('jsonFormatter.beautifySort', uri);

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = fs.readFileSync(testFile, 'utf8');
    const parsed = JSON.parse(result);
    const keys = Object.keys(parsed);
    const nestedKeys = Object.keys(parsed.nested);
    
    assert.deepStrictEqual(keys, ['apple', 'banana', 'nested', 'zebra']);
    assert.deepStrictEqual(nestedKeys, ['ant', 'zoo']);
    assert.ok(result.includes('\n'), 'Result should be beautified');
    assert.ok(result.includes('  ') || result.includes('\t'), 'Result should be indented');
  });

  test('Should preserve arrays order when sorting', async () => {
    const testFile = path.join(testWorkspaceRoot, 'test-array-sort.json');
    const jsonWithArray = `{
  "zebra": [3, 1, 2],
  "apple": ["c", "a", "b"]
}`;
    fs.writeFileSync(testFile, jsonWithArray);

    const uri = vscode.Uri.file(testFile);
    await vscode.commands.executeCommand('jsonFormatter.sort', uri);

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = fs.readFileSync(testFile, 'utf8');
    const parsed = JSON.parse(result);
    
    assert.deepStrictEqual(parsed.apple, ["c", "a", "b"], 'Array order should be preserved');
    assert.deepStrictEqual(parsed.zebra, [3, 1, 2], 'Array order should be preserved');
  });

  test('Should handle JSONC (JSON with Comments)', async () => {
    const testFile = path.join(testWorkspaceRoot, 'test-comments.jsonc');
    const jsoncContent = `{
  // This is a comment
  "name": "test",
  /* Multi-line
     comment */
  "version": "1.0.0",
  "features": {
    "enabled": true // inline comment
  }
}`;
    fs.writeFileSync(testFile, jsoncContent);

    const uri = vscode.Uri.file(testFile);
    await vscode.commands.executeCommand('jsonFormatter.minify', uri);

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = fs.readFileSync(testFile, 'utf8');
    
    // Comments should be stripped in the output
    assert.ok(!result.includes('//'), 'Single-line comments should be removed');
    assert.ok(!result.includes('/*'), 'Block comments should be removed');
    
    const parsed = JSON.parse(result);
    assert.strictEqual(parsed.name, 'test');
    assert.strictEqual(parsed.features.enabled, true);
  });

  test('Should handle trailing commas in JSONC', async () => {
    const testFile = path.join(testWorkspaceRoot, 'test-trailing-comma.jsonc');
    const jsoncContent = `{
  "name": "test",
  "items": [
    "item1",
    "item2",
  ],
  "nested": {
    "key": "value",
  },
}`;
    fs.writeFileSync(testFile, jsoncContent);

    const uri = vscode.Uri.file(testFile);
    await vscode.commands.executeCommand('jsonFormatter.beautify', uri);

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = fs.readFileSync(testFile, 'utf8');
    const parsed = JSON.parse(result);
    
    assert.strictEqual(parsed.name, 'test');
    assert.deepStrictEqual(parsed.items, ['item1', 'item2']);
  });

  test('Should preserve line endings (CRLF)', async () => {
    const testFile = path.join(testWorkspaceRoot, 'test-crlf.json');
    const jsonWithCRLF = '{\r\n  "name": "test"\r\n}';
    fs.writeFileSync(testFile, jsonWithCRLF);

    const uri = vscode.Uri.file(testFile);
    await vscode.commands.executeCommand('jsonFormatter.beautify', uri);

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = fs.readFileSync(testFile, 'utf8');
    assert.ok(result.includes('\r\n'), 'CRLF line endings should be preserved');
  });

  test('Should preserve line endings (LF)', async () => {
    const testFile = path.join(testWorkspaceRoot, 'test-lf.json');
    const jsonWithLF = '{\n  "name": "test"\n}';
    fs.writeFileSync(testFile, jsonWithLF);

    const uri = vscode.Uri.file(testFile);
    await vscode.commands.executeCommand('jsonFormatter.beautify', uri);

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = fs.readFileSync(testFile, 'utf8');
    assert.ok(!result.includes('\r\n'), 'LF line endings should be preserved');
    assert.ok(result.includes('\n'), 'LF line endings should be present');
  });

  test('Should handle invalid JSON gracefully', async () => {
    const testFile = path.join(testWorkspaceRoot, 'test-invalid.json');
    const invalidJson = '{invalid json}';
    fs.writeFileSync(testFile, invalidJson);

    const uri = vscode.Uri.file(testFile);
    
    // Should not throw, but show error message
    await vscode.commands.executeCommand('jsonFormatter.beautify', uri);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Content should remain unchanged
    const result = fs.readFileSync(testFile, 'utf8');
    assert.strictEqual(result, invalidJson, 'Invalid JSON should remain unchanged');
  });

  test('Should handle empty objects', async () => {
    const testFile = path.join(testWorkspaceRoot, 'test-empty-object.json');
    fs.writeFileSync(testFile, '{}');

    const uri = vscode.Uri.file(testFile);
    await vscode.commands.executeCommand('jsonFormatter.beautify', uri);

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = fs.readFileSync(testFile, 'utf8');
    const parsed = JSON.parse(result);
    assert.deepStrictEqual(parsed, {});
  });

  test('Should handle empty arrays', async () => {
    const testFile = path.join(testWorkspaceRoot, 'test-empty-array.json');
    fs.writeFileSync(testFile, '[]');

    const uri = vscode.Uri.file(testFile);
    await vscode.commands.executeCommand('jsonFormatter.beautify', uri);

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = fs.readFileSync(testFile, 'utf8');
    const parsed = JSON.parse(result);
    assert.deepStrictEqual(parsed, []);
  });

  test('Should handle special characters in strings', async () => {
    const testFile = path.join(testWorkspaceRoot, 'test-special-chars.json');
    const jsonWithSpecialChars = '{"quote":"\\"Hello\\"","newline":"line1\\nline2","unicode":"\\u0048\\u0065\\u006C\\u006C\\u006F"}';
    fs.writeFileSync(testFile, jsonWithSpecialChars);

    const uri = vscode.Uri.file(testFile);
    await vscode.commands.executeCommand('jsonFormatter.beautify', uri);

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = fs.readFileSync(testFile, 'utf8');
    const parsed = JSON.parse(result);
    
    assert.strictEqual(parsed.quote, '"Hello"');
    assert.strictEqual(parsed.newline, 'line1\nline2');
    assert.strictEqual(parsed.unicode, 'Hello');
  });

  test('Should handle large JSON files', async () => {
    const testFile = path.join(testWorkspaceRoot, 'test-large.json');
    
    // Create a large JSON object
    const largeObj: any = {};
    for (let i = 0; i < 1000; i++) {
      largeObj[`key${i}`] = {
        id: i,
        value: `value${i}`,
        nested: {
          deepKey: `deep${i}`
        }
      };
    }
    
    fs.writeFileSync(testFile, JSON.stringify(largeObj));

    const uri = vscode.Uri.file(testFile);
    await vscode.commands.executeCommand('jsonFormatter.beautify', uri);

    await new Promise(resolve => setTimeout(resolve, 500));

    const result = fs.readFileSync(testFile, 'utf8');
    const parsed = JSON.parse(result);
    
    assert.strictEqual(Object.keys(parsed).length, 1000);
    assert.ok(result.includes('\n'), 'Large file should be beautified');
  });

  test('Should handle numbers correctly', async () => {
    const testFile = path.join(testWorkspaceRoot, 'test-numbers.json');
    const jsonWithNumbers = '{"int":42,"float":3.14159,"scientific":1.23e-10,"negative":-100,"zero":0}';
    fs.writeFileSync(testFile, jsonWithNumbers);

    const uri = vscode.Uri.file(testFile);
    await vscode.commands.executeCommand('jsonFormatter.beautify', uri);

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = fs.readFileSync(testFile, 'utf8');
    const parsed = JSON.parse(result);
    
    assert.strictEqual(parsed.int, 42);
    assert.strictEqual(parsed.float, 3.14159);
    assert.strictEqual(parsed.scientific, 1.23e-10);
    assert.strictEqual(parsed.negative, -100);
    assert.strictEqual(parsed.zero, 0);
  });

  test('Should handle boolean and null values', async () => {
    const testFile = path.join(testWorkspaceRoot, 'test-bool-null.json');
    const jsonWithBoolNull = '{"isTrue":true,"isFalse":false,"isNull":null}';
    fs.writeFileSync(testFile, jsonWithBoolNull);

    const uri = vscode.Uri.file(testFile);
    await vscode.commands.executeCommand('jsonFormatter.beautify', uri);

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = fs.readFileSync(testFile, 'utf8');
    const parsed = JSON.parse(result);
    
    assert.strictEqual(parsed.isTrue, true);
    assert.strictEqual(parsed.isFalse, false);
    assert.strictEqual(parsed.isNull, null);
  });

  test('Should detect and preserve 2-space indentation', async () => {
    const testFile = path.join(testWorkspaceRoot, 'test-2space.json');
    const json2Space = '{\n  "name": "test",\n  "nested": {\n    "key": "value"\n  }\n}';
    fs.writeFileSync(testFile, json2Space);

    const uri = vscode.Uri.file(testFile);
    await vscode.commands.executeCommand('jsonFormatter.sort', uri);

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = fs.readFileSync(testFile, 'utf8');
    
    // Check that 2-space indentation is preserved
    const lines = result.split('\n');
    const indentedLine = lines.find(line => line.startsWith('  "'));
    assert.ok(indentedLine, 'Should have 2-space indentation');
    assert.ok(!indentedLine?.startsWith('    '), 'Should not have 4-space indentation');
  });

  test('Should detect and preserve tab indentation', async () => {
    const testFile = path.join(testWorkspaceRoot, 'test-tabs.json');
    const jsonTabs = '{\n\t"name": "test",\n\t"nested": {\n\t\t"key": "value"\n\t}\n}';
    fs.writeFileSync(testFile, jsonTabs);

    const uri = vscode.Uri.file(testFile);
    await vscode.commands.executeCommand('jsonFormatter.sort', uri);

    await new Promise(resolve => setTimeout(resolve, 100));

    const result = fs.readFileSync(testFile, 'utf8');
    
    // Check that tab indentation is preserved
    assert.ok(result.includes('\t'), 'Should preserve tab indentation');
    assert.ok(!result.includes('    '), 'Should not convert tabs to spaces');
  });

  test('Should reject non-JSON files', async () => {
    const testFile = path.join(testWorkspaceRoot, 'test.txt');
    fs.writeFileSync(testFile, 'This is not JSON');

    const uri = vscode.Uri.file(testFile);
    
    // Should show warning and not modify file
    await vscode.commands.executeCommand('jsonFormatter.beautify', uri);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const result = fs.readFileSync(testFile, 'utf8');
    assert.strictEqual(result, 'This is not JSON', 'Non-JSON file should not be modified');
  });

  // Test for working with open documents in editor
  test('Should format JSON in active editor', async function() {
    this.timeout(5000);
    
    const testFile = path.join(testWorkspaceRoot, 'test-editor.json');
    const minifiedJson = '{"name":"test","value":42}';
    fs.writeFileSync(testFile, minifiedJson);

    // Open the file in editor
    const doc = await vscode.workspace.openTextDocument(testFile);
    const editor = await vscode.window.showTextDocument(doc);

    // Execute beautify without passing URI (should use active editor)
    await vscode.commands.executeCommand('jsonFormatter.beautify');

    await new Promise(resolve => setTimeout(resolve, 500));

    const result = editor.document.getText();
    assert.ok(result.includes('\n'), 'JSON in editor should be beautified');
    
    const parsed = JSON.parse(result);
    assert.strictEqual(parsed.name, 'test');
    assert.strictEqual(parsed.value, 42);
  });

  // Test for selection formatting
  test('Should format only selected JSON', async function() {
    this.timeout(5000);
    
    const testFile = path.join(testWorkspaceRoot, 'test-selection.json');
    const json = '{\n  "keep": "unchanged",\n  "format": {"nested":"value"},\n  "also": "unchanged"\n}';
    fs.writeFileSync(testFile, json);

    const doc = await vscode.workspace.openTextDocument(testFile);
    const editor = await vscode.window.showTextDocument(doc);

    // Select only the "format" property value
    const startPos = new vscode.Position(2, 12); // After "format": 
    const endPos = new vscode.Position(2, 29);   // Before the comma
    editor.selection = new vscode.Selection(startPos, endPos);

    await vscode.commands.executeCommand('jsonFormatter.beautify');

    await new Promise(resolve => setTimeout(resolve, 500));

    const result = editor.document.getText();
    
    // The selected part should be beautified while rest remains unchanged
    assert.ok(result.includes('"keep": "unchanged"'), 'Unselected parts should remain unchanged');
    assert.ok(result.includes('"also": "unchanged"'), 'Unselected parts should remain unchanged');
    
    const parsed = JSON.parse(result);
    assert.strictEqual(parsed.format.nested, 'value');
  });
});
