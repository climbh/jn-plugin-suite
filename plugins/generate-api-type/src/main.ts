import { Compiler } from "webpack";
import { Run } from "./run";
import { PluginProps } from "./types";


class GenerateApiTypePlugin {
  private options: PluginProps;
  constructor(props: PluginProps) {
    if(!props.watchDir) {
      throw new Error("watchDir is required");
    }
    this.options = props;
  }

  apply(compiler: Compiler) {
    // webpack hook to run the plugin
    compiler.hooks.run.tap("GenerateApiTypePlugin", () => {
      this.options.outDir = this.options.outDir || compiler.context;
      this.options.autoUsageType = this.options.autoUsageType || true;
      Run(this.options);
    });
  }
}

export default GenerateApiTypePlugin;