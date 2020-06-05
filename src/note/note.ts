import vscode, { TreeItem, TreeItemCollapsibleState, Uri, Command, ThemeIcon, ExtensionContext } from 'vscode';
import path from 'path';
import fs from 'fs-extra';
import { ConfigEntry } from './config';
import validFilename from 'valid-filename';
import { NewNoteType, WorkspaceStateKey, ICONS } from '../types';

export interface NoteCreateOptions {
  dirPath: string;
  context: ExtensionContext;
  configEntry?: ConfigEntry;
  parent?: Note;
}

interface NoteConstructorOptions {
  dirPath: string;
  children: string[];
  context: ExtensionContext;
  configEntry?: ConfigEntry;
  parent?: Note;
}

export class Note extends TreeItem {
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
  public static async create(options: NoteCreateOptions) {
    const { dirPath, configEntry, parent, context } = options;

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
      context,
      children: entries,
      configEntry,
      parent,
    });
  }

  public name: string;
  public dirPath: string;
  public filePath: string;
  public expanded: boolean;
  public depth: number;

  public parent?: Note;
  public children: string[];
  public configEntry?: ConfigEntry;

  private context: ExtensionContext;

  private constructor(options: NoteConstructorOptions) {
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

    this.context = options.context;
    this.expanded = isExpanded;
    this.name = noteName;
    this.dirPath = options.dirPath;
    this.filePath = filePath;
    this.configEntry = options.configEntry;
    this.children = sortedChildren;
    this.parent = options.parent;

    const parentDepth = options.parent?.depth || 0;
    this.depth = parentDepth + 1;
  }

  async newNote(type: NewNoteType, name: string) {
    switch (type) {
      case NewNoteType.Child:
        return this.newChild(name);
      case NewNoteType.Sibling:
        return this.newSibling(name);
    }
  }

  async newChild(name: string) {
    const dirPath = path.join(this.dirPath, Note.dirName(name));
    return await Note.create({
      dirPath,
      parent: this,
      context: this.context,
    });
  }

  async newSibling(name: string) {
    const dirPath = path.join(path.dirname(this.dirPath), Note.dirName(name));
    return await Note.create({
      dirPath,
      parent: this.parent,
      context: this.context,
    });
  }

  get command(): Command {
    return {
      command: 'vscode-tree.openNote',
      title: 'Open Note',
      arguments: [this],
    };
  }

  get id(): string {
    return this.filePath;
  }

  get iconPath(): ThemeIcon {
    const activeNoteFilePath = this.context.workspaceState.get<string>(WorkspaceStateKey.ActiveNoteFilePath);
    if (activeNoteFilePath === this.filePath) {
      return ICONS.PREVIEW;
    }

    const iconKey = `NOTE_${this.depth % ICONS.NOTE_NUMBER}` as keyof typeof ICONS;
    return ICONS[iconKey];
  }

  get tooltip(): string {
    return this.filePath;
  }

  async edit() {
    // Create note file if it doesn't exist.
    await fs.ensureFile(this.filePath);

    const filePathUri = Uri.parse(this.filePath);
    await vscode.window.showTextDocument(filePathUri);
  }

  async childrenAsNotes(): Promise<Note[]> {
    const configEntryChildrenMap = (this.configEntry?.children || []).reduce<Record<string, ConfigEntry>>((r, e) => {
      r[e.path] = e;
      return r;
    }, {});

    return await Promise.all(
      this.children.map(async dirPath => {
        return await Note.create({
          dirPath,
          configEntry: configEntryChildrenMap[dirPath],
          parent: this,
          context: this.context,
        });
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
