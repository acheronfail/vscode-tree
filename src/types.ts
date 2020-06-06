import path from 'path';
import { ThemeIcon, ExtensionContext, TreeView } from 'vscode';
import { Note } from './note/note';

export interface CommandContext {
  context: ExtensionContext;
  rootNote: Note;
  noteTreeView: TreeView<Note>;
}

export enum NewNoteType {
  Child = 'child',
  Sibling = 'sibling',
}

export enum WorkspaceStateKey {
  ActiveNoteFilePath = 'ActiveNoteFilePath',
}

// NOTE: these values need to match up with those in package.json.

export const EXTENSION_ID = 'vscode-tree';

export const COMMAND_OPEN_NOTE = `${EXTENSION_ID}.openNote`;
export const COMMAND_NEW_CHILD_NOTE = `${EXTENSION_ID}.newChildNote`;
export const COMMAND_NEW_SIBLING_NOTE = `${EXTENSION_ID}.newSiblingNote`;
export const COMMAND_DELETE_NOTE = `${EXTENSION_ID}.deleteNote`;
export const COMMAND_MOVE_TOP_PARENT = `${EXTENSION_ID}.moveTopParent`;
export const COMMAND_MOVE_BOTTOM_PARENT = `${EXTENSION_ID}.moveBottomParent`;
export const COMMAND_MOVE_OUT = `${EXTENSION_ID}.moveOut`;
export const COMMAND_MOVE_IN = `${EXTENSION_ID}.moveIn`;
export const COMMAND_MOVE_UP = `${EXTENSION_ID}.moveUp`;
export const COMMAND_MOVE_DOWN = `${EXTENSION_ID}.moveDown`;

export const TREEVIEW_ID = 'treeView';
export const COMMAND_TREEVIEW_REFRESH = `${TREEVIEW_ID}.refresh`;

export const RESOURCES_PATH = path.resolve(__dirname, '..', 'resources');
export const ICONS = {
  PREVIEW: new ThemeIcon('edit'),

  NOTE_NAME: 'NOTE',
  NOTE_0: path.join(RESOURCES_PATH, 'note.gold.svg'),
  NOTE_1: path.join(RESOURCES_PATH, 'note.green.svg'),
  NOTE_2: path.join(RESOURCES_PATH, 'note.blue.svg'),
  NOTE_3: path.join(RESOURCES_PATH, 'note.purple.svg'),
  NOTE_4: path.join(RESOURCES_PATH, 'note.red.svg'),

  EDIT_NAME: 'EDIT',
  EDIT_0: path.join(RESOURCES_PATH, 'edit.gold.svg'),
  EDIT_1: path.join(RESOURCES_PATH, 'edit.green.svg'),
  EDIT_2: path.join(RESOURCES_PATH, 'edit.blue.svg'),
  EDIT_3: path.join(RESOURCES_PATH, 'edit.purple.svg'),
  EDIT_4: path.join(RESOURCES_PATH, 'edit.red.svg'),

  COLOR_DEPTH: 5,
} as const;
