import { ExtensionContext } from 'vscode';
import { Note } from '../note/note';

export function getActiveNote(context: ExtensionContext) {
  const note = context.workspaceState.get<Note>('activeNote');
  if (!note) {
    // TODO: show error to user?
    throw new Error('Failed to find active note!');
  }

  return note;
}
