import { Note } from '../note/note';
import { ExtensionContext } from 'vscode';
import { NewNoteType } from '../types';
import { getActiveNote } from '../extension/workspace-state';
import { newNote } from './new-note';

export const newChildNote = async (note: Note) => {
  return newNote(NewNoteType.Child, note);
};
export const newChildNoteHandler = (context: ExtensionContext) => async (note?: Note) => {
  if (!note) {
    note = getActiveNote(context);
  }

  return newChildNote(note);
};
