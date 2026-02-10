// pages/CreateChannel.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE =
  "https://disaster-ar-backend-a7bvfvd8f6bxbsfh.koreacentral-01.azurewebsites.net";

function CreateChannel() {
  const [schoolName, setSchoolName] = useState("");
  const [mapFiles, setMapFiles] = useState([]); // File[]
  const [previewUrls, setPreviewUrls] = useState([]); // string[]
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ✅ 파일 바뀔 때마다 objectURL 생성/정리
  useEffect(() => {
    // 이전 URL 정리
    previewUrls.forEach((u) => URL.revokeObjectURL(u));

    const nextUrls = mapFiles.map((f) => URL.createObjectURL(f));
    setPreviewUrls(nextUrls);

    return () => {
      nextUrls.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapFiles]);

  // ✅ "3개 선택됨" 형태로만 표시(괄호/예시 없음)
  const fileSummary = useMemo(() => {
    if (!mapFiles.length) return "PNG, JPG 등 이미지 파일";
    return `${mapFiles.length}개 선택됨`;
  }, [mapFiles]);

  // ✅ 여러 번 파일 선택해서 누적 추가(중복 제거)
  const onPickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;

    setMapFiles((prev) => {
      const next = [...prev];
      for (const f of picked) {
        const key = `${f.name}-${f.size}-${f.lastModified}`;
        const exists = next.some(
          (x) => `${x.name}-${x.size}-${x.lastModified}` === key,
        );
        if (!exists) next.push(f);
      }
      return next;
    });

    // ✅ 같은 파일 다시 선택해도 변경 이벤트 뜨게
    e.target.value = "";
  };

  const handleCreate = async () => {
    const trimmed = schoolName.trim();
    if (!trimmed) return alert("학교 이름을 입력해 주세요.");
    if (!mapFiles.length) return alert("지도 이미지를 1장 이상 선택해 주세요.");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("schoolName", trimmed);

      // ✅ 여러 파일 전송 (서버가 mapFile 키로 여러 개 받는다고 가정)
      mapFiles.forEach((f) => formData.append("mapFile", f));

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
      if (!data.id) {
        alert(`id가 응답에 없습니다.\n\n${JSON.stringify(data, null, 2)}`);
        return;
      }

      navigate("/room-list", {
        state: {
          channelId: data.id,
          schoolName: data.schoolName ?? trimmed,
          accessCode: data.accessCode ?? "UNKNOWN",
        },
      });
    } catch (err) {
      console.error(err);
      if (err.code === "ECONNABORTED")
        return alert("요청 시간이 초과되었습니다. (timeout)");
      alert("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const removeOne = (idx) => {
    setMapFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearAll = () => setMapFiles([]);

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-[720px]">
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

        {/* file input */}
        <input
          id="mapFile"
          type="file"
          accept="image/*"
          multiple
          onChange={onPickFiles}
          className="hidden"
        />

        {/* 업로드 버튼 */}
        <label
          htmlFor="mapFile"
          className="w-full mb-3 flex items-center justify-between gap-3
             px-4 py-3 border border-gray-300 rounded-lg cursor-pointer
             hover:border-green-500 hover:bg-green-50 transition"
        >
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">
              {mapFiles.length
                ? "파일 선택됨"
                : "지도 이미지 업로드(여러 장 가능)"}
            </span>

            {/* ✅ 괄호/예시 없이 깔끔하게 */}
            <span className="text-sm text-gray-500">{fileSummary}</span>
          </div>

          <span
            className="shrink-0 bg-green-600 hover:bg-green-700 text-white text-sm font-bold
                   px-4 py-2 rounded-lg shadow"
          >
            파일 선택
          </span>
        </label>

        {/* ✅ 이미지 미리보기(썸네일) */}
        {previewUrls.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-gray-700">
                선택한 이미지 미리보기
              </div>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-gray-600 hover:underline"
              >
                전체 제거
              </button>
            </div>

            {/* ✅ 더 크게 보이도록 2열 + 높이 크게 */}
            <div className="grid grid-cols-2 gap-3">
              {previewUrls.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="relative border rounded-lg overflow-hidden bg-gray-50"
                >
                  <img
                    src={url}
                    alt={`preview-${idx}`}
                    className="w-full h-52 object-contain bg-white"
                  />

                  <button
                    type="button"
                    onClick={() => removeOne(idx)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full
                       bg-black/60 text-white text-base leading-none
                       hover:bg-black/75"
                    title="제거"
                    aria-label="제거"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
