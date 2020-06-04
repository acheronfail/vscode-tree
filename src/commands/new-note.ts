import { Note } from '../note/note';
import { NewNoteType } from '../types';
import { openNote } from './open-note';
import vscode, { TreeItemCollapsibleState } from 'vscode';

async function newNote(type: NewNoteType, note: Note) {
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
  await vscode.commands.executeCommand('treeView.refreshEntry');
}

export async function newChildNote(note: Note) {
  return newNote(NewNoteType.Child, note);
}

export async function newSiblingNote(note: Note) {
  return newNote(NewNoteType.Sibling, note);
}
