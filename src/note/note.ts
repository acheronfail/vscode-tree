import vscode, { TreeItem, TreeItemCollapsibleState, Uri, Command, ThemeIcon, ExtensionContext } from 'vscode';
import path from 'path';
import fs, { pathExists } from 'fs-extra';
import { Config } from './config';
import validFilename from 'valid-filename';
import { NewNoteType, WorkspaceStateKey, ICONS, COMMAND_TREEVIEW_REFRESH } from '../types';

export interface NoteCreateOptions {
  dirPath: string;
  context: ExtensionContext;
  config: Config;
  parent?: Note;
}

interface NoteConstructorOptions {
  dirPath: string;
  children: string[];
  context: ExtensionContext;
  config: Config;
  parent?: Note;
}

export class Note extends TreeItem {
  public static dirName(name: string) {
    if (!validFilename(name)) {
      // TODO: show error to user?
      throw new Error(`The name "${name}" is not a valid note name!`);
    }

    return `${name}.md.d`;
  }

  public static filePathToDirPath(filePath: string) {
    return `${filePath}.d`;
  }

  // NOTE: convention is that:
  //  - every file has a directory
  //  - the file name is `$NAME.md` and directory is `$NAME.md.d`
  public static async create(options: NoteCreateOptions) {
    const { dirPath, config, parent, context } = options;

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
      config,
      parent,
    });
  }

  public name: string;
  public dirPath: string;
  public filePath: string;
  public depth: number;

  public parent?: Note;
  public children: string[];
  public config: Config;

  private context: ExtensionContext;

  private constructor(options: NoteConstructorOptions) {
    const fileName = path.basename(options.dirPath, '.d');
    const filePath = path.join(path.dirname(options.dirPath), fileName);
    const noteName = path.basename(fileName, '.md');

    const configEntry = options.config.sort[options.dirPath];

    // Sort children according to config entry.
    const fsChildren = new Set(options.children);
    const sortedChildren = (configEntry?.children || [])
      .filter(p => fsChildren.delete(p))
      .concat(...fsChildren.values());

    super(
      noteName,
      sortedChildren.length
        ? configEntry?.open || false
          ? TreeItemCollapsibleState.Expanded
          : TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None,
    );

    this.context = options.context;
    this.name = noteName;
    this.dirPath = options.dirPath;
    this.filePath = filePath;
    this.config = options.config;
    this.children = sortedChildren;
    this.parent = options.parent;

    const parentDepth = options.parent?.depth || 0;
    this.depth = parentDepth + 1;
  }

  async newNote(type: NewNoteType, name: string) {
    const makeDirPath = (dir: string) => path.join(dir, Note.dirName(name));

    let dirPath;
    switch (type) {
      case NewNoteType.Child:
        dirPath = makeDirPath(this.dirPath);
        // Insert as last child in parent.
        this.children.push(dirPath);
        this.updateConfigEntry();
        break;
      case NewNoteType.Sibling:
        dirPath = makeDirPath(path.dirname(this.dirPath));
        // Insert after this note as sibling.
        if (this.parent) {
          const thisIndex = this.parent.children.findIndex(p => p === this.dirPath);
          if (thisIndex === -1) {
            throw new Error('Failed to find note in parent!');
          }

          this.parent.children.splice(thisIndex + 1, 0, dirPath);
          this.parent.updateConfigEntry();
        }
        break;
    }

    return await Note.create({
      dirPath,
      parent: this,
      context: this.context,
      config: this.config,
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
      // TODO: color preview icon too
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

    this.collapsibleState = TreeItemCollapsibleState.Expanded;
    vscode.commands.executeCommand(COMMAND_TREEVIEW_REFRESH);
  }

  async childrenAsNotes(): Promise<Note[]> {
    return await Promise.all(
      this.children.map(async dirPath => {
        return await Note.create({
          dirPath,
          config: this.config,
          parent: this,
          context: this.context,
        });
      }),
    );
  }

  async moveTo(newParent: Note, moveOptions?: { before: Note }) {
    const name = this.name;

    // Simply rename the note if the destination already existed.
    async function findDestination() {
      let newName;
      let newDirPath;
      let newFilePath;
      let checks;
      let n = 0;
      do {
        newName = `${name}${n ? `-${n}` : ''}`;
        newDirPath = path.join(newParent.dirPath, `${newName}.md.d`);
        newFilePath = path.join(newParent.dirPath, `${newName}.md`);
        checks = await Promise.all([await pathExists(newDirPath), await pathExists(newFilePath)]);
        n++;
      } while (checks.some(Boolean));

      return { newDirPath, newFilePath, newName };
    }

    const { newDirPath, newFilePath, newName } = await findDestination();
    if (newName !== name) {
      vscode.window.showInformationMessage(
        `The note was renamed to "${newName}" because "${name}" already existed in the parent`,
      );
    }

    // FIXME: when moving in this seems to cop rather than rename?
    await vscode.workspace.fs.rename(Uri.parse(this.dirPath), Uri.parse(newDirPath));
    await vscode.workspace.fs.rename(Uri.parse(this.filePath), Uri.parse(newFilePath));

    // Place in the correct spot.
    if (moveOptions) {
      const index = newParent.children.findIndex(p => p === moveOptions.before.dirPath);
      if (index === -1) {
        throw new Error('Failed to find before note in newParent!');
      }

      newParent.children.splice(index, 0, newDirPath);
    } else {
      newParent.children.push(newDirPath);
    }
    newParent.updateConfigEntry();

    await vscode.commands.executeCommand(COMMAND_TREEVIEW_REFRESH);
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

  // TODO: when do _save_ config to disk?
  updateConfigEntry() {
    const { config, dirPath, collapsibleState, children } = this;
    if (!config.sort[dirPath]) {
      config.sort[dirPath] = {
        open: collapsibleState === TreeItemCollapsibleState.Expanded,
        children: [],
      };
    }

    config.sort[dirPath]!.children = children.slice();
  }
}
