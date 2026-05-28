import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

function JoinChannel() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const handleJoin = async () => {
    const channelCode = code.trim();
    if (!channelCode) {
      setErrorMsg("학교 코드를 입력하세요.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API_BASE}/api/channels/join-school`,
        { channelCode }, // ✅ 백엔드 스펙 그대로
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          timeout: 10000,
          validateStatus: () => true, // 4xx/5xx도 res로 받기
        },
      );

      // 실패 처리
      if (!(res.status >= 200 && res.status < 300)) {
        const msg =
          res.data?.message ||
          res.data?.detail ||
          (typeof res.data === "string" ? res.data : null) ||
          `입장 실패 (${res.status})`;
        setErrorMsg(msg);
        return;
      }

      console.log("입장 성공:", res.data);

      const data = res.data || {};

      const schoolId =
        data.id ?? data.schoolId ?? data.channelId ?? data.school_id ?? null;

      const schoolName =
        data.schoolName ?? data.school_name ?? data.name ?? "학교";

      const schoolCode =
        data.accessCode ??
        data.channelCode ??
        data.joinCode ??
        channelCode ??
        "UNKNOWN";

      navigate("/room-list", {
        state: {
          schoolId,
          channelId: schoolId, // 기존 코드 호환용
          schoolName,
          schoolCode,
          accessCode: schoolCode, // 기존 코드 호환용
          joinCode: schoolCode, // 기존 코드 호환용
        },
      });
    } catch (err) {
      console.error("입장 실패:", err);

      if (err.code === "ECONNABORTED") {
        setErrorMsg("요청 시간이 초과되었습니다. (timeout)");
        return;
      }

      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "입장에 실패했습니다.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-white border border-green-300 rounded-lg p-8 shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">
          코드 입력
        </h2>
        <p className="text-center text-gray-600 mb-6">학교 코드를 입력하세요</p>

        <input
          type="text"
          placeholder="학교 코드"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleJoin();
          }}
          className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 mb-3"
        />

        {errorMsg && (
          <p className="text-sm text-red-600 mb-3 whitespace-pre-line">
            {errorMsg}
          </p>
        )}

        <button
          onClick={handleJoin}
          disabled={loading}
          className={`w-full text-white font-bold py-2 px-4 rounded-lg shadow ${
            loading
              ? "bg-green-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "입장 중..." : "입장하기"}
        </button>
      </div>
    </div>
  );
}

export default JoinChannel;
