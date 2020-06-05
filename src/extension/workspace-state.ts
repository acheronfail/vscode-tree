import { ExtensionContext, TextEditor } from 'vscode';
import { Note } from '../note/note';
import { WorkspaceStateKey } from '../types';

export function getActiveNote(context: ExtensionContext) {
  const note = context.workspaceState.get<Note>(WorkspaceStateKey.ActiveNote);
  if (!note) {
    // TODO: show error to user?
    throw new Error('Failed to find active note!');
  }

  return note;
}

export const updateActiveNoteHandler = (context: ExtensionContext) => async (editor?: TextEditor) => {
  const fsPath = editor?.document.uri.fsPath;
  if (!fsPath) {
    return context.workspaceState.update(WorkspaceStateKey.ActiveNote, undefined);
  }

  // Get the root note.
  let note = context.workspaceState.get<Note>(WorkspaceStateKey.RootNote);
  if (!note) {
    return context.workspaceState.update(WorkspaceStateKey.ActiveNote, undefined);
  }

  // Is the file within the root note directory?
  if (!fsPath.startsWith(note.dirPath)) {
    return context.workspaceState.update(WorkspaceStateKey.ActiveNote, undefined);
  }

  // Quick tree search to find active note.
  while (note) {
    const children: Note[] = await note.childrenAsNotes();
    note = children.find((n: Note): boolean => fsPath.startsWith(n.dirPath) || fsPath === n.filePath);
    if (note?.filePath === fsPath) {
      return context.workspaceState.update(WorkspaceStateKey.ActiveNote, note);
    }
  }

  return context.workspaceState.update(WorkspaceStateKey.ActiveNote, undefined);
};
