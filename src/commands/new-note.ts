import { Note } from '../note/note';
import { NewNoteType } from '../types';
import { openNote } from './open-note';
import vscode, { ExtensionContext } from 'vscode';
import { getActiveNote } from '../extension/workspace-state';

const newNote = async (type: NewNoteType, note: Note) => {
  const name = await vscode.window.showInputBox({
    prompt: `Enter note title (under: ${note.name})`,
  });
  if (!name) {
    return;
  }

  let newNote: Note;
  switch (type) {
    case NewNoteType.Child:
      newNote = await note.newChild(name);
      break;
    case NewNoteType.Sibling:
      newNote = await note.newSibling(name);
      break;
  }

  await openNote(newNote);
};

export const newChildNote = async (note: Note) => {
  return newNote(NewNoteType.Child, note);
};

export const newSiblingNote = async (note: Note) => {
  return newNote(NewNoteType.Sibling, note);
};

export const newChildNoteHandler = (context: ExtensionContext) => async (note?: Note) => {
  if (!note) {
    note = getActiveNote(context);
  }

  return newChildNote(note);
};

export const newSiblingNoteHandler = (context: ExtensionContext) => async (note?: Note) => {
  if (!note) {
    note = getActiveNote(context);
  }

  return newSiblingNote(note);
};
