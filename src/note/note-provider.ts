import { Note } from './note';
import vscode, { TreeDataProvider, TreeItem, ExtensionContext } from 'vscode';
import { readConfig } from './config';

export class NoteProvider implements TreeDataProvider<Note> {
  public static async create(context: ExtensionContext) {
    const { rootPath } = vscode.workspace;
    if (!rootPath) {
      vscode.window.showInformationMessage('Please open a directory!');
      throw new Error('A workspace root is required');
    }

    const config = await readConfig(rootPath);
    const rootNote = await Note.create({ dirPath: rootPath, config, context });
    return new NoteProvider(context, rootNote);
  }

  private _onDidChangeTreeData: vscode.EventEmitter<Note | undefined> = new vscode.EventEmitter<Note | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Note | undefined> = this._onDidChangeTreeData.event;

  public readonly context: ExtensionContext;
  public readonly rootNote: Note;

  private constructor(context: ExtensionContext, rootNote: Note) {
    this.context = context;
    this.rootNote = rootNote;
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
