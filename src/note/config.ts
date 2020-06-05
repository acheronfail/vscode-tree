import fs from 'fs-extra';
import path from 'path';

export const CONFIG_FILE_NAME = 'vscode-tree.json';
const INITIAL_CONFIG = {
  sort: {},
};

export interface Entry {
  open: boolean;
  children: string[];
}

export interface Config {
  sort: Record<string, Entry | undefined>;
}

export async function readConfig(rootPath: string): Promise<Config> {
  const configEntryPath = path.join(rootPath, CONFIG_FILE_NAME);
  if (!(await fs.pathExists(configEntryPath))) {
    await fs.outputJson(configEntryPath, INITIAL_CONFIG);
  }

  return await fs.readJson(configEntryPath);
}
