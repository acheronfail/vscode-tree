import vscode from 'vscode';
import { openNoteHandler } from '../commands/open-note';
import { newChildNoteHandler, newSiblingNoteHandler } from '../commands/new-note';
import { NoteProvider } from '../note/note-provider';
import { deleteNoteHandler } from '../commands/delete-note';
import { Note } from '../note/note';

// TODO: https://github.com/mushanshitiancai/vscode-paste-image

export async function activate(context: vscode.ExtensionContext) {
  // Register side bar data provider.
  const noteProvider = await NoteProvider.create();
  vscode.window.registerTreeDataProvider('treeView', noteProvider);

  // Set rootNote in workspace state.
  context.workspaceState.update('rootNote', noteProvider.rootNote);

  // Register commands.
  context.subscriptions.push(
    // TODO: get these to be able to be run from the command palette
    vscode.commands.registerCommand('vscode-tree.openNote', openNoteHandler(context)),
    vscode.commands.registerCommand('vscode-tree.newChildNote', newChildNoteHandler(context)),
    vscode.commands.registerCommand('vscode-tree.newSiblingNote', newSiblingNoteHandler(context)),
    vscode.commands.registerCommand('vscode-tree.deleteNote', deleteNoteHandler(context)),
    vscode.commands.registerCommand('treeView.refresh', () => noteProvider.refresh()),
  );

  // Ensure `activeNote` stays updated.
  vscode.window.onDidChangeActiveTextEditor(async editor => {
    const fileName = editor?.document.fileName;
    console.log('fileName', fileName);
    if (!fileName) {
      context.workspaceState.update('activeNote', undefined);
      return;
    }

    let note: Note | undefined = noteProvider.rootNote;

    // Is the file within the root note directory?
    if (!fileName.startsWith(note.dirPath)) {
      context.workspaceState.update('activeNote', undefined);
      return;
    }

    // Quick tree search to find active note.
    while (note) {
      const children: Note[] = await note.childrenAsNotes();
      note = children.find((n: Note): boolean => fileName.startsWith(n.dirPath) || fileName === n.filePath);
      if (note?.filePath === fileName) {
        context.workspaceState.update('activeNote', note);
        return;
      }
    }

    context.workspaceState.update('activeNote', undefined);
  });
}

export function deactivate() {}
