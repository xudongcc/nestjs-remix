import { ConfigurableModuleBuilder } from "@nestjs/common";

import { ViewModuleOptions } from "./remix-module-options.interface.js";

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ViewModuleOptions>().build();
