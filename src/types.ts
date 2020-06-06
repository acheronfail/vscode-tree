import { ExtensionContext, TreeView } from 'vscode';
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
