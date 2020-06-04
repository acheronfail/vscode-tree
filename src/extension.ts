import vscode from 'vscode';
import { openNote } from './commands/open-note';
import { newChildNote, newSiblingNote } from './commands/new-note';
import { NotesProvider } from './note/note-provider';

// TODO: https://github.com/mushanshitiancai/vscode-paste-image

export async function activate(context: vscode.ExtensionContext) {
  // Register side bar data provider.
  const notes2Provider = await NotesProvider.create();
  vscode.window.registerTreeDataProvider('treeView', notes2Provider);

  // Register commands.
  context.subscriptions.push(
    vscode.commands.registerCommand('vscode-tree.openNote', openNote),
    vscode.commands.registerCommand('vscode-tree.newChildNote', newChildNote),
    vscode.commands.registerCommand('vscode-tree.newSiblingNote', newSiblingNote),
    vscode.commands.registerCommand('treeView.refreshEntry', () => notes2Provider.refresh()),
  );
}

export function deactivate() {}
