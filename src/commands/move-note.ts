import { Note } from '../note/note';
import vscode, { ExtensionContext } from 'vscode';
import * as constants from '../types';
import { getActiveNote } from '../extension/workspace-state';

export type MoveOptions = { delta: number } | { position: 'top' | 'bottom' };

export function moveNote(note: Note, options: MoveOptions) {
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
    if (options.position === 'top') {
      target = 0;
    } else {
      target = parentNote.children.length - 1;
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
  parentNote.updateConfigEntry();

  // Update the treeview.
  vscode.commands.executeCommand(constants.COMMAND_TREEVIEW_REFRESH);
}

export const moveHandler = (context: ExtensionContext, moveOptions: MoveOptions) => (note?: Note) => {
  if (!note) {
    note = getActiveNote(context);
  }

  moveNote(note, moveOptions);
};
