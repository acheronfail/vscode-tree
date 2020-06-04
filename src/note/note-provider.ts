import { Note } from './note';
import vscode, { TreeDataProvider, TreeItem } from 'vscode';
import path from 'path';
import fs from 'fs-extra';
import { CONFIG_FILE_NAME, ConfigEntry } from './config';

export class NotesProvider implements TreeDataProvider<Note> {
  public static async create() {
    const { rootPath } = vscode.workspace;
    if (!rootPath) {
      vscode.window.showInformationMessage('Please open a directory!');
      throw new Error('A workspace root is required');
    }

    const configEntryPath = path.join(rootPath, CONFIG_FILE_NAME);
    if (!(await fs.pathExists(configEntryPath))) {
      await fs.outputJson(configEntryPath, { path: rootPath, children: [] });
    }

    const configEntry = await fs.readJson(configEntryPath);
    const rootNote = await Note.create(rootPath, configEntry);
    return new NotesProvider(rootNote);
  }

  private _onDidChangeTreeData: vscode.EventEmitter<Note | undefined> = new vscode.EventEmitter<Note | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Note | undefined> = this._onDidChangeTreeData.event;

  private rootNote: Note;

  private constructor(rootNote: Note) {
    this.rootNote = rootNote;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: Note): TreeItem {
    return element;
  }

  async getChildren(element: Note = this.rootNote): Promise<Note[]> {
    const configEntryChildrenMap = (element.configEntry?.children || []).reduce<Record<string, ConfigEntry>>((r, e) => {
      r[e.path] = e;
      return r;
    }, {});

    return await Promise.all(
      element.children.map(async dirPath => {
        return await Note.create(dirPath, configEntryChildrenMap[dirPath]);
      }),
    );
  }
}
