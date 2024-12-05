import { Compiler } from "webpack";
import { Run } from "./run";
import { PluginProps } from "./types";


class GenerateApiTypePlugin {
  private options: PluginProps;
  constructor(props: PluginProps) {
    this.options = props;
  }

  apply(compiler: Compiler) {
    // webpack hook to run the plugin
    compiler.hooks.run.tap("GenerateApiTypePlugin", () => {
      Run(this.options);
    });
  }
}