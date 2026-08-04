// src/manageroom/manageRoomHandler.js
import manageRoomController from "./manageRoomController.js";

/**
 * GET /rooms 요청 처리 핸들러 (list)
 */
export const list = async (req, res, next) => {
  try {
    const limit = req.roomLimit;
    const result = await manageRoomController.fetchRooms(limit);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// 미구현된 함수들은 라우터 임포트 에러를 방지하기 위해 스텁(Stub) 형태로 미리 export 해둘 수 있습니다.
export const create = async (req, res, next) => {
  /* 방 생성 */
};
export const detail = async (req, res, next) => {
  /* 방 상세 */
};
export const join = async (req, res, next) => {
  /* 방 입장 */
};
export const leave = async (req, res, next) => {
  /* 방 퇴장 */
};
export const remove = async (req, res, next) => {
  /* 방 삭제 */
};
