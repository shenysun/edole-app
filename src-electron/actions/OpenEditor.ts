// const execa = require('execa');

import envEditor from 'env-editor';
import lineColumnPath from 'line-column-path';
import open from 'open';
import shelljs from 'shelljs';

const make = (files: Array<any>, options: { editor?: string } = {}) => {
    if (!Array.isArray(files)) {
        throw new TypeError(`Expected an \`Array\`, got ${typeof files}`);
    }

    const editor = options.editor ? envEditor.getEditor(options.editor) : envEditor.defaultEditor();
    const editorArguments = [];

    if (editor.id === 'vscode') {
        editorArguments.push('--goto');
    }

    for (const file of files) {
        const parsed = lineColumnPath.parse(file);

        if (['sublime', 'atom', 'vscode'].includes(editor.id)) {
            editorArguments.push(lineColumnPath.stringify(parsed));
            continue;
        }

        if (['webstorm', 'intellij'].includes(editor.id)) {
            editorArguments.push(lineColumnPath.stringify(parsed, { column: false }));
            continue;
        }

        if (editor.id === 'textmate') {
            editorArguments.push(
                '--line',
                lineColumnPath.stringify(parsed, {
                    file: false,
                }),
                parsed.file
            );
            continue;
        }

        if (['vim', 'neovim'].includes(editor.id)) {
            editorArguments.push(`+call cursor(${parsed.line}, ${parsed.column})`, parsed.file);
            continue;
        }

        editorArguments.push(parsed.file);
    }

    return {
        binary: editor.binary,
        arguments: editorArguments,
        isTerminalEditor: editor.isTerminalEditor,
    };
};

export default (files: Array<any>, options: { editor?: string }) => {
    const result = make(files, options);
    // const stdio = result.isTerminalEditor ? 'inherit' : 'ignore';
    const subprocess = shelljs.exec(`${result.binary} ${result.arguments.join(' ')}`, { async: true });

    // Fallback
    subprocess.on('error', () => {
        const result = make(files, {
            ...options,
            editor: '',
        });

        for (const file of result.arguments) {
            open(file);
        }
    });

    if (result.isTerminalEditor) {
        subprocess.on('exit', process.exit);
    } else {
        subprocess.unref();
    }
};
