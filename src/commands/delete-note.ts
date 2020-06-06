import { Note } from '../note/note';
import vscode, { ExtensionContext } from 'vscode';
import { getActiveNote } from '../extension/workspace-state';
import { COMMAND_TREEVIEW_REFRESH, CommandContext } from '../types';

export async function deleteNote(note: Note) {
  const message = `Are you sure you want to delete '${note.name}'? This will also delete all of its children!`;
  const remove = await vscode.window.showInformationMessage(message, { modal: true }, 'Move to Trash');
  if (remove) {
    await note.delete();
    if (note.parent) {
      note.parent.children = note.parent.children.filter(p => p !== note.dirPath);
    }

    await vscode.commands.executeCommand(COMMAND_TREEVIEW_REFRESH);
  }
}

export const deleteNoteHandler = (context: CommandContext) => async (note?: Note) => {
  if (!note) {
    note = await getActiveNote(context);
  }

  return await deleteNote(note);
};
