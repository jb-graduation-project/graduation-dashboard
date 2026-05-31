import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import API_BASE from "../apiBase";

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

  const [students, setStudents] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editClassName, setEditClassName] = useState(className);
  const [editStudentCount, setEditStudentCount] = useState(
    String(studentCount),
  );

  // game-start-context / training 상태 표시용
  const [gameContext, setGameContext] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("gameContext") || "null");
    } catch {
      return null;
    }
  });

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

  const getIsoNow = () => new Date().toISOString();

  const getStoredGameContext = () => {
    try {
      return JSON.parse(localStorage.getItem("gameContext") || "{}");
    } catch {
      return {};
    }
  };

  const saveGameContext = (data) => {
    localStorage.setItem("gameContext", JSON.stringify(data));
    setGameContext(data);
  };

  const getStudentDisplayStatus = (student) => {
    if (student.status && student.status !== "UNKNOWN") {
      if (student.status === "EVACUATING") return "대피 중";
      if (student.status === "EVACUATED") return "대피 완료";
      if (student.status === "RESTRICTED") return "제한됨";
      return student.status;
    }

    const trainingState = student.trainingState || gameContext?.trainingState;

    if (trainingState === "WAITING") return "훈련 대기중";
    if (trainingState === "RUNNING") return "훈련 진행중";
    if (trainingState === "ENDED") return "훈련 종료";

    return "훈련 대기중";
  };

  const fetchStudents = useCallback(async () => {
    if (!classroomId) {
      setStudents([]);
      setStudentCount(0);
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

      console.log("students response:", res.data);

      if (!(res.status >= 200 && res.status < 300)) {
        showError("학생 목록 조회 실패", res);
        setStudents([]);
        setStudentCount(0);
        return;
      }

      const list = Array.isArray(res.data) ? res.data : [];
      const visibleList = list.filter((s) => !s.isKicked);

      setStudents(visibleList);
      setStudentCount(visibleList.length);
    } catch (err) {
      setStudents([]);
      setStudentCount(0);
      showError("학생 목록 조회 중 오류", err);
    } finally {
      setStudentLoading(false);
    }
  }, [classroomId, authHeaders]);

  const fetchGameStartContext = useCallback(async () => {
    if (!classroomId) {
      alert("classroomId 없음");
      return null;
    }

    try {
      const res = await axios.get(
        `${API_BASE}/api/rooms/${classroomId}/game-start-context`,
        {
          headers: { ...authHeaders },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      console.log("game-start-context classroomId =", classroomId);
      console.log("game-start-context 응답 =", res.status, res.data);

      if (!(res.status >= 200 && res.status < 300)) {
        showError("게임 시작 데이터 조회 실패", res);
        return null;
      }

      const data = res.data || {};
      saveGameContext(data);
      return data;
    } catch (err) {
      showError("게임 시작 데이터 조회 중 오류", err);
      return null;
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

      alert("입장 코드가 재발급되었습니다.");
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
      alert("방 정보가 수정되었습니다.");
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
      alert(data.message || "학생이 강퇴되었습니다.");

      setStudents((prev) => {
        const next = prev.filter((s) => s.studentId !== studentId);
        setStudentCount(next.length);
        return next;
      });
    } catch (err) {
      showError("학생 강퇴 중 오류", err);
    } finally {
      setLoading(false);
    }
  };

  // 활성 시나리오 서버 반영
  const setActiveScenarioToServer = async (scenarioId) => {
    if (!classroomId || !scenarioId) return false;

    const res = await axios.put(
      `${API_BASE}/api/rooms/${classroomId}/active-scenario`,
      { scenarioId },
      {
        headers: { "Content-Type": "application/json", ...authHeaders },
        timeout: 10000,
        validateStatus: () => true,
      },
    );

    if (!(res.status >= 200 && res.status < 300)) {
      showError("활성 시나리오 설정 실패", res);
      return false;
    }

    return true;
  };

  const validateTrainingStart = async () => {
    const errors = [];

    if (!classroomId) {
      errors.push("교실 정보가 없습니다.");
    }

    if (!students || students.length === 0) {
      errors.push(
        "입장한 학생이 없습니다. 학생이 최소 1명 이상 입장해야 합니다.",
      );
    }

    const context = await fetchGameStartContext();

    if (!context) {
      errors.push("게임 시작 정보를 불러오지 못했습니다.");
      return { ok: false, errors, context: null };
    }

    const scenarioId = context.scenarioId || context.activeScenarioId;
    const activeMapVersionId = context.activeMapVersionId;

    if (!scenarioId) {
      const assignmentRes = await axios.get(
        `${API_BASE}/api/scenario-assignments?scenarioId=${scenarioId}`,
        {
          headers: { ...authHeaders },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      if (assignmentRes.status >= 200 && assignmentRes.status < 300) {
        const assignments = Array.isArray(assignmentRes.data)
          ? assignmentRes.data
          : [];

        if (assignments.length === 0) {
          errors.push(
            "선택된 시나리오에 미션/역할 데이터가 없습니다. 시나리오 저장 또는 자동 미션 생성이 필요합니다.",
          );
        }
      }
      errors.push(
        "시작할 시나리오가 선택되지 않았습니다. 시나리오 관리에서 시나리오를 먼저 선택하세요.",
      );
    }

    if (!activeMapVersionId) {
      errors.push(
        "활성 구조도가 없습니다. 구조도 설정에서 맵 버전을 저장한 뒤 '활성 맵 적용'을 먼저 해주세요.",
      );
    }

    return {
      ok: errors.length === 0,
      errors,
      context,
    };
  };

  const handleTrainingStart = async (contextData = null) => {
    if (!classroomId) {
      alert("classroomId 없음");
      return false;
    }

    // ✅ 여기 추가 (핵심)
    const stored = contextData || getStoredGameContext();

    const scenarioId = stored?.scenarioId || stored?.activeScenarioId || null;

    const startedAt = getIsoNow();

    // ✅ payload는 반드시 이 아래에 있어야 함
    const payload = {
      classroomId: String(classroomId),
      trainingState: "RUNNING",
      trainingStartedAt: startedAt,
      trainingEndedAt: null,
      scenarioId: scenarioId,
    };

    try {
      const res = await axios.post(
        `${API_BASE}/api/rooms/${classroomId}/training/start`,
        payload,
        {
          headers: { "Content-Type": "application/json", ...authHeaders },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      if (!(res.status >= 200 && res.status < 300)) {
        showError("훈련 시작 상태 저장 실패", res);
        return false;
      }

      const nextContext = {
        ...stored,
        classroomId: stored?.classroomId || String(classroomId),
        scenarioId: res.data?.scenarioId || stored?.scenarioId || scenarioId,
        trainingState: res.data?.trainingState || "RUNNING",
        trainingStartedAt: res.data?.trainingStartedAt || startedAt,
        trainingEndedAt: res.data?.trainingEndedAt || null,
        activeScenarioId: res.data?.activeScenarioId || scenarioId,
      };

      saveGameContext(nextContext);
      return true;
    } catch (err) {
      showError("훈련 시작 상태 저장 중 오류", err);
      return false;
    }
  };

  const handleTrainingEnd = async () => {
    if (!classroomId) {
      alert("classroomId 없음");
      return;
    }

    const stored = getStoredGameContext();
    const scenarioId = stored?.scenarioId || stored?.activeScenarioId || null;
    const endedAt = getIsoNow();

    const payload = {
      classroomId: String(classroomId),
      trainingState: "ENDED",
      trainingStartedAt: stored?.trainingStartedAt || null,
      trainingEndedAt: endedAt,
      activeScenarioId: scenarioId,
    };

    try {
      setLoading(true);

      const res = await axios.post(
        `${API_BASE}/api/rooms/${classroomId}/training/end`,
        payload,
        {
          headers: { "Content-Type": "application/json", ...authHeaders },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      if (!(res.status >= 200 && res.status < 300)) {
        showError("훈련 종료 상태 저장 실패", res);
        return;
      }

      const nextContext = {
        ...stored,
        trainingState: res.data?.trainingState || "ENDED",
        trainingStartedAt:
          res.data?.trainingStartedAt || stored?.trainingStartedAt || null,
        trainingEndedAt: res.data?.trainingEndedAt || endedAt,
        activeScenarioId: res.data?.activeScenarioId || scenarioId,
      };

      saveGameContext(nextContext);
      alert("훈련이 종료되었습니다.");
    } catch (err) {
      showError("훈련 종료 상태 저장 중 오류", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGameStart = async () => {
    if (!classroomId) return alert("classroomId 없음");

    try {
      setLoading(true);

      const stored = getStoredGameContext();
      const scenarioId = stored?.scenarioId || stored?.activeScenarioId || null;

      if (!scenarioId) {
        alert(
          "시작할 시나리오가 선택되지 않았습니다. 시나리오 관리에서 시나리오를 먼저 선택하세요.",
        );
        return;
      }

      // 🔥 여기 핵심 추가
      const activeSet = await setActiveScenarioToServer(scenarioId);
      if (!activeSet) return;

      const validation = await validateTrainingStart();

      if (!validation.ok) {
        alert(
          "훈련을 시작할 수 없습니다.\n\n" +
            validation.errors.map((e, i) => `${i + 1}. ${e}`).join("\n"),
        );
        return;
      }

      const started = await handleTrainingStart(validation.context);
      if (!started) return;

      const context = await fetchGameStartContext();
      if (!context) return;

      alert("게임 시작!");
      // navigate("/game", { state: context });
    } catch (err) {
      showError("게임 시작 실패", err);
    } finally {
      setLoading(false);
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
                disabled={studentLoading || loading || !classroomId}
                className="px-4 py-2 bg-[#26A69A] text-white rounded-lg shadow hover:bg-[#00897B] disabled:opacity-60"
              >
                {studentLoading ? "불러오는 중..." : "학생 새로고침"}
              </button>

              <button
                onClick={handleGameStart}
                disabled={loading || !classroomId || students.length === 0}
                className="px-4 py-2 bg-[#FBC02D] text-white font-bold rounded-lg shadow hover:bg-[#F9A825] disabled:opacity-60"
              >
                {loading ? "처리 중..." : "훈련 시작"}
              </button>

              <button
                onClick={handleTrainingEnd}
                disabled={loading || !classroomId}
                className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg shadow hover:bg-red-600 disabled:opacity-60"
              >
                훈련 종료
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
                      상태: {getStudentDisplayStatus(student)}
                    </div>
                  </div>

                  <button
                    onClick={() => handleKickStudent(student.studentId)}
                    className="px-3 py-1 bg-[#F44336] text-white text-sm rounded hover:bg-[#C62828]"
                  >
                    강퇴
                  </button>
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
