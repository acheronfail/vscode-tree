import { Note } from '../note/note';
import vscode from 'vscode';
import { CMD_TREEVIEW_REFRESH } from '../constants';

export async function deleteNote(note: Note) {
  const message = `Are you sure you want to delete '${note.name}'? This will also delete all of its children!`;
  const remove = await vscode.window.showInformationMessage(message, { modal: true }, 'Move to Trash');
  if (remove) {
    await note.delete();
    if (note.parent) {
      note.parent.children = note.parent.children.filter(p => p !== note.dirPath);
    }

    await vscode.commands.executeCommand(CMD_TREEVIEW_REFRESH);
  }
}
