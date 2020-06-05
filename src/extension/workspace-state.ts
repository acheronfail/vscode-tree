import { ExtensionContext, TextEditor } from 'vscode';
import { Note } from '../note/note';
import { WorkspaceStateKey, COMMAND_TREEVIEW_REFRESH } from '../types';
import vscode from 'vscode';

export function getActiveNote(context: ExtensionContext) {
  const note = context.workspaceState.get<Note>(WorkspaceStateKey.ActiveNoteFilePath);
  if (!note) {
    // TODO: show error to user?
    throw new Error('Failed to find active note!');
  }

  return note;
}

export const updateActiveNoteHandler = (context: ExtensionContext, rootNote: Note) => async (editor?: TextEditor) => {
  const fsPath = editor?.document.uri.fsPath;
  if (!fsPath) {
    return context.workspaceState.update(WorkspaceStateKey.ActiveNoteFilePath, undefined);
  }

  // Is the file within the root note directory?
  if (!fsPath.startsWith(rootNote.dirPath)) {
    return context.workspaceState.update(WorkspaceStateKey.ActiveNoteFilePath, undefined);
  }

  // Quick tree search to find active note.
  let note: Note | undefined = rootNote;
  while (note) {
    const children: Note[] = await note.childrenAsNotes();
    note = children.find((n: Note): boolean => fsPath.startsWith(n.dirPath) || fsPath === n.filePath);
    if (note?.filePath === fsPath) {
      context.workspaceState.update(WorkspaceStateKey.ActiveNoteFilePath, note.filePath);
      vscode.commands.executeCommand(COMMAND_TREEVIEW_REFRESH);
      return;
    }
  }

  return context.workspaceState.update(WorkspaceStateKey.ActiveNoteFilePath, undefined);
};
