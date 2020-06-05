import { Note } from './note';
import vscode, { TreeDataProvider, TreeItem } from 'vscode';
import { readConfigEntry } from './config';

export class NoteProvider implements TreeDataProvider<Note> {
  public static async create() {
    const { rootPath } = vscode.workspace;
    if (!rootPath) {
      vscode.window.showInformationMessage('Please open a directory!');
      throw new Error('A workspace root is required');
    }

    const configEntry = await readConfigEntry(rootPath);
    const rootNote = await Note.create(rootPath, configEntry);
    return new NoteProvider(rootNote);
  }

  private _onDidChangeTreeData: vscode.EventEmitter<Note | undefined> = new vscode.EventEmitter<Note | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Note | undefined> = this._onDidChangeTreeData.event;

  public readonly rootNote: Note;

  private constructor(rootNote: Note) {
    this.rootNote = rootNote;
    (global as any).rootNote = rootNote;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(note: Note): TreeItem {
    return note;
  }

  async getChildren(note: Note = this.rootNote): Promise<Note[]> {
    return await note.childrenAsNotes();
  }
}
