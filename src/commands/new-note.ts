import { Note } from '../note/note';
import { NewNoteType } from '../types';
import { openNote } from './open-note';
import vscode from 'vscode';

function newNotePrompt(type: NewNoteType, note: Note) {
  switch (type) {
    case NewNoteType.Child:
      return `New Child (of ${note.name}) Title:`;
    case NewNoteType.Sibling:
      return `New Sibling (of ${note.name}) Title:`;
  }
}

export const newNote = async (type: NewNoteType, note: Note, open = true) => {
  const prompt = newNotePrompt(type, note);
  const name = await vscode.window.showInputBox({ prompt });
  if (!name) {
    return;
  }

  const newNote = await note.newNote(type, name);
  if (open) {
    await openNote(newNote);
  }

  return newNote;
};
