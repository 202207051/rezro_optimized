import "dotenv/config";
import jwt from "jsonwebtoken";
import { io } from "socket.io-client";
import { pool } from "./src/config/dbConfig.js";

const PORT = process.env.PORT || 8080;
const SERVER_URL = process.env.SOCKET_SERVER_URL || `http://127.0.0.1:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET;

const TEST_USER = Object.freeze({
  id: "user_player_1",
  username: "player1",
  displayName: "플레이어1",
});

const SCENARIOS = Object.freeze([
  { number: 1, roomId: 101, expectedSuccess: false, expectedCode: "GAME_IN_PROGRESS" },
  { number: 2, roomId: 102, expectedSuccess: false, expectedCode: "ROOM_FULL" },
  { number: 3, roomId: 103, expectedSuccess: true, expectedCode: "JOINED" },
]);

async function main() {
  let socket = null;
  try {
    if (!JWT_SECRET) throw new Error(".env 파일에 JWT_SECRET이 설정되어 있지 않습니다.");

    await pool.query(
      "DELETE FROM room_participants WHERE room_id = ? AND user_id = ? AND is_host = 0",
      [103, TEST_USER.id]
    );

    const token = jwt.sign(TEST_USER, JWT_SECRET, { expiresIn: "10m" });

    socket = io(SERVER_URL, {
      transports: ["websocket"],
      reconnection: false,
      auth: { token: `Bearer ${token}` },
    });

    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`소켓 연결 실패 (${SERVER_URL}). 백엔드 서버가 구동 중인지 확인하세요.`)),
        5000
      );
      socket.once("connect", () => {
        clearTimeout(timer);
        resolve();
      });
      socket.once("connect_error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    for (const scenario of SCENARIOS) {
      const response = await new Promise((resolve) =>
        socket.emit("join_room", { roomId: scenario.roomId }, resolve)
      );
      if (
        response.success !== scenario.expectedSuccess ||
        response.code !== scenario.expectedCode
      ) {
        throw new Error(`시나리오 ${scenario.number} 실패: ${JSON.stringify(response)}`);
      }
      console.log(`✅ 시나리오 ${scenario.number} 테스트 통과`);
    }
  } catch (error) {
    console.error("테스트 실패:", error.message);
    process.exitCode = 1;
  } finally {
    if (socket) socket.disconnect();
    await pool.end();
  }
}

main();