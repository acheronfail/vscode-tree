import { pathExists, outputFile } from 'fs-extra';
import vscode, { Uri, TreeItemCollapsibleState } from 'vscode';
import { Note } from '../note/note';

export async function openNote(note: Note) {
  note.collapsibleState = TreeItemCollapsibleState.Expanded;

  // Create note file if it doesn't exist.
  if (!(await pathExists(note.filePath))) {
    await outputFile(note.filePath, '');
  }

  const uri = Uri.parse(`file://${note.filePath}`);
  await vscode.window.showTextDocument(uri);
}
