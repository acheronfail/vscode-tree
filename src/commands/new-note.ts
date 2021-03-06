import { Note } from '../note/note';
import { NewNoteType, CommandContext } from '../types';
import vscode from 'vscode';

function newNotePrompt(type: NewNoteType, note: Note) {
  switch (type) {
    case NewNoteType.Child:
      return ` Title for new child of "${note.name}":`;
    case NewNoteType.Sibling:
      return ` Title for new sibling of "${note.name}":`;
  }
}

export const newNote = async (context: CommandContext, type: NewNoteType, note: Note, open = true) => {
  const prompt = newNotePrompt(type, note);
  const name = await vscode.window.showInputBox({ prompt });
  if (!name) {
    return;
  }

  const newNote = await note.newNote(type, name);
  if (open) {
    await newNote.edit(context);
  }

  return newNote;
};
