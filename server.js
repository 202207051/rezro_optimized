// server.js
import app from './app.js'; // app.js가 Express 인스턴스라고 가정
import { dockerService } from './docker/docker/dockerService.js';

const PORT = process.env.PORT || 3000;
let shuttingDown = false;

// HTTP 서버 시작
const server = app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`🚀 게임 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`===========================================`);
});

// 프로세스 종료(Graceful Shutdown) 처리
async function gracefulShutdown(reason) {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\n⚠️ 서버 종료 처리 중... (${reason})`);

    // 1. HTTP 요청 수신 중단
    server.close(async () => {
        console.log("HTTP 서버 연결 종료 완료");

        try {
            // 2. 도커 컴파일러 자원 정리
            await dockerService.clearWorkspace();
            await dockerService.stopCompilerContainer();
            console.log("✅ 샌드박스 정리 및 도커 컴파일러 컨테이너 안전 종료 완료");
        } catch (error) {
            console.error("❌ 자원 정리 중 오류 발생:", error.message);
        } finally {
            process.exit(0);
        }
    });

    // 만약 10초 내로 자원 정리가 안 되면 강제 종료
    setTimeout(() => {
        console.error("⏱️ 종료 시간 초과로 인해 강제 종료합니다.");
        process.exit(1);
    }, 10000);
}

// 종료 시그널 수신
process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
