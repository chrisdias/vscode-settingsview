import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const provider = new SettingsViewProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('popularSettings.settingsView', provider),
        vscode.commands.registerCommand('popularSettings.show', () => {
            vscode.commands.executeCommand('workbench.view.explorer');
            vscode.commands.executeCommand('popularSettings.settingsView.focus');
        })
    );
}

class SettingsViewProvider implements vscode.WebviewViewProvider {
    private readonly defaultThemes = [
        'Default Dark+',
        'Default Light+',
        'Default High Contrast',
        'Default High Contrast Light',
        'Visual Studio Dark',
        'Visual Studio Light',
        'Abyss',
        'Kimbie Dark',
        'Monokai',
        'Monokai Dimmed',
        'Quiet Light',
        'Red',
        'Solarized Dark',
        'Solarized Light'
    ];

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'updateSetting':
                    if (data.setting === 'workbench.colorTheme') {
                        await this._handleThemeChange(data.value);
                    } else {
                        await vscode.workspace.getConfiguration().update(
                            data.setting,
                            data.value,
                            vscode.ConfigurationTarget.Global
                        );
                    }
                    break;
                case 'openSettings':
                    vscode.commands.executeCommand('workbench.action.openSettingsJson');
                    break;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const settingGroups = [
            {
                title: 'Editor Appearance',
                settings: [
                    { id: 'workbench.colorTheme', type: 'theme', title: 'Color Theme', description: 'Specifies the color theme used in the workbench' },
                    { id: 'editor.renderWhitespace', type: 'string', title: 'Show Whitespace', description: 'Controls how whitespace characters are rendered' },
                    { id: 'editor.fontSize', type: 'number', title: 'Font Size', description: 'Controls the font size in pixels' },
                    { id: 'editor.fontFamily', type: 'font', title: 'Font Family', description: 'Select the font family for the editor' },
                    { id: 'editor.fontLigatures', type: 'boolean', title: 'Font Ligatures', description: 'Enables/disables font ligatures' },
                    { id: 'editor.minimap.enabled', type: 'boolean', title: 'Minimap', description: 'Shows a miniature view of the file on the right side' },
                    { id: 'editor.bracketPairColorization.enabled', type: 'boolean', title: 'Bracket Pair Colors', description: 'Enables bracket pair colorization' },
                    { id: 'editor.guides.bracketPairs', type: 'string', title: 'Bracket Guides', description: 'Controls bracket pair guides', options: ['none', 'active', 'true'] },
                    { id: 'editor.guides.indentation', type: 'boolean', title: 'Indent Guides', description: 'Highlights indentation levels' },
                    { id: 'editor.cursorBlinking', type: 'string', title: 'Cursor Blinking', description: 'Controls cursor animation style', options: ['blink', 'smooth', 'phase', 'expand', 'solid'] },
                    { id: 'editor.cursorWidth', type: 'number', title: 'Cursor Width', description: 'Controls the width of the cursor' },
                    { id: 'editor.lineHeight', type: 'number', title: 'Line Height', description: 'Controls line height in pixels' },
                    { id: 'workbench.tree.indent', type: 'number', title: 'Tree Indent', description: 'Controls tree indentation in pixels' }
                ]
            },
            {
                title: 'Editor Behavior',
                settings: [
                    { id: 'editor.formatOnSave', type: 'boolean', title: 'Format on Save', description: 'Automatically format the file when saving' },
                    { id: 'editor.formatOnPaste', type: 'boolean', title: 'Format on Paste', description: 'Automatically format pasted content' },
                    { id: 'editor.formatOnType', type: 'boolean', title: 'Format on Type', description: 'Automatically format while typing' },
                    { id: 'editor.tabSize', type: 'number', title: 'Tab Size', description: 'Number of spaces a tab is equal to' },
                    { id: 'editor.insertSpaces', type: 'boolean', title: 'Insert Spaces', description: 'Insert spaces when pressing Tab' },
                    { id: 'editor.detectIndentation', type: 'boolean', title: 'Detect Indentation', description: 'Controls whether indentation is detected automatically' },
                    { id: 'editor.wordWrap', type: 'string', title: 'Word Wrap', description: 'Controls how lines should wrap' },
                    { id: 'editor.cursorStyle', type: 'string', title: 'Cursor Style', description: 'Controls the cursor animation style' },
                    { id: 'editor.multiCursorModifier', type: 'string', title: 'Multi Cursor Modifier', description: 'Modifier key for adding multiple cursors', options: ['ctrlCmd', 'alt'] },
                    { id: 'editor.acceptSuggestionOnEnter', type: 'string', title: 'Accept Suggestion on Enter', description: 'Controls whether suggestions are accepted on Enter', options: ['on', 'smart', 'off'] },
                    { id: 'editor.suggestSelection', type: 'string', title: 'Suggest Selection', description: 'Controls how suggestions are pre-selected', options: ['first', 'recentlyUsed', 'recentlyUsedByPrefix'] },
                    { id: 'editor.quickSuggestionsDelay', type: 'number', title: 'Suggestion Delay', description: 'Controls the delay in ms after which quick suggestions will show' },
                    { id: 'editor.dragAndDrop', type: 'boolean', title: 'Drag and Drop', description: 'Controls whether drag and drop of files is enabled' }
                ]
            },
            {
                title: 'Workbench',
                settings: [
                    { id: 'workbench.sideBar.location', type: 'string', title: 'Sidebar Location', description: 'Controls the location of the sidebar' },
                    { id: 'workbench.editor.enablePreview', type: 'boolean', title: 'Enable Preview Editors', description: 'Controls whether opened editors show as preview' },
                    { id: 'workbench.editor.enablePreviewFromQuickOpen', type: 'boolean', title: 'Quick Open Preview', description: 'Controls whether Quick Open editors show as preview' },
                    { id: 'workbench.editor.closeEmptyGroups', type: 'boolean', title: 'Close Empty Groups', description: 'Controls whether empty editor groups should close automatically' },
                    { id: 'workbench.startupEditor', type: 'string', title: 'Startup Editor', description: 'Controls which editor is shown at startup', options: ['none', 'welcomePage', 'readme', 'newUntitledFile', 'welcomePageInEmptyWorkbench'] },
                    { id: 'workbench.commandPalette.history', type: 'number', title: 'Command History', description: 'Controls number of recently used commands to keep in history' }
                ]
            },
            {
                title: 'Files',
                settings: [
                    { id: 'files.autoSave', type: 'string', title: 'Auto Save', description: 'Controls auto save of editors', options: ['off', 'afterDelay', 'onFocusChange', 'onWindowChange'] },
                    { id: 'files.autoSaveDelay', type: 'number', title: 'Auto Save Delay', description: 'Controls the delay in ms after which a file is auto saved' },
                    { id: 'files.eol', type: 'string', title: 'End of Line', description: 'The default end of line character', options: ['\n', '\r\n', 'auto'] },
                    { id: 'files.trimTrailingWhitespace', type: 'boolean', title: 'Trim Trailing Whitespace', description: 'Removes trailing whitespace when saving a file' },
                    { id: 'files.insertFinalNewline', type: 'boolean', title: 'Insert Final Newline', description: 'Inserts a final newline when saving a file' },
                    { id: 'files.trimFinalNewlines', type: 'boolean', title: 'Trim Final Newlines', description: 'Removes multiple final newlines when saving a file' }
                ]
            },
            {
                title: 'Terminal',
                settings: [
                    { id: 'terminal.integrated.fontSize', type: 'number', title: 'Font Size', description: 'Controls the font size in pixels of the terminal' },
                    { id: 'terminal.integrated.lineHeight', type: 'number', title: 'Line Height', description: 'Controls the line height of the terminal' },
                    { id: 'terminal.integrated.cursorBlinking', type: 'boolean', title: 'Cursor Blinking', description: 'Controls whether the terminal cursor blinks' },
                    { id: 'terminal.integrated.cursorStyle', type: 'string', title: 'Cursor Style', description: 'Controls the style of terminal cursor', options: ['block', 'line', 'underline'] },
                    { id: 'terminal.integrated.scrollback', type: 'number', title: 'Scrollback', description: 'Controls the maximum number of lines the terminal keeps in its buffer' }
                ]
            },
            {
                title: 'Extensions',
                settings: [
                    { id: 'extensions.autoUpdate', type: 'boolean', title: 'Auto Update Extensions', description: 'Automatically update extensions' },
                    { id: 'extensions.autoCheckUpdates', type: 'boolean', title: 'Auto Check Updates', description: 'Automatically check for extension updates' },
                    { id: 'extensions.ignoreRecommendations', type: 'boolean', title: 'Ignore Recommendations', description: 'Controls whether to ignore extension recommendations' }
                ]
            }
        ];

        const currentSettings = settingGroups.map(group => ({
            ...group,
            settings: group.settings.map(setting => ({
                ...setting,
                value: vscode.workspace.getConfiguration().get(setting.id)
            }))
        }));

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        padding: 8px;
                        color: var(--vscode-foreground);
                        background: var(--vscode-editor-background);
                    }
                    .setting-item {
                        margin-bottom: 12px;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        gap: 8px;
                    }
                    .setting-left {
                        flex: 1;
                    }
                    .setting-title {
                        margin-bottom: 2px;
                    }
                    .setting-description {
                        font-size: 0.85em;
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 2px;
                        line-height: 1.2;
                    }
                    .setting-control-container {
                        flex: 0 0 120px; /* Fixed width, no growing or shrinking */
                        min-width: 120px;
                        display: flex;
                        justify-content: flex-end;
                    }
                    select, input[type="number"] {
                        width: 120px;
                        padding: 4px;
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                    }
                    .toggle {
                        position: relative;
                        display: inline-block;
                        width: 40px;
                        height: 20px;
                        margin-left: auto;
                    }
                    .toggle input {
                        opacity: 0;
                        width: 0;
                        height: 0;
                    }
                    .slider {
                        position: absolute;
                        cursor: pointer;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: var(--vscode-input-background);
                        transition: .4s;
                        border-radius: 20px;
                    }
                    .slider:before {
                        position: absolute;
                        content: "";
                        height: 16px;
                        width: 16px;
                        left: 2px;
                        bottom: 2px;
                        background-color: var(--vscode-button-background);
                        transition: .4s;
                        border-radius: 50%;
                    }
                    input:checked + .slider:before {
                        transform: translateX(20px);
                    }
                    .settings-group {
                        margin-bottom: 12px;
                        border: 1px solid var(--vscode-widget-border);
                        border-radius: 4px;
                    }
                    
                    .group-header {
                        padding: 6px 8px;
                        background: var(--vscode-sideBar-background);
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        user-select: none;
                        gap: 4px;
                    }
                    
                    .group-header:hover {
                        background: var(--vscode-list-hoverBackground);
                    }
                    
                    .group-title {
                        font-weight: bold;
                        flex: 1;
                    }
                    
                    .chevron {
                        width: 16px;
                        height: 16px;
                        transition: transform 0.2s;
                        color: var(--vscode-foreground);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .chevron.collapsed {
                        transform: rotate(-90deg);
                    }
                    
                    .group-content {
                        padding: 8px;
                        border-top: 1px solid var(--vscode-widget-border);
                    }
                    
                    .group-content.collapsed {
                        display: none;
                    }
                    
                    .settings-link {
                        display: block;
                        padding: 8px;
                        color: var(--vscode-textLink-foreground);
                        text-decoration: none;
                        text-align: center;
                        cursor: pointer;
                    }
                    
                    .settings-link:hover {
                        color: var(--vscode-textLink-activeForeground);
                        text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <div id="settings-container">
                    ${currentSettings.map((group, index) => `
                        <div class="settings-group">
                            <div class="group-header" data-group="${index}">
                                <div class="chevron">▼</div>
                                <div class="group-title">${group.title}</div>
                            </div>
                            <div class="group-content">
                                ${group.settings.map(setting => `
                                    <div class="setting-item">
                                        <div class="setting-left">
                                            <div class="setting-title">${setting.title}:</div>
                                            <div class="setting-description">${setting.description}</div>
                                        </div>
                                        <div class="setting-control-container">
                                            ${this._getControlHtml(setting)}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                    <div class="settings-link" id="open-settings">Open settings.json</div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    // Setting controls event listener
                    document.querySelectorAll('.setting-control').forEach(control => {
                        control.addEventListener('change', (e) => {
                            let value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                            if (e.target.type === 'number') {
                                value = Number(value);
                            }
                            vscode.postMessage({
                                type: 'updateSetting',
                                setting: e.target.dataset.setting,
                                value: value
                            });
                        });
                    });

                    // Group headers event listener
                    document.querySelectorAll('.group-header').forEach(header => {
                        header.addEventListener('click', (e) => {
                            const content = header.nextElementSibling;
                            const chevron = header.querySelector('.chevron');
                            
                            content.classList.toggle('collapsed');
                            chevron.classList.toggle('collapsed');
                        });
                    });

                    document.getElementById('open-settings').addEventListener('click', () => {
                        vscode.postMessage({
                            type: 'openSettings'
                        });
                    });
                </script>
            </body>
            </html>
        `;
    }

    private _getControlHtml(setting: any): string {
        switch (setting.type) {
            case 'boolean':
                return `
                    <label class="toggle">
                        <input type="checkbox" class="setting-control" data-setting="${setting.id}" ${setting.value ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                `;
            case 'number':
                return `
                    <input type="number" class="setting-control" data-setting="${setting.id}" value="${setting.value}">
                `;
            case 'theme':
                return `
                    <select class="setting-control" data-setting="${setting.id}">
                        ${this._getThemeOptions(setting.value)}
                    </select>
                `;
            case 'font':
                return `
                    <select class="setting-control" data-setting="${setting.id}">
                        ${this._getFontOptions(setting.value)}
                    </select>
                `;
            case 'string':
                return `
                    <select class="setting-control" data-setting="${setting.id}">
                        ${this._getOptionsForSetting(setting.id, setting.value)}
                    </select>
                `;
            default:
                return '';
        }
    }

    private _getThemeOptions(currentTheme: string): string {
        // Get installed themes from extensions
        const extensionThemes = vscode.extensions.all
            .filter(ext => ext.packageJSON?.contributes?.themes)
            .flatMap(ext => ext.packageJSON.contributes.themes)
            .map(theme => theme.label || theme.id);

        // Combine default themes with extension themes, removing duplicates
        const allThemes = [...new Set([...this.defaultThemes, ...extensionThemes])];

        // Sort themes alphabetically
        allThemes.sort((a, b) => a.localeCompare(b));

        // Create HTML options, marking the current theme as selected
        return allThemes
            .map(theme => `<option value="${theme}" ${theme === currentTheme ? 'selected' : ''}>${theme}</option>`)
            .join('');
    }

    private async _handleThemeChange(theme: string) {
        await vscode.workspace.getConfiguration().update(
            'workbench.colorTheme',
            theme,
            vscode.ConfigurationTarget.Global
        );
    }

    private _getOptionsForSetting(settingId: string, currentValue: string): string {
        const options: Record<string, string[]> = {
            'editor.wordWrap': ['off', 'on', 'wordWrapColumn', 'bounded'],
            'workbench.sideBar.location': ['left', 'right'],
            'editor.renderWhitespace': ['none', 'boundary', 'selection', 'trailing', 'all'],
            'editor.cursorStyle': ['line', 'block', 'underline'],
            'editor.lineNumbers': ['off', 'on', 'relative'],
            'editor.cursorBlinking': ['blink', 'smooth', 'phase', 'expand', 'solid'],
            'editor.guides.bracketPairs': ['none', 'active', 'true'],
            'editor.multiCursorModifier': ['ctrlCmd', 'alt'],
            'editor.acceptSuggestionOnEnter': ['on', 'smart', 'off'],
            'editor.suggestSelection': ['first', 'recentlyUsed', 'recentlyUsedByPrefix'],
            'workbench.startupEditor': ['none', 'welcomePage', 'readme', 'newUntitledFile', 'welcomePageInEmptyWorkbench'],
            'files.autoSave': ['off', 'afterDelay', 'onFocusChange', 'onWindowChange'],
            'files.eol': ['\n', '\r\n', 'auto'],
            'terminal.integrated.cursorStyle': ['block', 'line', 'underline']
        };

        return (options[settingId] || [])
            .map(option => `<option value="${option}" ${option === currentValue ? 'selected' : ''}>${option}</option>`)
            .join('');
    }

    private _getFontOptions(currentFont: string): string {
        const fonts = [
            'Fira Code',
            'Cascadia Code',
            'JetBrains Mono',
            'Source Code Pro',
            'Monaco',
            'Menlo',
            'Consolas',
            'Courier New',
            'monospace'
        ];

        // Clean up the current font value to match one of our options
        const cleanCurrentFont = currentFont?.split(',')[0]?.trim().replace(/['"]/g, '') || 'monospace';

        return fonts
            .map(font => `<option value="${font}" ${cleanCurrentFont === font ? 'selected' : ''}>${font}</option>`)
            .join('');
    }
}

export function deactivate() {}
