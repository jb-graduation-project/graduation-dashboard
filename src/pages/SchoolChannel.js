import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

const API_BASE = "https://disasterar.onenyang.shop";

function SchoolChannel() {
  const location = useLocation();
  const navigate = useNavigate();

  const classroomId =
    location.state?.classroomId || location.state?.roomId || null;

  const userId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      return user?.userId || user?.id || null;
    } catch {
      return null;
    }
  }, []);

  const initialJoinCode = location.state?.joinCode || "UNKNOWN";
  const [joinCode, setJoinCode] = useState(initialJoinCode);

  const [className, setClassName] = useState(
    location.state?.className || location.state?.roomName || "교실",
  );
  const [studentCount, setStudentCount] = useState(
    Number(location.state?.studentCount ?? 0),
  );

  // ✅ 로컬 입력 학생이 아니라 서버 조회 학생 목록
  const [students, setStudents] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editClassName, setEditClassName] = useState(className);
  const [editStudentCount, setEditStudentCount] = useState(
    String(studentCount),
  );

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const showError = (title, resOrErr) => {
    if (resOrErr?.status) {
      const data = resOrErr.data;
      alert(
        `${title} (${resOrErr.status})\n\n${
          typeof data === "string" ? data : JSON.stringify(data, null, 2)
        }`,
      );
      return;
    }
    alert(`${title}\n\n${resOrErr?.message || "알 수 없는 오류"}`);
  };

  // ✅ 학생 목록 조회
  const fetchStudents = useCallback(async () => {
    if (!classroomId) {
      setStudents([]);
      return;
    }

    try {
      setStudentLoading(true);

      const res = await axios.get(
        `${API_BASE}/api/rooms/${classroomId}/students`,
        {
          headers: { ...authHeaders },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      if (!(res.status >= 200 && res.status < 300)) {
        showError("학생 목록 조회 실패", res);
        setStudents([]);
        return;
      }

      const list = Array.isArray(res.data) ? res.data : [];
      setStudents(list);

      // ✅ 학생 수는 서버 목록 기준으로 맞춤
      const activeCount = list.filter((s) => !s.isKicked).length;
      setStudentCount(activeCount);
    } catch (err) {
      setStudents([]);
      showError("학생 목록 조회 중 오류", err);
    } finally {
      setStudentLoading(false);
    }
  }, [classroomId, authHeaders]);

  const handleReissueJoinCode = async () => {
    if (!classroomId) return alert("classroomId가 없습니다.");
    if (!userId) return alert("로그인 정보(userId)가 없습니다.");

    try {
      setLoading(true);

      const res = await axios.put(
        `${API_BASE}/api/rooms/${classroomId}/join-code`,
        null,
        {
          headers: { ...authHeaders },
          params: { userId },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      if (!(res.status >= 200 && res.status < 300)) {
        showError("입장 코드 재발급 실패", res);
        return;
      }

      const data = res.data || {};
      if (data.joinCode) setJoinCode(data.joinCode);
      if (data.className) setClassName(data.className);
      if (typeof data.studentCount === "number") {
        setStudentCount(data.studentCount);
      }

      alert("✅ 입장 코드가 재발급되었습니다.");
    } catch (err) {
      showError("입장 코드 재발급 중 오류", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoom = async () => {
    if (!classroomId) return alert("classroomId가 없습니다.");
    if (!userId) return alert("userId가 없습니다.");

    const nextName = editClassName.trim();
    const nextCount = Number(String(editStudentCount).replace(/[^0-9]/g, ""));

    if (!nextName) return alert("반 이름을 입력해 주세요.");

    const payload = {
      classroomId: String(classroomId),
      userId: String(userId),
      className: nextName,
      studentCount: Number.isFinite(nextCount) ? nextCount : 0,
    };

    try {
      setLoading(true);

      const res = await axios.patch(
        `${API_BASE}/api/rooms/${classroomId}`,
        payload,
        {
          headers: { "Content-Type": "application/json", ...authHeaders },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      if (!(res.status >= 200 && res.status < 300)) {
        showError("방 정보 수정 실패", res);
        return;
      }

      const data = res.data || {};
      setClassName(data.className ?? nextName);
      setStudentCount(
        typeof data.studentCount === "number"
          ? data.studentCount
          : payload.studentCount,
      );
      if (data.joinCode) setJoinCode(data.joinCode);

      setEditOpen(false);
      alert("✅ 방 정보가 수정되었습니다.");
    } catch (err) {
      showError("방 정보 수정 중 오류", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = () => {
    setEditClassName(className);
    setEditStudentCount(String(studentCount));
    setEditOpen(true);
  };

  // ✅ 학생 강퇴
  const handleKickStudent = async (studentId) => {
    if (!classroomId) return alert("classroomId가 없습니다.");
    if (!studentId) return alert("studentId가 없습니다.");

    const ok = window.confirm("이 학생을 강퇴하시겠습니까?");
    if (!ok) return;

    try {
      setLoading(true);

      const res = await axios.delete(
        `${API_BASE}/api/rooms/${classroomId}/students/${studentId}`,
        {
          headers: { ...authHeaders },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      if (!(res.status >= 200 && res.status < 300)) {
        showError("학생 강퇴 실패", res);
        return;
      }

      const data = res.data || {};
      alert(data.message || "✅ 학생이 강퇴되었습니다.");

      await fetchStudents();
    } catch (err) {
      showError("학생 강퇴 중 오류", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 게임 시작
  const handleGameStart = async () => {
    if (!classroomId) return alert("classroomId 없음");

    try {
      const res = await axios.get(
        `${API_BASE}/api/rooms/${classroomId}/game-start-context`,
        {
          headers: { ...authHeaders },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      if (!(res.status >= 200 && res.status < 300)) {
        showError("게임 시작 데이터 조회 실패", res);
        return;
      }

      const data = res.data || {};
      localStorage.setItem("gameContext", JSON.stringify(data));

      alert("게임 시작 데이터 로딩 완료!");
      // navigate("/game", { state: data });
    } catch (err) {
      showError("게임 시작 실패", err);
    }
  };

  useEffect(() => {
    if (!classroomId) return;
    fetchStudents();
  }, [classroomId, fetchStudents]);

  return (
    <div className="bg-[#F9FBE7] min-h-screen">
      <Navbar />

      <div className="p-8">
        <h2 className="text-3xl font-bold text-[#2E7D32] mb-6">
          {className} 채널
        </h2>

        <div className="mb-6 bg-white rounded-2xl p-5 shadow border border-[#C8E6C9]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xl font-semibold text-[#2E7D32]">
                입장 코드:{" "}
                <span className="text-[#FBC02D] font-extrabold">
                  {joinCode}
                </span>
              </div>
              <div className="text-sm text-gray-700 mt-1">
                학생 수: {studentCount}명
              </div>
              {!userId && (
                <div className="text-xs text-red-500 mt-1">
                  ⚠ userId가 없습니다. 재발급/수정이 실패할 수 있어요.
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleReissueJoinCode}
                disabled={loading || !classroomId || !userId}
                className="px-4 py-2 bg-[#66BB6A] text-white rounded-lg shadow hover:bg-[#2E7D32] disabled:opacity-60"
              >
                {loading ? "처리 중..." : "입장 코드 재발급"}
              </button>

              <button
                onClick={handleOpenEdit}
                disabled={loading || !classroomId || !userId}
                className="px-4 py-2 bg-[#90CAF9] text-white rounded-lg shadow hover:bg-[#42A5F5] disabled:opacity-60"
              >
                방 정보 수정
              </button>

              <button
                onClick={fetchStudents}
                disabled={studentLoading || !classroomId}
                className="px-4 py-2 bg-[#26A69A] text-white rounded-lg shadow hover:bg-[#00897B] disabled:opacity-60"
              >
                {studentLoading ? "불러오는 중..." : "학생 새로고침"}
              </button>

              <button
                onClick={handleGameStart}
                className="px-4 py-2 bg-[#FBC02D] text-white font-bold rounded-lg shadow hover:bg-[#F9A825]"
              >
                훈련 시작
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-2xl font-bold text-[#2E7D32] mb-3">학생 목록</h3>

          <div className="mb-3 text-sm text-gray-600">
            학생이 입장 코드를 입력해 들어오면 이 목록에 자동으로 표시됩니다.
          </div>

          {studentLoading ? (
            <div className="bg-white rounded-xl p-4 shadow border border-[#C8E6C9] text-gray-600">
              학생 목록 불러오는 중...
            </div>
          ) : students.length === 0 ? (
            <div className="bg-white rounded-xl p-4 shadow border border-[#C8E6C9] text-gray-600">
              아직 입장한 학생이 없습니다.
            </div>
          ) : (
            <ul className="space-y-2">
              {students.map((student) => (
                <li
                  key={student.studentId}
                  className="flex items-center justify-between px-4 py-3 bg-white border-l-4 border-[#66BB6A] rounded-lg shadow"
                >
                  <div>
                    <div className="text-[#2E7D32] font-semibold">
                      {student.studentName || "이름 없음"}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      상태: {student.status || "-"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      입장 시각: {student.joinedAt || "-"}
                    </div>
                    {student.isKicked && (
                      <div className="text-xs text-red-500 mt-1">
                        강퇴된 학생
                      </div>
                    )}
                  </div>

                  {!student.isKicked ? (
                    <button
                      onClick={() => handleKickStudent(student.studentId)}
                      className="px-3 py-1 bg-[#F44336] text-white text-sm rounded hover:bg-[#C62828]"
                    >
                      강퇴
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded">
                      강퇴됨
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {editOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-5 text-center">방 정보 수정</h3>

            <label className="text-sm text-gray-600">반 이름</label>
            <input
              type="text"
              value={editClassName}
              onChange={(e) => setEditClassName(e.target.value)}
              className="w-full mb-4 mt-1 px-3 py-3 border border-green-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-300"
            />

            <label className="text-sm text-gray-600">학생 수</label>
            <input
              type="number"
              value={editStudentCount}
              onChange={(e) =>
                setEditStudentCount(e.target.value.replace(/[^0-9]/g, ""))
              }
              className="w-full mb-5 mt-1 px-3 py-3 border border-green-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-300"
            />

            <button
              onClick={handleUpdateRoom}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3 rounded-2xl shadow"
            >
              {loading ? "저장 중..." : "저장"}
            </button>

            <button
              onClick={() => setEditOpen(false)}
              className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-700"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SchoolChannel;
