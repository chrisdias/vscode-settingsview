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
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const commonSettings = [
            { id: 'editor.minimap.enabled', type: 'boolean', title: 'Minimap' },
            { id: 'editor.fontSize', type: 'number', title: 'Font Size' },
            { id: 'workbench.colorTheme', type: 'theme', title: 'Color Theme' },
            { id: 'editor.formatOnSave', type: 'boolean', title: 'Format on Save' },
            { id: 'editor.tabSize', type: 'number', title: 'Tab Size' },
            { id: 'editor.wordWrap', type: 'string', title: 'Word Wrap' },
            { id: 'workbench.sideBar.location', type: 'string', title: 'Sidebar Location' },
            { id: 'editor.renderWhitespace', type: 'string', title: 'Show Whitespace' },
            { id: 'editor.cursorStyle', type: 'string', title: 'Cursor Style' },
            { id: 'editor.lineNumbers', type: 'string', title: 'Line Numbers' }
        ];

        const currentSettings = commonSettings.map(setting => ({
            ...setting,
            value: vscode.workspace.getConfiguration().get(setting.id)
        }));

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        padding: 10px;
                        color: var(--vscode-foreground);
                        background: var(--vscode-editor-background);
                    }
                    .setting-item {
                        margin-bottom: 15px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 10px;
                    }
                    .setting-title {
                        flex: 1;
                        font-weight: bold;
                    }
                    .setting-control-container {
                        flex: 1;
                        min-width: 100px;
                    }
                    select, input[type="number"] {
                        width: 100%;
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
                </style>
            </head>
            <body>
                <div id="settings-container">
                    ${currentSettings.map(setting => `
                        <div class="setting-item">
                            <div class="setting-title">${setting.title}:</div>
                            <div class="setting-control-container">
                                ${this._getControlHtml(setting)}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
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
            'editor.lineNumbers': ['off', 'on', 'relative']
        };

        return (options[settingId] || [])
            .map(option => `<option value="${option}" ${option === currentValue ? 'selected' : ''}>${option}</option>`)
            .join('');
    }
}

export function deactivate() {}
