import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

const API_BASE = "https://disasterar.onenyang.shop";

function SchoolChannel() {
  const location = useLocation();

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

  // ✅ 처음에는 "이전에 발급받았던 값"을 보여주기
  const initialJoinCode = location.state?.joinCode || "UNKNOWN";
  const [joinCode, setJoinCode] = useState(initialJoinCode);

  const [className, setClassName] = useState(
    location.state?.className || location.state?.roomName || "교실",
  );
  const [studentCount, setStudentCount] = useState(
    Number(location.state?.studentCount ?? 0),
  );

  // 로컬 학생 리스트
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState("");

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
    // axios 응답(res)
    if (resOrErr?.status) {
      const data = resOrErr.data;
      alert(
        `${title} (${resOrErr.status})\n\n${
          typeof data === "string" ? data : JSON.stringify(data, null, 2)
        }`,
      );
      return;
    }
    // axios 에러(err)
    alert(`${title}\n\n${resOrErr?.message || "알 수 없는 오류"}`);
  };

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
          params: { userId }, // ✅ Navbar처럼
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
      if (typeof data.studentCount === "number")
        setStudentCount(data.studentCount);

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

      // 응답 예시: { classroomId, schoolId, className, studentCount, joinCode }
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

  // 로컬 학생 관리
  const handleAddStudent = () => {
    if (!newStudent.trim()) return;
    setStudents((prev) => [...prev, newStudent.trim()]);
    setNewStudent("");
  };

  const handleRemoveStudent = (index) => {
    setStudents((prev) => prev.filter((_, i) => i !== index));
  };

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
                학생 수(설정): {studentCount}명
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
                onClick={() => alert("훈련을 시작합니다!")}
                className="px-4 py-2 bg-[#FBC02D] text-white font-bold rounded-lg shadow hover:bg-[#F9A825]"
              >
                훈련 시작
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-2xl font-bold text-[#2E7D32] mb-3">학생 입장</h3>
          <div className="flex items-center mb-3">
            <input
              type="text"
              placeholder="학생 이름 입력"
              value={newStudent}
              onChange={(e) => setNewStudent(e.target.value)}
              className="px-3 py-2 border border-[#81C784] rounded-l-md w-64 focus:outline-none focus:ring-2 focus:ring-[#66BB6A]"
            />
            <button
              onClick={handleAddStudent}
              className="px-4 py-2 bg-[#81C784] text-white rounded-r-md hover:bg-[#2E7D32]"
            >
              추가
            </button>
          </div>

          <ul className="space-y-2">
            {students.map((student, index) => (
              <li
                key={index}
                className="flex items-center justify-between px-4 py-2 bg-white border-l-4 border-[#66BB6A] rounded-lg shadow"
              >
                <span className="text-[#2E7D32] font-medium">{student}</span>
                <button
                  onClick={() => handleRemoveStudent(index)}
                  className="px-3 py-1 bg-[#F44336] text-white text-sm rounded hover:bg-[#C62828]"
                >
                  퇴출
                </button>
              </li>
            ))}
          </ul>
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
