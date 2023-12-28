import { Module } from "@nestjs/common";

import { ConfigurableModuleClass } from "./remix.module-definition";
import { RemixService } from "./remix.service";

@Module({
  providers: [RemixService],
  exports: [RemixService],
})
export class RemixModule extends ConfigurableModuleClass {}
