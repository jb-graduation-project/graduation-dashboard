// pages/CreateChannel.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE =
  "https://disaster-ar-backend-a7bvfvd8f6bxbsfh.koreacentral-01.azurewebsites.net";

function CreateChannel() {
  const [schoolName, setSchoolName] = useState("");
  const [mapFile, setMapFile] = useState(null); // ✅ 추가
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleCreate = async () => {
    const trimmed = schoolName.trim();

    if (!trimmed) {
      alert("학교 이름을 입력해 주세요.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("schoolName", trimmed);

      // ✅ 파일 다시 추가
      if (mapFile) {
        formData.append("mapFile", mapFile);
      }

      const res = await axios.post(`${API_BASE}/api/channels`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 10000,
        validateStatus: () => true,
      });

      if (!(res.status >= 200 && res.status < 300)) {
        const msg =
          res.data?.message ||
          res.data?.detail ||
          (typeof res.data === "string" ? res.data : null) ||
          `채널 생성 실패 (${res.status})`;
        alert(msg);
        return;
      }

      const data = res.data || {};
      const channelId = data.id;
      const accessCode = data.accessCode;

      if (!channelId) {
        alert(`id가 응답에 없습니다.\n\n${JSON.stringify(data, null, 2)}`);
        return;
      }

      navigate("/room-list", {
        state: {
          channelId,
          schoolName: data.schoolName ?? trimmed,
          accessCode: accessCode ?? "UNKNOWN",
        },
      });
    } catch (err) {
      console.error(err);

      if (err.code === "ECONNABORTED") {
        alert("요청 시간이 초과되었습니다. (timeout)");
        return;
      }

      alert("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          채널 생성하기
        </h2>

        {/* 학교 이름 */}
        <input
          type="text"
          placeholder="학교 이름"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
        />

        {/* ✅ 숨긴 file input */}
        <input
          id="mapFile"
          type="file"
          accept="image/*"
          onChange={(e) => setMapFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />

        {/* ✅ 꾸민 업로드 박스 */}
        <label
          htmlFor="mapFile"
          className="w-full mb-6 flex items-center justify-between gap-3
             px-4 py-3 border border-gray-300 rounded-lg cursor-pointer
             hover:border-green-500 hover:bg-green-50 transition"
        >
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">
              {mapFile ? "파일 선택됨" : "지도 이미지 업로드"}
            </span>
            <span className="text-sm text-gray-500">
              {mapFile ? mapFile.name : "PNG, JPG 등 이미지 파일"}
            </span>
          </div>

          <span
            className="shrink-0 bg-green-600 hover:bg-green-700 text-white text-sm font-bold
                   px-4 py-2 rounded-lg shadow"
          >
            파일 선택
          </span>
        </label>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3 rounded-lg shadow"
        >
          {loading ? "생성 중..." : "학교 채널 생성하기"}
        </button>
      </div>
    </div>
  );
}

export default CreateChannel;
