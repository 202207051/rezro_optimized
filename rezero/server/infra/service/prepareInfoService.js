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

class PrepareInfoService {
  async getGameStartPayload(roomId, io) {
    // 구현 코드 내용
  }
}

export const prepareInfoService = new PrepareInfoService();
