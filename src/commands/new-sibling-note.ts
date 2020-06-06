import { Note } from '../note/note';
import { newNote } from './new-note';
import { NewNoteType, CommandContext } from '../types';
import { ExtensionContext } from 'vscode';
import { getActiveNote } from '../extension/workspace-state';

export const newSiblingNote = async (note: Note) => {
  return newNote(NewNoteType.Sibling, note);
};

export const newSiblingNoteHandler = (context: CommandContext) => async (note?: Note) => {
  if (!note) {
    note = await getActiveNote(context);
  }

  return newSiblingNote(note);
};
