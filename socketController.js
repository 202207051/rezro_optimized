import { dockerService } from "../docker/docker/dockerService.js";
import { CodeRequestDto } from "../docker/dto/codeRequestDto.js";
import { fileService } from "../docker/service/file/fileService.js";
import { validateJoinRoom, validateSendMessage } from "./socketDto.js";
import {
  getRecentMessages,
  getRoomReadyState,
  joinRoomParticipant,
  saveAndFormatMessage,
  toggleParticipantReady,
} from "./socketService.js";

export function registerSocketHandlers(io, socket) {
  const respond = (callback, data) => {
    if (typeof callback === "function") callback(data);
    return data;
  };

  const getSocketRoomName = (roomId) => `room:${roomId}`;

  socket.on("join_room", async (data, callback) => {
    try {
      const { roomId } = validateJoinRoom(data);
      const joinResult = await joinRoomParticipant({ roomId, user: socket.user });

      if (!joinResult.success) return respond(callback, joinResult);

      const socketRoomName = getSocketRoomName(roomId);
      await socket.join(socketRoomName);

      const recentMessages = await getRecentMessages(roomId);
      const readyState = await getRoomReadyState(roomId);

      socket.to(socketRoomName).emit("user_joined", {
        roomId,
        message: `${socket.user.displayName} 님이 입장하셨습니다.`,
        user: socket.user,
        participant: joinResult.participant,
        readyState,
      });

      io.to(socketRoomName).emit("room_ready_state_changed", readyState);

      return respond(callback, { ...joinResult, recentMessages, readyState });
    } catch (error) {
      return respond(callback, {
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
  });

  socket.on("toggle_ready", async (data, callback) => {
    try {
      const { roomId } = validateJoinRoom(data);
      const { participants, isGameStartable } = await toggleParticipantReady(
        roomId,
        socket.user.id
      );
      const socketRoomName = getSocketRoomName(roomId);

      io.to(socketRoomName).emit("room_ready_state_changed", participants);

      if (isGameStartable) {
        io.to(socketRoomName).emit("game_started", { roomId, status: "INGAME" });
      }

      return respond(callback, { success: true, isGameStartable });
    } catch (error) {
      return respond(callback, { success: false, message: error.message });
    }
  });

  // 소켓 기반 코드 컴파일 및 실행 핸들러
  socket.on("compile_code", async (data, callback) => {
    const { language, code, problemId = 0 } = data || {};
    const userId = socket.user.id;

    const codeDto = new CodeRequestDto({ userId, problemId, code, language });
    if (!codeDto.isValid()) {
      return respond(callback, { success: false, message: "유효하지 않은 요청입니다." });
    }

    try {
      await fileService.saveSourceCode(userId, language, codeDto.code);
      const compileResult = await dockerService.compileCode(userId, language);

      if (!compileResult.success) {
        return respond(callback, {
          success: false,
          stage: "compile",
          error: compileResult.stderr,
        });
      }

      const runResult = await dockerService.runCompiledBinary(userId);
      return respond(callback, {
        success: runResult.success,
        stage: "execution",
        stdout: runResult.stdout?.trim() || "(출력 없음)",
        stderr: runResult.stderr || "",
      });
    } catch (err) {
      return respond(callback, { success: false, message: err.message });
    } finally {
      await dockerService.clearSandbox(userId, language).catch(() => {});
    }
  });

  socket.on("send_message", async (data, callback) => {
    try {
      const { roomId, message } = validateSendMessage(data);
      const chatMessage = await saveAndFormatMessage({
        roomId,
        sender: socket.user,
        message,
      });

      io.to(getSocketRoomName(roomId)).emit("receive_message", chatMessage);
      return respond(callback, { success: true, message: chatMessage });
    } catch (error) {
      return respond(callback, { success: false, message: error.message });
    }
  });
}