import { CommandContext } from './types';
import { Note } from './note/note';
import { getActiveNote } from './extension/workspace-state';
import vscode from 'vscode';

export function createHandler(
  context: CommandContext,
  fn: (context: CommandContext, note: Note) => unknown | Promise<unknown>,
) {
  return async function (note?: Note) {
    try {
      if (!note) {
        note = await getActiveNote(context);
      }

      await fn(context, note);
    } catch (err) {
      vscode.window.showErrorMessage(`[Notes] An error occurred: ${err.message}`);
      console.error(err);
    }
  };
}
