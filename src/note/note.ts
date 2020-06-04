import { TreeItem, TreeItemCollapsibleState, Command } from 'vscode';
import path from 'path';
import fs from 'fs-extra';
import { ConfigEntry } from './config';

export class Note extends TreeItem {
  public name: string;
  public dirPath: string;
  public filePath: string;
  public open: boolean;

  public children: string[];
  public configEntry?: ConfigEntry;

  // NOTE: convention is that:
  //  - every file has a directory
  //  - the file name is `$NAME.md` and directory is `$NAME.md.d`
  public static async create(dirPath: string, configEntry?: ConfigEntry) {
    const entryNames = await fs.readdir(dirPath);
    const entriesWithNulls = await Promise.all(
      entryNames.map(async name => {
        // Only match the directories we're looking for.
        if (path.extname(name) !== '.d') {
          return null;
        }

        const entryPath = path.join(dirPath, name);

        // Only recurse directories.
        const stats = await fs.stat(entryPath);
        if (!stats.isDirectory()) {
          return null;
        }

        return entryPath;
      }),
    );

    const entries = entriesWithNulls.filter<string>((Boolean as any) as (x: any) => x is string);
    return new Note(dirPath, entries, configEntry);
  }

  private constructor(dirPath: string, children: string[], configEntry?: ConfigEntry) {
    const fileName = path.basename(dirPath, '.d');
    const filePath = path.join(path.dirname(dirPath), fileName);
    const noteName = path.basename(fileName, '.md');
    const isOpen = configEntry?.open || false;

    // Sort children according to config entry.
    const fsChildren = new Set(children);
    const sortedChildren = (configEntry?.children || [])
      .filter(cEntry => fsChildren.delete(cEntry.path))
      .map(cEntry => cEntry.path)
      .concat(...fsChildren.values());

    super(
      noteName,
      isOpen
        ? TreeItemCollapsibleState.Expanded
        : sortedChildren.length
        ? TreeItemCollapsibleState.Collapsed
        : undefined,
    );

    this.open = isOpen;
    this.name = noteName;
    this.dirPath = dirPath;
    this.filePath = filePath;
    this.children = sortedChildren;
    this.configEntry = configEntry;
  }

  private async _newNote(name: string, dirname: string) {
    const dirPath = path.join(dirname, `${name}.md.d`);
    await fs.mkdirs(dirPath);
    const newNote = await Note.create(dirPath);
    await fs.outputFile(newNote.filePath, '');

    return newNote;
  }

  async newChild(name: string) {
    return this._newNote(name, this.dirPath);
  }

  async newSibling(name: string) {
    return this._newNote(name, path.dirname(this.dirPath));
  }
}
