import { Note } from '../note/note';
import { ExtensionContext } from 'vscode';
import { NewNoteType, CommandContext } from '../types';
import { getActiveNote } from '../extension/workspace-state';
import { newNote } from './new-note';

export const newChildNote = async (note: Note) => {
  return newNote(NewNoteType.Child, note);
};
export const newChildNoteHandler = (context: CommandContext) => async (note?: Note) => {
  if (!note) {
    note = await getActiveNote(context);
  }

  return newChildNote(note);
};
