import vscode, { TreeItem, TreeItemCollapsibleState, Uri, Command, ExtensionKind } from 'vscode';
import path from 'path';
import fs from 'fs-extra';
import { ConfigEntry } from './config';
import validFilename from 'valid-filename';

interface NoteOptions {
  dirPath: string;
  children: string[];
  configEntry?: ConfigEntry;
  parent?: Note;
}

export class Note extends TreeItem {
  public name: string;
  public dirPath: string;
  public filePath: string;
  public expanded: boolean;

  public parent?: Note;
  public children: string[];
  public configEntry?: ConfigEntry;

  private static dirName(name: string) {
    if (!validFilename(name)) {
      // TODO: show error to user?
      throw new Error(`The name "${name}" is not a valid note name!`);
    }

    return `${name}.md.d`;
  }

  // NOTE: convention is that:
  //  - every file has a directory
  //  - the file name is `$NAME.md` and directory is `$NAME.md.d`
  public static async create(dirPath: string, configEntry?: ConfigEntry, parent?: Note) {
    await fs.mkdirs(dirPath);

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
    return new Note({
      dirPath,
      children: entries,
      configEntry,
      parent,
    });
  }

  private constructor(options: NoteOptions) {
    const fileName = path.basename(options.dirPath, '.d');
    const filePath = path.join(path.dirname(options.dirPath), fileName);
    const noteName = path.basename(fileName, '.md');
    const isExpanded = options.configEntry?.open || false;

    // Sort children according to config entry.
    const fsChildren = new Set(options.children);
    const sortedChildren = (options.configEntry?.children || [])
      .filter(cEntry => fsChildren.delete(cEntry.path))
      .map(cEntry => cEntry.path)
      .concat(...fsChildren.values());

    super(
      noteName,
      sortedChildren.length
        ? isExpanded
          ? TreeItemCollapsibleState.Expanded
          : TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None,
    );

    this.expanded = isExpanded;
    this.name = noteName;
    this.dirPath = options.dirPath;
    this.filePath = filePath;
    this.configEntry = options.configEntry;
    this.children = sortedChildren;
    this.parent = options.parent;
  }

  async newChild(name: string) {
    const dirPath = path.join(this.dirPath, Note.dirName(name));
    return await Note.create(dirPath, undefined, this);
  }

  async newSibling(name: string) {
    const dirPath = path.join(path.dirname(this.dirPath), Note.dirName(name));
    return await Note.create(dirPath, undefined, this.parent);
  }

  get command(): Command {
    return {
      command: 'vscode-tree.openNote',
      title: 'Open Note',
      arguments: [this],
    };
  }

  get resourceUri(): Uri {
    return Uri.parse(`file://${this.filePath}`);
  }

  async edit() {
    // Create note file if it doesn't exist.
    await fs.ensureFile(this.filePath);
    const editor = await vscode.window.showTextDocument(this.resourceUri);
  }

  async childrenAsNotes(): Promise<Note[]> {
    const configEntryChildrenMap = (this.configEntry?.children || []).reduce<Record<string, ConfigEntry>>((r, e) => {
      r[e.path] = e;
      return r;
    }, {});

    return await Promise.all(
      this.children.map(async dirPath => {
        return await Note.create(dirPath, configEntryChildrenMap[dirPath], this);
      }),
    );
  }

  // TODO: advanced delete behaviour?
  //  move children into parent, etc
  async delete() {
    const fileUri = Uri.parse(this.filePath);
    const dirUri = Uri.parse(this.dirPath);

    // Move the note and its folder to the trash.
    const options = { recursive: true, useTrash: true };
    await vscode.workspace.fs.delete(fileUri, options);
    await vscode.workspace.fs.delete(dirUri, options);

    for (const editor of vscode.window.visibleTextEditors) {
      if (editor.document.uri.fsPath === fileUri.fsPath) {
        // Annoyingly we can't just close an editor, we must first focus it and then execute a command.
        await vscode.window.showTextDocument(fileUri, { preserveFocus: false, preview: true });
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      }
    }
  }
}
