// pages/RoomList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "https://disasterar.onenyang.shop";

function RoomList() {
  const location = useLocation();
  const navigate = useNavigate();

  const schoolName = location.state?.schoolName || "중부초등학교";

  const schoolId = useMemo(() => {
    return (
      location.state?.schoolId ||
      location.state?.channelId ||
      location.state?.id ||
      null
    );
  }, [location.state]);

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

  // schoolCode는 rooms API에 없어서 state 값 우선 사용
  const [schoolCode, setSchoolCode] = useState(
    location.state?.schoolCode ||
      location.state?.accessCode ||
      location.state?.joinCode ||
      "없음",
  );

  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  const showAxiosError = (title, errOrRes) => {
    if (errOrRes?.status) {
      alert(
        `${title} (${errOrRes.status})\n\n${
          typeof errOrRes.data === "string"
            ? errOrRes.data
            : JSON.stringify(errOrRes.data, null, 2)
        }`,
      );
      return;
    }
    alert(`${title}\n\n${errOrRes?.message || "알 수 없는 오류"}`);
  };

  const fetchRooms = async () => {
    if (!schoolId) {
      setRooms([]);
      return;
    }

    try {
      setRoomsLoading(true);

      const res = await axios.get(`${API_BASE}/api/rooms`, {
        params: { schoolId },
        headers: { ...authHeaders },
        timeout: 10000,
        validateStatus: () => true,
      });

      if (!(res.status >= 200 && res.status < 300)) {
        setRooms([]);
        showAxiosError("방 목록 조회 실패", res);
        return;
      }

      const list = Array.isArray(res.data) ? res.data : [];
      setRooms(
        list.map((r) => ({
          classroomId: r.classroomId,
          schoolId: r.schoolId,
          className: r.className,
          studentCount: Number(r.studentCount ?? 0),
          joinCode: r.joinCode ?? "",
          trainingState: r.trainingState ?? "READY",
        })),
      );
    } catch (e) {
      console.error("방 목록 조회 실패:", e);
      setRooms([]);
      showAxiosError("방 목록 조회 중 오류", e);
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    const className = newRoomName.trim();
    if (!className) return;

    if (!schoolId) {
      alert("schoolId가 없어 방을 생성할 수 없습니다.");
      return;
    }

    if (!userId) {
      alert("userId가 없습니다. 먼저 로그인 상태를 확인해 주세요.");
      return;
    }

    try {
      setRoomsLoading(true);

      const res = await axios.post(
        `${API_BASE}/api/rooms`,
        { schoolId, userId, className },
        {
          headers: { "Content-Type": "application/json", ...authHeaders },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      if (!(res.status >= 200 && res.status < 300)) {
        showAxiosError("방 생성 실패", res);
        return;
      }

      setIsModalOpen(false);
      setNewRoomName("");
      await fetchRooms();
    } catch (e) {
      console.error("방 생성 실패:", e);
      showAxiosError("방 생성 중 오류", e);
    } finally {
      setRoomsLoading(false);
    }
  };

  const goToSchoolChannel = (room) => {
    navigate("/school-channel", {
      state: {
        classroomId: room.classroomId,
        roomName: room.className,
        studentCount: room.studentCount,
        joinCode: room.joinCode,
        trainingState: room.trainingState,
        schoolId,
        schoolName,
        schoolCode,
      },
    });
  };

  const openModal = () => {
    setNewRoomName("");
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex justify-center items-start py-10">
      <div className="w-full max-w-3xl bg-white border border-green-500 rounded-3xl shadow-sm px-8 py-6 space-y-6">
        <div className="w-full bg-white border border-green-500 rounded-3xl px-6 py-4 space-y-2">
          <h2 className="text-2xl font-bold">{schoolName}</h2>

          <div className="inline-flex items-center gap-2 bg-[#FBC02D] text-black font-bold px-5 py-3 rounded-2xl">
            <span>학교코드: {schoolCode}</span>
          </div>

          <p className="text-sm text-gray-500">
            교실을 선택하거나 새로 생성하세요.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-gray-800">교실 목록</h3>
          <button
            onClick={openModal}
            className="relative w-10 h-10 rounded-full border-2 border-green-500 hover:bg-green-50"
            title="교실 생성"
          >
            <span className="absolute left-1/2 top-1/2 w-4 h-0.5 bg-green-600 -translate-x-1/2 -translate-y-1/2" />
            <span className="absolute left-1/2 top-1/2 w-0.5 h-4 bg-green-600 -translate-x-1/2 -translate-y-1/2" />
          </button>
        </div>

        <div className="w-full border border-green-500 rounded-3xl px-6 py-4 space-y-4">
          {roomsLoading && (
            <p className="text-center text-gray-500 text-sm py-6">
              불러오는 중...
            </p>
          )}

          {!roomsLoading &&
            rooms.map((room) => (
              <div
                key={room.classroomId}
                className="border border-green-300 rounded-2xl px-5 py-3 shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="text-xl font-bold mb-1">{room.className}</div>
                  <div className="text-sm text-gray-700">
                    학생 수 {room.studentCount}명
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    상태: {room.trainingState}
                  </div>
                </div>

                <button
                  onClick={() => goToSchoolChannel(room)}
                  className="px-6 py-2 rounded-full border border-green-400 bg-white text-green-700 font-semibold shadow-sm hover:bg-green-50"
                >
                  관리
                </button>
              </div>
            ))}

          {!roomsLoading && rooms.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-8">
              아직 생성된 교실이 없습니다. 상단 + 버튼을 눌러 교실을 생성해
              주세요.
            </p>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-5 text-center">
              교실 생성하기
            </h3>

            <input
              type="text"
              placeholder="반 이름(예: 3학년 1반)"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="w-full mb-5 px-3 py-3 border border-green-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-300 placeholder:text-gray-400"
            />

            <button
              onClick={handleCreateRoom}
              disabled={roomsLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3 rounded-2xl shadow"
            >
              {roomsLoading ? "생성 중..." : "교실 생성하기"}
            </button>

            <button
              onClick={closeModal}
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

export default RoomList;
