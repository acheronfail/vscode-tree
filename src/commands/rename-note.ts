import { Note } from '../note/note';
import vscode from 'vscode';

export const renameNote = async (note: Note) => {
  const prompt = `Rename note: ${note.name}`;
  const newName = await vscode.window.showInputBox({ prompt, value: note.name });
  if (!newName) {
    // User cancelled input.
    return;
  }

  note.rename(newName);
};
