import vscode from 'vscode';
import { openNoteHandler } from '../commands/open-note';
import { NoteProvider } from '../note/note-provider';
import { deleteNoteHandler } from '../commands/delete-note';
import { updateActiveNoteHandler } from './workspace-state';
import { newChildNoteHandler } from '../commands/new-child-note';
import { newSiblingNoteHandler } from '../commands/new-sibling-note';
import * as constants from '../types';
import { moveHandler } from '../commands/move-note';
import { renameNoteHandler } from '../commands/rename-note';
import { duplicateNoteHandler } from '../commands/duplicate-note';

// TODO: https://github.com/mushanshitiancai/vscode-paste-image

export async function activate(context: vscode.ExtensionContext) {
  // Register side bar data provider.
  const noteProvider = await NoteProvider.create(context);
  const noteTreeView = vscode.window.createTreeView(constants.TREEVIEW_ID, {
    treeDataProvider: noteProvider,
  });

  const ctx: constants.CommandContext = {
    context,
    rootNote: noteProvider.rootNote,
    noteTreeView,
  };

  // Register commands.
  context.subscriptions.push(
    vscode.commands.registerCommand(constants.COMMAND_TREEVIEW_REFRESH, () => noteProvider.refresh()),

    vscode.commands.registerCommand(constants.COMMAND_OPEN_NOTE, openNoteHandler(ctx)),
    vscode.commands.registerCommand(constants.COMMAND_NEW_CHILD_NOTE, newChildNoteHandler(ctx)),
    vscode.commands.registerCommand(constants.COMMAND_NEW_SIBLING_NOTE, newSiblingNoteHandler(ctx)),
    vscode.commands.registerCommand(constants.COMMAND_DELETE_NOTE, deleteNoteHandler(ctx)),
    vscode.commands.registerCommand(constants.COMMAND_RENAME_NOTE, renameNoteHandler(ctx)),
    vscode.commands.registerCommand(constants.COMMAND_DUPLICATE_NOTE, duplicateNoteHandler(ctx)),

    vscode.commands.registerCommand(constants.COMMAND_MOVE_UP, moveHandler(ctx, { delta: -1 })),
    vscode.commands.registerCommand(constants.COMMAND_MOVE_DOWN, moveHandler(ctx, { delta: 1 })),
    vscode.commands.registerCommand(constants.COMMAND_MOVE_TOP_PARENT, moveHandler(ctx, { position: 'top' })),
    vscode.commands.registerCommand(constants.COMMAND_MOVE_BOTTOM_PARENT, moveHandler(ctx, { position: 'bottom' })),
    vscode.commands.registerCommand(constants.COMMAND_MOVE_OUT, moveHandler(ctx, { position: 'out' })),
    vscode.commands.registerCommand(constants.COMMAND_MOVE_IN, moveHandler(ctx, { position: 'in' })),

    // TODO: show errors to user (wrap handlers? also de-dupe getActiveNote calls)
  );

  // Ensure `activeNote` stays updated.
  const changeActiveTextEditorHandler = updateActiveNoteHandler(ctx);
  vscode.window.onDidChangeActiveTextEditor(changeActiveTextEditorHandler);
  changeActiveTextEditorHandler(vscode.window.activeTextEditor);
}

export function deactivate() {}
