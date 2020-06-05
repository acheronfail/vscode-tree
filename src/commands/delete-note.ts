import { Note } from '../note/note';
import vscode, { ExtensionContext } from 'vscode';
import { getActiveNote } from '../extension/workspace-state';

export async function deleteNote(note: Note) {
  const message = `Are you sure you want to delete '${note.name}'? This will also delete all of its children!`;
  const remove = await vscode.window.showInformationMessage(message, { modal: true }, 'Move to Trash');
  if (remove) {
    await note.delete();
    await vscode.commands.executeCommand('treeView.refresh');
  }
}

export const deleteNoteHandler = (context: ExtensionContext) => async (note?: Note) => {
  if (!note) {
    note = getActiveNote(context);
  }

  return await deleteNote(note);
};
