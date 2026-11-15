/** SDK v1 preview. No file, network, process, hardware or sleep APIs. */
type Capability = 'ui.theme' | 'ui.panel' | 'timer.read' | 'timer.control' | 'system.read';
type Settings = Readonly<Record<string, string | number | boolean>>;
interface TimerSnapshot {
  state: 'idle' | 'running' | 'paused' | 'finished';
  remaining: number; duration: number; session: string; revision: number;
  startedByPlugin: boolean;
}
interface Context {
  settings: Settings;
  /** Present only with timer.read. Revisions in JS never authorize a command. */
  timer?: TimerSnapshot;
  /** Present only with system.read. Snapshot values, no subscription or controls. */
  system?: {cpu: number; memory: number};
}
interface TimerFinished {type: 'timer.finished'; startedByPlugin: boolean; session: string; revision: number}
interface ThemeTokens {accent?: string; background?: string; foreground?: string; secondary?: string; surface?: string; line?: string}
interface Theme {light?: ThemeTokens; dark?: ThemeTokens; fontScale?: number}
type PanelNode =
  | {type: 'text'; text: string; style?: 'title' | 'body' | 'caption'}
  | {type: 'button'; title: string; action: string}
  | {type: 'divider' | 'spacer'}
  | {type: 'row' | 'column'; children: PanelNode[]}
  | {type: 'module'; module: string};
interface Panel {mode: 'replace' | 'append'; width?: number; nodes: PanelNode[]}
type Command = {type: 'timer.start'; seconds: number} | {type: 'timer.stop'};
interface Contributions {
  /** Omitted preserves the previous overlay; null clears it. */
  theme?: Theme | null;
  /** Omitted preserves the previous panel; null clears it. */
  panel?: Panel | null;
  /** One-shot commands, subject to granted permissions and trusted timer revision. */
  commands?: Command[];
}
interface Plugin {
  activate?(context: Context): Contributions | void;
  onEvent?(event: TimerFinished, context: Context): Contributions | void;
  onAction?(action: string, context: Context): Contributions | void;
}
declare function definePlugin(plugin: Plugin): void;
