import { CommandContext } from '../types';
import { Note } from '../note/note';
import { getActiveNote } from '../extension/workspace-state';
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

export const renameNoteHandler = (context: CommandContext) => async (note?: Note) => {
  if (!note) {
    note = await getActiveNote(context);
  }

  await renameNote(note);
};
