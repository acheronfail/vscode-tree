import vscode, { TreeItemCollapsibleState, ExtensionContext } from 'vscode';
import { Note } from '../note/note';
import { getActiveNote } from '../extension/workspace-state';

export const openNote = async (note: Note) => {
  await note.edit();

  // FIXME: doesn't expand
  setTimeout(() => {
    // Reveal in tree view.
    let currNote: Note | undefined = note;
    do {
      currNote.expanded = true;
    } while ((currNote = currNote.parent));

    vscode.commands.executeCommand('treeView.refresh');
  }, 1000);
};

export const openNoteHandler = (context: ExtensionContext) => async (note?: Note) => {
  if (!note) {
    note = getActiveNote(context);
  }

  context.workspaceState.update('activeNote', note);
  openNote(note);
};
