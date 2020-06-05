import vscode from 'vscode';
import { openNoteHandler } from '../commands/open-note';
import { NoteProvider } from '../note/note-provider';
import { deleteNoteHandler } from '../commands/delete-note';
import { updateActiveNoteHandler } from './workspace-state';
import { newChildNoteHandler } from '../commands/new-child-note';
import { newSiblingNoteHandler } from '../commands/new-sibling-note';
import * as constants from '../types';
import { moveHandler } from '../commands/move-note';

// TODO: https://github.com/mushanshitiancai/vscode-paste-image

export async function activate(context: vscode.ExtensionContext) {
  // Register side bar data provider.
  const noteProvider = await NoteProvider.create(context);
  vscode.window.registerTreeDataProvider(constants.TREEVIEW_ID, noteProvider);

  // Register commands.
  context.subscriptions.push(
    vscode.commands.registerCommand(constants.COMMAND_TREEVIEW_REFRESH, () => noteProvider.refresh()),

    vscode.commands.registerCommand(constants.COMMAND_OPEN_NOTE, openNoteHandler(context)),
    vscode.commands.registerCommand(constants.COMMAND_NEW_CHILD_NOTE, newChildNoteHandler(context)),
    vscode.commands.registerCommand(constants.COMMAND_NEW_SIBLING_NOTE, newSiblingNoteHandler(context)),
    vscode.commands.registerCommand(constants.COMMAND_DELETE_NOTE, deleteNoteHandler(context)),

    vscode.commands.registerCommand(constants.COMMAND_MOVE_UP, moveHandler(context, { delta: -1 })),
    vscode.commands.registerCommand(constants.COMMAND_MOVE_DOWN, moveHandler(context, { delta: 1 })),
    vscode.commands.registerCommand(constants.COMMAND_MOVE_TOP_PARENT, moveHandler(context, { position: 'top' })),
    vscode.commands.registerCommand(constants.COMMAND_MOVE_BOTTOM_PARENT, moveHandler(context, { position: 'bottom' })),
    // TODO: remove from parent, add as sibling to parent
    vscode.commands.registerCommand(constants.COMMAND_MOVE_OUT, () => console.log('TODO: unimplemented')),
    // TODO: prompt for name and remove from parent, add child and add as child
    vscode.commands.registerCommand(constants.COMMAND_MOVE_IN, () => console.log('TODO: unimplemented')),
  );

  // Ensure `activeNote` stays updated.
  const changeActiveTextEditorHandler = updateActiveNoteHandler(context, noteProvider.rootNote);
  vscode.window.onDidChangeActiveTextEditor(changeActiveTextEditorHandler);
  changeActiveTextEditorHandler(vscode.window.activeTextEditor);
}

export function deactivate() {}
