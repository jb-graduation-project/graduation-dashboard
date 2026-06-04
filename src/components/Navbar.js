import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ state에서 classroomId 꺼내기
  const classroomId = useMemo(() => {
    return (
      location.state?.classroomId ||
      location.state?.roomId ||
      location.state?.classroomID ||
      localStorage.getItem("classroomId") ||
      null
    );
  }, [location.state]);

  useEffect(() => {
    if (classroomId) {
      localStorage.setItem("classroomId", classroomId);
    }
  }, [classroomId]);

  // ✅ 로그인 저장값에서 userId 꺼내기 (삭제 API의 query로 필요)
  const userId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");

      return (
        user?.userId ||
        user?.id ||
        user?.teacherId ||
        user?.user_id ||
        user?.data?.userId ||
        user?.data?.id ||
        localStorage.getItem("userId") ||
        null
      );
    } catch {
      return localStorage.getItem("userId") || null;
    }
  }, []);

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const [deleting, setDeleting] = useState(false);

  const navItems = [
    { path: "/school-channel", label: "메인화면" },
    { path: "/school-setting", label: "학교 환경 설정" },
    { path: "/scenario", label: "시나리오 관리" },
    { path: "/monitoring", label: "실시간 모니터링" },
    { path: "/analysis", label: "분석 결과" },
    { path: "/manual", label: "사용 메뉴얼" },
  ];

  console.log("🔥 SchoolSetting location.state:", location.state);

  // ✅ 방 삭제 (Swagger: DELETE /api/rooms/{classroomId}?userId=...)
  const handleDeleteRoom = async () => {
    if (!classroomId) {
      alert(
        "교실을 먼저 선택하고 들어와야 삭제할 수 있습니다. (classroomId 없음)",
      );
      return;
    }
    if (!userId) {
      alert("로그인 정보(userId)가 없습니다. 로그인 상태를 확인해 주세요.");
      return;
    }

    const ok = window.confirm(
      "정말 이 교실(방)을 삭제할까요? 이 작업은 되돌릴 수 없습니다.",
    );
    if (!ok) return;

    try {
      setDeleting(true);

      const res = await axios.delete(`${API_BASE}/api/rooms/${classroomId}`, {
        headers: { ...authHeaders },
        params: { userId }, // ✅ 핵심: query로 userId 추가
        timeout: 10000,
        validateStatus: () => true,
      });

      console.log("방 삭제 응답 status =", res.status);
      console.log("방 삭제 응답 data =", res.data);

      if (!(res.status >= 200 && res.status < 300)) {
        alert(
          `방 삭제 실패 (${res.status})\n\n` +
            (typeof res.data === "string"
              ? res.data
              : JSON.stringify(res.data, null, 2)),
        );
        return;
      }

      alert("✅ 방이 삭제되었습니다.");

      // ✅ 삭제된 방과 관련된 저장 정보 제거
      localStorage.removeItem("classroomId");
      localStorage.removeItem("roomContext");
      localStorage.removeItem("gameContext");
      localStorage.removeItem("lastResultContext");

      navigate("/room-list", {
        replace: true,
        state: {
          schoolId,
          schoolName,
          schoolCode,
        },
      });
    } catch (e) {
      console.error(e);
      alert("서버 오류로 방 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };
  const schoolId = useMemo(() => {
    return (
      location.state?.schoolId ||
      location.state?.channelId ||
      location.state?.id ||
      null
    );
  }, [location.state]);

  const schoolName = location.state?.schoolName || null;
  const schoolCode = location.state?.schoolCode || null;

  const getLatestScenarioId = () => {
    const safeParse = (key) => {
      try {
        return JSON.parse(localStorage.getItem(key) || "{}");
      } catch {
        return {};
      }
    };

    const gameContext = safeParse("gameContext");
    const lastResultContext = safeParse("lastResultContext");
    const roomContext = safeParse("roomContext");

    const scenarioId =
      location.state?.scenarioId ||
      location.state?.activeScenarioId ||
      gameContext?.scenarioId ||
      gameContext?.activeScenarioId ||
      lastResultContext?.scenarioId ||
      lastResultContext?.activeScenarioId ||
      roomContext?.scenarioId ||
      roomContext?.activeScenarioId ||
      localStorage.getItem("activeScenarioId") ||
      localStorage.getItem("scenarioId") ||
      null;

    console.log("[Navbar] 최신 분석 결과 scenarioId =", scenarioId);

    return scenarioId;
  };
  const handleNavigate = (item) => {
    if (item.path === "/analysis") {
      // ✅ 버튼을 누르는 시점에 localStorage의 최신 값을 다시 확인
      const latestScenarioId = getLatestScenarioId();

      if (!latestScenarioId) {
        alert(
          "조회할 분석 결과가 없습니다.\n훈련을 먼저 시작하고 종료해 주세요.",
        );
        return;
      }

      navigate(`/analysis/${latestScenarioId}`, {
        state: {
          ...location.state,
          classroomId,
          schoolId,
          schoolName,
          schoolCode,
          scenarioId: latestScenarioId,
          activeScenarioId: latestScenarioId,
          thumbnailImage: location.state?.thumbnailImage || null,
        },
      });

      return;
    }

    navigate(item.path, {
      state: {
        ...location.state,
        classroomId,
        schoolId,
        schoolName,
        schoolCode,
        thumbnailImage: location.state?.thumbnailImage || null,
      },
    });
  };

  return (
    <nav className="relative w-full h-20 flex items-center px-4 overflow-visible">
      {/* 가운데 정렬될 메뉴들 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2 whitespace-nowrap">
        {navItems.map((item) => {
          const isActive =
            item.path === "/analysis"
              ? location.pathname.startsWith("/analysis/")
              : location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item)}
              className={`px-4 py-2 rounded-full border border-green-600 font-semibold transition
                ${
                  isActive
                    ? "bg-green-600 text-white"
                    : "bg-white text-black hover:bg-green-600 hover:text-white"
                }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* 오른쪽 끝: 방 삭제 버튼 */}
      <button
        onClick={handleDeleteRoom}
        disabled={deleting}
        className="absolute right-4 px-4 py-2 rounded-full border border-red-600 font-semibold
               bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
      >
        {deleting ? "삭제 중..." : "방 삭제"}
      </button>
    </nav>
  );
}

export default Navbar;
