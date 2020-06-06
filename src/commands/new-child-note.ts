import { Note } from '../note/note';
import { NewNoteType, CommandContext } from '../types';
import { getActiveNote } from '../extension/workspace-state';
import { newNote } from './new-note';

export const newChildNoteHandler = (context: CommandContext) => async (note?: Note) => {
  if (!note) {
    note = await getActiveNote(context);
  }

  return newNote(context, NewNoteType.Child, note);
};
