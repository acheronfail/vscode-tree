import { ExtensionContext, TextEditor } from 'vscode';
import { Note } from '../note/note';

export function getActiveNote(context: ExtensionContext) {
  const note = context.workspaceState.get<Note>('activeNote');
  if (!note) {
    // TODO: show error to user?
    throw new Error('Failed to find active note!');
  }

  return note;
}

export const updateActiveNoteHandler = (context: ExtensionContext) => async (editor?: TextEditor) => {
  const fileName = editor?.document.fileName;
  if (!fileName) {
    context.workspaceState.update('activeNote', undefined);
    return;
  }

  // Get the root note.
  let note = context.workspaceState.get<Note>('rootNote');
  if (!note) {
    context.workspaceState.update('activeNote', undefined);
    return;
  }

  // Is the file within the root note directory?
  if (!fileName.startsWith(note.dirPath)) {
    context.workspaceState.update('activeNote', undefined);
    return;
  }

  // Quick tree search to find active note.
  while (note) {
    const children: Note[] = await note.childrenAsNotes();
    note = children.find((n: Note): boolean => fileName.startsWith(n.dirPath) || fileName === n.filePath);
    if (note?.filePath === fileName) {
      context.workspaceState.update('activeNote', note);
      return;
    }
  }

  context.workspaceState.update('activeNote', undefined);
};
