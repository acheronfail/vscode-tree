import { CommandContext } from './types';
import { Note } from './note/note';
import { getActiveNote } from './extension/workspace-state';
import vscode from 'vscode';

export type HandlerFunction =
  | ((context: CommandContext) => Promise<unknown>)
  | ((context: CommandContext, note: Note) => Promise<unknown>);

export function createHandler(context: CommandContext, fn: HandlerFunction) {
  return async function (note?: Note) {
    try {
      // Skip getting active note if the function doesn't require it.
      if (fn.length === 1) {
        return await (fn as (context: CommandContext) => Promise<unknown>)(context);
      }

      if (!note) {
        note = await getActiveNote(context);
      }

      return await fn(context, note);
    } catch (err) {
      vscode.window.showErrorMessage(`[Notes] An error occurred: ${err.message}`);
      console.error(err);
    }
  };
}
