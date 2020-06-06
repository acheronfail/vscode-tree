import path from 'path';
import { ThemeIcon } from 'vscode';

// NOTE: these values need to match up with those in package.json.

export const ID_EXTENSION = 'vscode-tree';
export const ID_TREEVIEW = 'treeView';

export const CMD_OPEN_NOTE = `${ID_EXTENSION}.openNote`;
export const CMD_NEW_CHILD_NOTE = `${ID_EXTENSION}.newChildNote`;
export const CMD_NEW_SIBLING_NOTE = `${ID_EXTENSION}.newSiblingNote`;
export const CMD_DELETE_NOTE = `${ID_EXTENSION}.deleteNote`;
export const CMD_RENAME_NOTE = `${ID_EXTENSION}.renameNote`;
export const CMD_DUPLICATE_NOTE = `${ID_EXTENSION}.duplicateNote`;

export const CMD_MOVE_TOP_PARENT = `${ID_EXTENSION}.moveTopParent`;
export const CMD_MOVE_BOTTOM_PARENT = `${ID_EXTENSION}.moveBottomParent`;
export const CMD_MOVE_OUT = `${ID_EXTENSION}.moveOut`;
export const CMD_MOVE_IN = `${ID_EXTENSION}.moveIn`;
export const CMD_MOVE_UP = `${ID_EXTENSION}.moveUp`;
export const CMD_MOVE_DOWN = `${ID_EXTENSION}.moveDown`;

export const CMD_TREEVIEW_REFRESH = `${ID_TREEVIEW}.refresh`;

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
