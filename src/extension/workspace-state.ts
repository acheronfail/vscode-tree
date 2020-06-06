import { ExtensionContext, TextEditor } from 'vscode';
import { Note } from '../note/note';
import { WorkspaceStateKey, CMD_TREEVIEW_REFRESH, CommandContext } from '../types';
import vscode from 'vscode';

async function findNote(rootNote: Note, targetDirPath: string) {
  let note: Note | undefined = rootNote;
  while (note) {
    const children: Note[] = await note.childrenAsNotes();
    note = children.find((n: Note): boolean => targetDirPath.startsWith(n.dirPath) || targetDirPath === n.dirPath);
    if (note?.dirPath === targetDirPath) {
      return note;
    }
  }
}

export async function getActiveNote({ context, rootNote }: CommandContext) {
  const filePath = context.workspaceState.get<string>(WorkspaceStateKey.ActiveNoteFilePath);
  if (!filePath) {
    throw new Error('No note is active!');
  }

  const note = await findNote(rootNote, Note.filePathToDirPath(filePath));
  if (!note) {
    throw new Error('Failed to find active note!');
  }

  return note;
}

export const updateActiveNoteHandler = ({ context, rootNote }: CommandContext) => async (editor?: TextEditor) => {
  const update = async (p?: string) => {
    context.workspaceState.update(WorkspaceStateKey.ActiveNoteFilePath, p);
    await vscode.commands.executeCommand(CMD_TREEVIEW_REFRESH);
  };

  const fsPath = editor?.document.uri.fsPath;
  if (!fsPath) {
    return await update(undefined);
  }

  // Is the file within the root note directory?
  if (!fsPath.startsWith(rootNote.dirPath)) {
    return await update(undefined);
  }

  const note = await findNote(rootNote, Note.filePathToDirPath(fsPath));
  if (note) {
    return await update(note.filePath);
  }

  return await update(undefined);
};
