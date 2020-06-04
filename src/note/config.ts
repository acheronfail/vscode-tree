export const CONFIG_FILE_NAME = 'vscode-tree.json';

export interface ConfigEntry {
  name: string;
  path: string;
  open: boolean;
  children: ConfigEntry[];
}
