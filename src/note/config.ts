import fs from 'fs-extra';
import path from 'path';

export const CONFIG_FILE_NAME = 'vscode-tree.json';
const INITIAL_CONFIG = {
  sort: {},
};

// NOTE: must be JSON-serialisable.
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

export async function saveConfig(rootPath: string, config: Config) {
  const configEntryPath = path.join(rootPath, CONFIG_FILE_NAME);
  return await fs.outputJson(configEntryPath, config);
}
