import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API_BASE = "https://disasterar.onenyang.shop";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ state에서 classroomId 꺼내기
  const classroomId = useMemo(() => {
    return (
      location.state?.classroomId ||
      location.state?.roomId ||
      location.state?.classroomID ||
      null
    );
  }, [location.state]);

  // ✅ 로그인 저장값에서 userId 꺼내기 (삭제 API의 query로 필요)
  const userId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      return user?.userId || user?.id || null;
    } catch {
      return null;
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
  ];

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
      navigate("/room-list", { state: { ...location.state } });
    } catch (e) {
      console.error(e);
      alert("서버 오류로 방 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <nav className="relative w-full h-20 flex items-center px-4 overflow-visible">
      {/* 가운데 정렬될 메뉴들 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex space-x-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path, { state: location.state })}
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
