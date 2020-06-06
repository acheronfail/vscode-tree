import { Note } from '../note/note';
import { getActiveNote } from '../extension/workspace-state';
import { CommandContext } from '../types';

export const openNoteHandler = (context: CommandContext) => async (note?: Note) => {
  if (!note) {
    note = await getActiveNote(context);
  }

  await note.edit();
};
