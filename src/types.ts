import path from 'path';
import { ThemeIcon } from 'vscode';

export enum NewNoteType {
  Child = 'child',
  Sibling = 'sibling',
}

export enum WorkspaceStateKey {
  ActiveNoteFilePath = 'ActiveNoteFilePath',
}

export const EXTENSION_ID = 'vscode-tree';

export const COMMAND_OPEN_NOTE = `${EXTENSION_ID}.openNote`;
export const COMMAND_NEW_CHILD_NOTE = `${EXTENSION_ID}.newChildNote`;
export const COMMAND_NEW_SIBLING_NOTE = `${EXTENSION_ID}.newSiblingNote`;
export const COMMAND_DELETE_NOTE = `${EXTENSION_ID}.deleteNote`;

export const TREEVIEW_ID = 'treeView';
export const COMMAND_TREEVIEW_REFRESH = `${TREEVIEW_ID}.refresh`;

export const RESOURCES_PATH = path.resolve(__dirname, '..', 'resources');
export const ICONS = {
  PREVIEW: new ThemeIcon('edit'),

  NOTE_0: path.join(RESOURCES_PATH, 'note.gold.svg'),
  NOTE_1: path.join(RESOURCES_PATH, 'note.green.svg'),
  NOTE_2: path.join(RESOURCES_PATH, 'note.blue.svg'),
  NOTE_3: path.join(RESOURCES_PATH, 'note.purple.svg'),
  NOTE_4: path.join(RESOURCES_PATH, 'note.red.svg'),
  NOTE_NUMBER: 5,
} as const;
