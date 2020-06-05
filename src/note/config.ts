import fs from 'fs-extra';
import path from 'path';

export const CONFIG_FILE_NAME = 'vscode-tree.json';

export interface ConfigEntry {
  name: string;
  path: string;
  open: boolean;
  children: ConfigEntry[];
}

export async function readConfigEntry(rootPath: string): Promise<ConfigEntry> {
  const configEntryPath = path.join(rootPath, CONFIG_FILE_NAME);
  if (!(await fs.pathExists(configEntryPath))) {
    await fs.outputJson(configEntryPath, { path: rootPath, children: [] });
  }

  return await fs.readJson(configEntryPath);
}
