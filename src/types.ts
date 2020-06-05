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
