import path from "path";
import dotenv from "dotenv";

dotenv.config();

const currentDirectory = import.meta.dirname;

const projectRoot = path.resolve(currentDirectory, "../../..");

const backendDirectory = path.resolve(currentDirectory, "../..");

let sharedDirectory;
if (process.env.SHARED_DIR) {
  sharedDirectory = path.resolve(process.env.SHARED_DIR);
} else {
  sharedDirectory = path.resolve(projectRoot, "shared/fileshare");
}

export const ROOM_CONFIG = {
  containerName: "build_compiler_sandbox",
  baseImage: "gameroom-base-image",
  sandboxPath: path.resolve(sharedDirectory, "sandbox"),
  resultboxPath: path.resolve(sharedDirectory, "resultbox"),

  build: {
    contextPath: projectRoot,
    dockerfilePath: path.resolve(
      backendDirectory,
      "infra/dockerimage/game.Dockerfile",
    ),
    imageTag: "gameroom-base-image:latest",
    buildOptions: ["--no-cache"],
  },

  languages: {
    c: { compiler: "gcc", ext: "c" },
    cpp: { compiler: "g++", ext: "cpp" },
    python: { compiler: "python3", ext: "py" },
    py: { compiler: "python3", ext: "py" },
    java: { compiler: "javac", ext: "java" },
    html: { compiler: "htmlhint", ext: "html" },
    css: { compiler: "stylelint", ext: "css" },
  },
};
