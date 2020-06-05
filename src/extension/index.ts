import vscode from 'vscode';
import { openNoteHandler } from '../commands/open-note';
import { NoteProvider } from '../note/note-provider';
import { deleteNoteHandler } from '../commands/delete-note';
import { updateActiveNoteHandler } from './workspace-state';
import { newChildNoteHandler } from '../commands/new-child-note';
import { newSiblingNoteHandler } from '../commands/new-sibling-note';
import { WorkspaceStateKey } from '../types';

// TODO: https://github.com/mushanshitiancai/vscode-paste-image

export async function activate(context: vscode.ExtensionContext) {
  // Register side bar data provider.
  const noteProvider = await NoteProvider.create();
  vscode.window.registerTreeDataProvider('treeView', noteProvider);

  // Set rootNote in workspace state.
  context.workspaceState.update(WorkspaceStateKey.RootNote, noteProvider.rootNote);

  // Register commands.
  context.subscriptions.push(
    // TODO: get these to be able to be run from the command palette
    vscode.commands.registerCommand('vscode-tree.openNote', openNoteHandler(context)),
    vscode.commands.registerCommand('vscode-tree.newChildNote', newChildNoteHandler(context)),
    vscode.commands.registerCommand('vscode-tree.newSiblingNote', newSiblingNoteHandler(context)),
    vscode.commands.registerCommand('vscode-tree.deleteNote', deleteNoteHandler(context)),
    vscode.commands.registerCommand('treeView.refresh', () => noteProvider.refresh()),
  );

  // Ensure `activeNote` stays updated.
  const changeActiveTextEditorHandler = updateActiveNoteHandler(context);
  vscode.window.onDidChangeActiveTextEditor(changeActiveTextEditorHandler);
  changeActiveTextEditorHandler(vscode.window.activeTextEditor);
}

export function deactivate() {}
