import { pool } from "../config/dbConfig.js";

export const JOIN_ROOM_RESULT = {
  JOINED: "JOINED",
  ROOM_NOT_FOUND: "ROOM_NOT_FOUND",
  GAME_IN_PROGRESS: "GAME_IN_PROGRESS",
  ROOM_FULL: "ROOM_FULL",
};

export async function joinRoomParticipant({ roomId, user }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. 방 정보 및 max_players 조회 (SQL Injection 방지)
    const [roomRows] = await connection.query(
      "SELECT id, status, language, max_players FROM rooms WHERE id = ? FOR UPDATE",
      [roomId]
    );

    if (!roomRows.length) {
      await connection.rollback();
      return {
        success: false,
        code: JOIN_ROOM_RESULT.ROOM_NOT_FOUND,
        message: "존재하지 않는 방입니다.",
      };
    }

    const room = roomRows[0];

    // 방 상태 검증: STARTED 또는 INGAME 상태 시 입장 불가
    if (["STARTED", "INGAME"].includes(room.status)) {
      await connection.rollback();
      return {
        success: false,
        code: JOIN_ROOM_RESULT.GAME_IN_PROGRESS,
        message: "이미 게임이 진행 중인 방입니다.",
      };
    }

    // 2. 현재 방 참가자 수 조회
    const [participants] = await connection.query(
      "SELECT * FROM room_participants WHERE room_id = ? AND left_at IS NULL",
      [roomId]
    );

    const existing = participants.find((p) => p.user_id === user.id);
    if (existing) {
      await connection.commit();
      return { success: true, code: JOIN_ROOM_RESULT.JOINED, participant: existing };
    }

    // 최대 인원수(max_players) 도달 시 입장 불가
    if (participants.length >= room.max_players) {
      await connection.rollback();
      return {
        success: false,
        code: JOIN_ROOM_RESULT.ROOM_FULL,
        message: "방이 가득 찼습니다.",
      };
    }

    // 빈 슬롯 계산 후 참가자 추가
    const usedSlots = new Set(participants.map((p) => p.slot_index));
    let slotIndex = 0;
    while (usedSlots.has(slotIndex)) slotIndex++;

    await connection.query(
      `INSERT INTO room_participants (room_id, user_id, slot_index, is_host, is_ready, language, character, status, joined_at)
       VALUES (?, ?, ?, 0, 0, ?, 'hero_a', 'WAITING', NOW())`,
      [roomId, user.id, slotIndex, room.language || "javascript"]
    );

    const [newParticipant] = await connection.query(
      "SELECT * FROM room_participants WHERE room_id = ? AND user_id = ? AND left_at IS NULL",
      [roomId, user.id]
    );

    await connection.commit();
    return {
      success: true,
      code: JOIN_ROOM_RESULT.JOINED,
      participant: newParticipant[0],
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// 참가자 Ready 토글 및 전원 Ready 시 게임 시작 처리
export async function toggleParticipantReady(roomId, userId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      "UPDATE room_participants SET is_ready = NOT is_ready WHERE room_id = ? AND user_id = ? AND left_at IS NULL",
      [roomId, userId]
    );

    const [participants] = await connection.query(
      `SELECT rp.*, u.display_name, u.username 
       FROM room_participants rp 
       JOIN users u ON rp.user_id = u.id 
       WHERE rp.room_id = ? AND rp.left_at IS NULL 
       ORDER BY rp.slot_index ASC`,
      [roomId]
    );

    // 최소 2명 이상 & 방장을 제외한 모든 참가자가 준비 완료(is_ready=1) 되었는지 검사
    const isAllReady =
      participants.length >= 2 &&
      participants.every((p) => p.is_ready === 1 || p.is_host === 1);

    if (isAllReady) {
      await connection.query(
        "UPDATE rooms SET status = 'INGAME' WHERE id = ?",
        [roomId]
      );
    }

    await connection.commit();
    return { participants, isGameStartable: isAllReady };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getRoomReadyState(roomId) {
  const [rows] = await pool.query(
    `SELECT rp.*, u.display_name, u.username 
     FROM room_participants rp 
     JOIN users u ON rp.user_id = u.id 
     WHERE rp.room_id = ? AND rp.left_at IS NULL 
     ORDER BY rp.slot_index ASC`,
    [roomId]
  );
  return rows;
}

export async function getRecentMessages() { return []; }

export async function saveAndFormatMessage({ roomId, sender, message }) {
  return { roomId, sender, message, createdAt: new Date() };
}