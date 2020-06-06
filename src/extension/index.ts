import vscode, { commands } from 'vscode';
import { NoteProvider } from '../note/note-provider';
import { updateActiveNoteHandler } from './workspace-state';
import * as C from '../constants';
import { createHandler } from '../util';
import { newNote, renameNote, moveNote } from '../commands';
import { CommandContext, NewNoteType } from '../types';

// TODO: https://github.com/mushanshitiancai/vscode-paste-image

export async function activate(context: vscode.ExtensionContext) {
  // Register side bar data provider.
  const noteProvider = await NoteProvider.create(context);
  const noteTreeView = vscode.window.createTreeView(C.ID_TREEVIEW, {
    treeDataProvider: noteProvider,
  });

  const ctx: CommandContext = {
    context,
    rootNote: noteProvider.rootNote,
    noteTreeView,
  };

  // Register commands.
  context.subscriptions.push(
    commands.registerCommand(C.CMD_TREEVIEW_REFRESH, () => noteProvider.refresh()),

    commands.registerCommand(
      C.CMD_OPEN_NOTE,
      createHandler(ctx, (c, n) => n.edit(c)),
    ),
    commands.registerCommand(
      C.CMD_NEW_CHILD_NOTE,
      createHandler(ctx, (c, n) => newNote(c, NewNoteType.Child, n)),
    ),
    commands.registerCommand(
      C.CMD_NEW_SIBLING_NOTE,
      createHandler(ctx, (c, n) => newNote(c, NewNoteType.Sibling, n)),
    ),
    commands.registerCommand(
      C.CMD_DELETE_NOTE,
      createHandler(ctx, (_, n) => n.delete()),
    ),
    commands.registerCommand(
      C.CMD_RENAME_NOTE,
      createHandler(ctx, (_, n) => renameNote(n)),
    ),
    commands.registerCommand(
      C.CMD_DUPLICATE_NOTE,
      createHandler(ctx, (c, n) => n.duplicate(c)),
    ),

    commands.registerCommand(
      C.CMD_MOVE_UP,
      createHandler(ctx, (c, n) => moveNote(c, n, { delta: -1 })),
    ),
    commands.registerCommand(
      C.CMD_MOVE_DOWN,
      createHandler(ctx, (c, n) => moveNote(c, n, { delta: 1 })),
    ),
    commands.registerCommand(
      C.CMD_MOVE_TOP_PARENT,
      createHandler(ctx, (c, n) => moveNote(c, n, { position: 'top' })),
    ),
    commands.registerCommand(
      C.CMD_MOVE_BOTTOM_PARENT,
      createHandler(ctx, (c, n) => moveNote(c, n, { position: 'bottom' })),
    ),
    commands.registerCommand(
      C.CMD_MOVE_OUT,
      createHandler(ctx, (c, n) => moveNote(c, n, { position: 'out' })),
    ),
    commands.registerCommand(
      C.CMD_MOVE_IN,
      createHandler(ctx, (c, n) => moveNote(c, n, { position: 'in' })),
    ),
  );

  // Ensure `activeNote` stays updated.
  const changeActiveTextEditorHandler = updateActiveNoteHandler(ctx);
  vscode.window.onDidChangeActiveTextEditor(changeActiveTextEditorHandler);
  changeActiveTextEditorHandler(vscode.window.activeTextEditor);
}

export function deactivate() {}
