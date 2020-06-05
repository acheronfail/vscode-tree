import { Note } from '../note/note';
import { newNote } from './new-note';
import { NewNoteType } from '../types';
import { ExtensionContext } from 'vscode';
import { getActiveNote } from '../extension/workspace-state';

export const newSiblingNote = async (note: Note) => {
  return newNote(NewNoteType.Sibling, note);
};

export const newSiblingNoteHandler = (context: ExtensionContext) => async (note?: Note) => {
  if (!note) {
    note = getActiveNote(context);
  }

  return newSiblingNote(note);
};
