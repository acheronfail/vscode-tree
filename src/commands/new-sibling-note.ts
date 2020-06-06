import { Note } from '../note/note';
import { newNote } from './new-note';
import { NewNoteType, CommandContext } from '../types';
import { getActiveNote } from '../extension/workspace-state';

export const newSiblingNoteHandler = (context: CommandContext) => async (note?: Note) => {
  if (!note) {
    note = await getActiveNote(context);
  }

  return newNote(context, NewNoteType.Sibling, note);
};
