import vscode, { ExtensionContext } from 'vscode';
import { Note } from '../note/note';
import { getActiveNote } from '../extension/workspace-state';
import { COMMAND_TREEVIEW_REFRESH } from '../types';

export const openNote = async (note: Note) => {
  await note.edit();

  // FIXME: doesn't expand
  setTimeout(() => {
    // Reveal in tree view.
    let currNote: Note | undefined = note;
    do {
      currNote.expanded = true;
    } while ((currNote = currNote.parent));

    vscode.commands.executeCommand(COMMAND_TREEVIEW_REFRESH);
  }, 1000);
};

export const openNoteHandler = (context: ExtensionContext) => async (note?: Note) => {
  if (!note) {
    note = getActiveNote(context);
  }

  openNote(note);
};
