export interface PluginProps {
  /**
   *  The directory to watch for changes
   */
  watchDir: string;

  /**
   * The directory to output the generated types
   */
  outDir: string;
}
