import vscode, { TreeItem, TreeItemCollapsibleState, Uri, Command, ThemeIcon, ExtensionContext } from 'vscode';
import path from 'path';
import fs, { pathExists } from 'fs-extra';
import { Config } from './config';
import validFilename from 'valid-filename';
import { NewNoteType, WorkspaceStateKey, ICONS, CMD_TREEVIEW_REFRESH, CommandContext, CMD_OPEN_NOTE } from '../types';

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
      throw new Error(`The name "${name}" is not a valid note name!`);
    }

    return `${name}.md.d`;
  }

  public static filePathToDirPath(filePath: string) {
    return `${filePath}.d`;
  }

  public static dirPathToFilePath(dirPath: string) {
    // Trim off the `.d`.
    return dirPath.slice(0, -2);
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
      command: CMD_OPEN_NOTE,
      title: 'Open Note',
      arguments: [this],
    };
  }

  get id(): string {
    return this.filePath;
  }

  get iconPath(): ThemeIcon {
    const activeNoteFilePath = this.context.workspaceState.get<string>(WorkspaceStateKey.ActiveNoteFilePath);
    const iconName = activeNoteFilePath === this.filePath ? ICONS.EDIT_NAME : ICONS.NOTE_NAME;
    const colorIndex = this.depth % ICONS.COLOR_DEPTH;
    const iconKey = `${iconName}_${colorIndex}` as keyof typeof ICONS;
    return ICONS[iconKey];
  }

  get tooltip(): string {
    return this.filePath;
  }

  async edit(context: CommandContext) {
    // Create note file if it doesn't exist.
    await fs.ensureFile(this.filePath);

    const filePathUri = Uri.parse(this.filePath);
    await vscode.window.showTextDocument(filePathUri);

    await context.noteTreeView.reveal(this, {
      expand: true,
      focus: false,
      select: true,
    });
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

  async rename(name: string) {
    if (!this.parent) {
      throw new Error('Failed to find note parent!');
    }

    const newDirName = Note.dirName(name);
    const newDirPath = path.join(this.parent.dirPath, newDirName);
    const newFilePath = Note.dirPathToFilePath(newDirPath);

    const checks = await Promise.all([pathExists(newDirPath), pathExists(newFilePath)]);
    if (checks.some(Boolean)) {
      throw new Error(`A note with the name "${name}" already exists under "${this.parent.name}"!`);
    }

    await this._rename(newDirPath, newFilePath);

    // Make sure renamed entry is in the same spot in the parent.
    this.parent.children = this.parent.children.map(dirPath => {
      if (dirPath === this.dirPath) {
        return newDirPath;
      }

      return dirPath;
    });

    await vscode.commands.executeCommand(CMD_TREEVIEW_REFRESH);
  }

  private async _rename(newDirPath: string, newFilePath: string) {
    // FIXME: when moving in this seems to copy rather than rename?
    await Promise.all([
      vscode.workspace.fs.rename(Uri.parse(this.dirPath), Uri.parse(newDirPath)),
      vscode.workspace.fs.rename(Uri.parse(this.filePath), Uri.parse(newFilePath)),
    ]);
  }

  private async _copy(newDirPath: string, newFilePath: string) {
    await Promise.all([
      vscode.workspace.fs.copy(Uri.parse(this.dirPath), Uri.parse(newDirPath)),
      vscode.workspace.fs.copy(Uri.parse(this.filePath), Uri.parse(newFilePath)),
    ]);
  }

  private async _moveToTrash() {
    const options = { recursive: true, useTrash: true };
    await Promise.all([
      vscode.workspace.fs.delete(Uri.parse(this.filePath), options),
      vscode.workspace.fs.delete(Uri.parse(this.dirPath), options),
    ]);
  }

  async duplicate(context: CommandContext) {
    if (!this.parent) {
      throw new Error('Failed to find note parent!');
    }

    const { newDirPath, newFilePath, newName } = await this._findDestination(this.parent.dirPath);
    await this._copy(newDirPath, newFilePath);

    vscode.window.showInformationMessage(`Created duplicated note "${newName}"`);

    // Order duplicated note.
    const thisIndex = this.parent.children.findIndex(dirPath => dirPath === this.dirPath);
    if (thisIndex === -1) {
      throw new Error('Failed to find note in parent!');
    }

    this.parent.children.splice(thisIndex + 1, 0, newDirPath);

    // Open duplicated note.
    const siblings = await this.parent.childrenAsNotes();
    const duplicatedNote = siblings.find(n => n.dirPath === newDirPath);
    if (!duplicatedNote) {
      throw new Error('Failed to find duplicated note!');
    }

    await duplicatedNote.edit(context);
  }

  private async _findDestination(dirPath: string) {
    let newName;
    let newDirPath;
    let newFilePath;
    let checks;
    let n = 0;
    do {
      newName = `${this.name}${n ? `-${n}` : ''}`;
      newDirPath = path.join(dirPath, Note.dirName(newName));
      newFilePath = Note.dirPathToFilePath(newDirPath);
      checks = await Promise.all([pathExists(newDirPath), pathExists(newFilePath)]);
      n++;
    } while (checks.some(Boolean));

    return { newDirPath, newFilePath, newName };
  }

  async moveTo(newParent: Note, moveOptions?: { before: Note }) {
    // Simply rename the note if the destination already existed.
    const { newDirPath, newFilePath, newName } = await this._findDestination(newParent.dirPath);

    await this._rename(newDirPath, newFilePath);
    if (newName !== this.name) {
      vscode.window.showInformationMessage(
        `The note was renamed to "${newName}" because "${this.name}" already existed in the parent`,
      );
    }

    // Sort in the correct spot in the parent.
    if (moveOptions) {
      const index = newParent.children.findIndex(dirPath => dirPath === moveOptions.before.dirPath);
      if (index === -1) {
        throw new Error('Failed to find before note in newParent!');
      }

      newParent.children.splice(index, 0, newDirPath);
    } else {
      newParent.children.push(newDirPath);
    }
    newParent.updateConfigEntry();

    await vscode.commands.executeCommand(CMD_TREEVIEW_REFRESH);
  }

  // TODO: advanced delete behaviour?
  //  move children into parent, etc
  async delete() {
    // Move the note and its folder to the trash.
    await this._moveToTrash();

    // Close the editor.
    const fileUri = Uri.parse(this.filePath);
    for (const editor of vscode.window.visibleTextEditors) {
      if (editor.document.uri.fsPath === fileUri.fsPath) {
        // Annoyingly we can't just close an editor, we must first focus it and then execute a command.
        await vscode.window.showTextDocument(fileUri, { preserveFocus: false, preview: true });
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      }
    }

    if (this.parent) {
      this.parent.children = this.parent.children.filter(dirPath => dirPath !== this.dirPath);
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
