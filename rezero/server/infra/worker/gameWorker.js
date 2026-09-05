// src/worker/gameWorker.js

import fs from "fs/promises";
import path from "path";

class CompileResultDto {
  constructor({ success, executionTime, output, error, stdout, stderr, score }) {
    this.success = success;
    this.executionTime = executionTime;
    this.output = output;
    this.error = error;
    this.stdout = stdout || output;
    this.stderr = stderr || error;
    this.score = score;
  }

  toJSON() {
    return {
      success: this.success,
      executionTime: this.executionTime,
      output: this.output,
      error: this.error,
      stdout: this.stdout,
      stderr: this.stderr,
      score: this.score,
    };
  }
}

class GameWorker {
  async processSubmission(submission) {
    const submissionId = submission.submissionId;
    const userId = submission.userId;
    const roomId = submission.roomId;
    const language = (submission.language || "python").toLowerCase();
    const code = submission.code;

    console.log(
      "[GameWorker] Processing submission ID: " +
        submissionId +
        " for language: " +
        language +
        " (User: " +
        userId +
        ", Room: " +
        roomId +
        ")",
    );

    const startTime = Date.now();
    const sandboxDir = path.resolve(process.cwd(), "sandbox");

    const safeUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, "");

    let ext = "py";
    if (language === "java") ext = "java";
    else if (language === "cpp" || language === "c++") ext = "cpp";
    else if (language === "js" || language === "javascript") ext = "js";

    const filePath = path.join(sandboxDir, safeUserId + "." + ext);

    try {
      await fs.mkdir(sandboxDir, { recursive: true });
      await fs.writeFile(filePath, code, "utf-8");

      const executionTime = Date.now() - startTime;

      return new CompileResultDto({
        success: true,
        executionTime: executionTime,
        output: "Hello Battle " + userId,
        error: null,
        stdout: "Hello Battle " + userId,
        stderr: null,
        score: 100,
      }).toJSON();
    } catch (error) {
      console.error(
        "[GameWorker] Processing error for submission ID " +
          submissionId +
          ": " +
          error.message,
      );

      const executionTime = Date.now() - startTime;

      return new CompileResultDto({
        success: false,
        executionTime: executionTime,
        output: "",
        error: error.message,
        stdout: "",
        stderr: error.message,
        score: 0,
      }).toJSON();
    }
  }
}

export const gameWorker = new GameWorker();
