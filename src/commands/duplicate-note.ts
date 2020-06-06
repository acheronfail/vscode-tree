import { Note } from '../note/note';
import { CommandContext } from '../types';
import { getActiveNote } from '../extension/workspace-state';

export const duplicateNoteHandler = (context: CommandContext) => async (note?: Note) => {
  if (!note) {
    note = await getActiveNote(context);
  }

  await note.duplicate(context);
};
