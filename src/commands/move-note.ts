import { Note } from '../note/note';
import vscode from 'vscode';
import * as constants from '../constants';
import { newNote } from './new-note';
import { CommandContext, NewNoteType } from '../types';

export type MoveOptions = { delta: number } | { position: 'top' | 'bottom' | 'in' | 'out' };

async function moveOut(context: CommandContext, note: Note, parentNote: Note) {
  const grandParentNote = parentNote.parent;
  if (!grandParentNote) {
    // Nothing to do, already at outermost layer.
    return;
  }

  // Move from parent to grandParent.
  await note.moveTo(grandParentNote, { before: parentNote });
}

async function moveIn(context: CommandContext, note: Note) {
  // Create a new child of the parent note.
  const newParent = await newNote(context, NewNoteType.Sibling, note, false);
  if (!newParent) {
    // No new note was created.
    return;
  }

  // This will be the only note in the parent, so don't need to order it.
  await note.moveTo(newParent);
}

export async function moveNote(context: CommandContext, note: Note, options: MoveOptions) {
  // The only note without a parent is the root note and that note should not be able to be moved.
  const parentNote = note.parent;
  if (!parentNote) {
    throw new Error(`Note ${note.name} did not have a parent!`);
  }

  const index = parentNote.children.findIndex(p => p === note?.dirPath);
  if (index === -1) {
    throw new Error(`Failed to find ${note.name} in parent's children!`);
  }

  let target;
  if ('delta' in options) {
    target = index + options.delta;
  } else {
    switch (options.position) {
      case 'top':
        target = 0;
        break;
      case 'bottom':
        target = parentNote.children.length - 1;
        break;
      case 'in':
        return await moveIn(context, note);
      case 'out':
        return await moveOut(context, note, parentNote);
    }
  }

  if (target < 0 || target >= parentNote.children.length) {
    // Nothing to do.
    return;
  }

  // Reorder.
  const [removed] = parentNote.children.splice(index, 1);
  parentNote.children.splice(target, 0, removed);

  // Save updated order in as ConfigEntry.
  await parentNote.updateConfigEntry();

  // Update the treeview.
  await vscode.commands.executeCommand(constants.CMD_TREEVIEW_REFRESH);
}
