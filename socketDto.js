import { socketConfig } from "../config/socketConfig.js";

export function validateJoinRoom(data) {
  if (!data?.roomId) throw new Error("roomId가 필요합니다.");
  const roomId = Number(data.roomId);
  if (!Number.isInteger(roomId) || roomId <= 0) {
    throw new Error("roomId는 1 이상의 정수여야 합니다.");
  }
  return { roomId };
}

export function validateSendMessage(data) {
  const { roomId } = validateJoinRoom(data);
  if (typeof data.message !== "string" || !data.message.trim()) {
    throw new Error("메시지 내용을 입력해 주세요.");
  }
  const message = data.message.trim();
  if (message.length > socketConfig.maxMessageLength) {
    throw new Error(
      `메시지는 최대 ${socketConfig.maxMessageLength}자까지 입력 가능합니다.`
    );
  }
  return { roomId, message };
}