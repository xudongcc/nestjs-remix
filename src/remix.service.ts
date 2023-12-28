import path from "node:path";

import { Inject, Injectable } from "@nestjs/common";
import { createRequestHandler, RequestHandler } from "@remix-run/express";
import { broadcastDevReady, ServerBuild } from "@remix-run/node";
import chokidar from "chokidar";

import { MODULE_OPTIONS_TOKEN } from "./remix.module-definition";
import { ViewModuleOptions } from "./remix-module-options.interface";

function requireServerBuild(buildPath: string): ServerBuild {
  for (const key in require.cache) {
    if (key.startsWith(buildPath)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete require.cache[key];
    }
  }

  return require(buildPath);
}

@Injectable()
export class RemixService {
  private readonly serverBuildPath: string;
  private readonly serverBuildVersionPath: string;

  private initialServerBuild: ServerBuild;

  public readonly requestHandler: RequestHandler;

  constructor(
    @Inject(MODULE_OPTIONS_TOKEN) private readonly options: ViewModuleOptions
  ) {
    const serverBuildPath =
      options.serverBuildPath ?? path.join(process.cwd(), "build");
    this.serverBuildPath = path.join(serverBuildPath, "index.js");
    this.serverBuildVersionPath = path.join(serverBuildPath, "version.txt");

    this.initialServerBuild = requireServerBuild(this.serverBuildPath);
    this.requestHandler = this.createRequestHandler();
  }

  private createRequestHandler(): RequestHandler {
    if (!((this.options.mode ?? process.env.NODE_ENV) !== "production")) {
      return createRequestHandler({
        build: this.initialServerBuild,
        mode: this.initialServerBuild.mode,
      });
    }

    let serverBuild = this.initialServerBuild;

    const handleServerUpdate = () => {
      // 1. re-import the server build
      serverBuild = requireServerBuild(this.serverBuildPath);
      // 2. tell Remix that this app server is now up-to-date and ready
      broadcastDevReady(serverBuild);
    };

    chokidar
      .watch(this.serverBuildVersionPath, {
        ignoreInitial: true,
      })
      .on("add", handleServerUpdate)
      .on("change", handleServerUpdate);

    return createRequestHandler({
      build: serverBuild,
      mode: "development",
    });
  }
}
