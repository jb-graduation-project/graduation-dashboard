// pages/CreateChannel.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "https://disasterar.onenyang.shop";

function CreateChannel() {
  const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ 층별 업로드: floorName + file + previewUrl
  const [floors, setFloors] = useState([
    { id: crypto.randomUUID(), floorName: "1층", file: null, previewUrl: "" },
  ]);

  const navigate = useNavigate();

  // ✅ 언마운트 시 objectURL 정리
  useEffect(() => {
    return () => {
      floors.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFloor = () => {
    setFloors((prev) => {
      const nextNum = prev.length + 1; // 1층 다음은 2층...
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          floorName: `${nextNum}층`,
          file: null,
          previewUrl: "",
        },
      ];
    });
  };

  const removeFloor = (id) => {
    setFloors((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((x) => x.id !== id);
      // 최소 1개는 남기기
      return next.length ? next : prev;
    });
  };

  const onChangeFloorName = (id, value) => {
    setFloors((prev) =>
      prev.map((x) => (x.id === id ? { ...x, floorName: value } : x)),
    );
  };

  const onPickFloorFile = (id, file) => {
    if (!file) return;

    setFloors((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x;

        // ✅ 이전 previewUrl 정리 후 새로 생성
        if (x.previewUrl) URL.revokeObjectURL(x.previewUrl);

        const previewUrl = URL.createObjectURL(file);
        return { ...x, file, previewUrl };
      }),
    );
  };

  const clearFloorFile = (id) => {
    setFloors((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x;
        if (x.previewUrl) URL.revokeObjectURL(x.previewUrl);
        return { ...x, file: null, previewUrl: "" };
      }),
    );
  };

  const clearAll = () => {
    setFloors((prev) => {
      prev.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
      return [
        {
          id: crypto.randomUUID(),
          floorName: "1층",
          file: null,
          previewUrl: "",
        },
      ];
    });
  };

  const handleCreate = async () => {
    const trimmed = schoolName.trim();

    if (!trimmed) return alert("학교 이름을 입력해 주세요.");

    // ✅ 층별 파일 1장 이상 있어야 함(원하면 “모든 층 필수”로 바꿀 수도 있음)
    const picked = floors.filter((f) => !!f.file);
    if (!picked.length) return alert("최소 1개 층의 이미지를 업로드해 주세요.");

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("schoolName", trimmed);

      picked.forEach((f) => {
        formData.append("mapImages", f.file);
      });

      const res = await axios.post(`${API_BASE}/api/channels`, formData, {
        timeout: 10000,
        validateStatus: () => true,
      });

      // ❗ 실패 처리
      if (!(res.status >= 200 && res.status < 300)) {
        const msg =
          res.data?.message ||
          res.data?.detail ||
          (typeof res.data === "string" ? res.data : null) ||
          `채널 생성 실패 (${res.status})`;

        console.log("채널 생성 실패 응답 =", res.status, res.data);

        // 🔥 핵심: 중복 이름 처리
        if (
          msg.includes("이미 존재") ||
          msg.includes("duplicate") ||
          msg.includes("중복")
        ) {
          alert("이미 존재하는 학교 이름입니다. 다른 이름을 입력해주세요.");
          return;
        }

        alert(msg);
        return;
      }

      const data = res.data || {};
      console.log("🔥 create channel res.data =", data);
      console.log("🔥 data.thumbnailImage =", data.thumbnailImage);
      if (!data.id) {
        alert(`id가 응답에 없습니다.\n\n${JSON.stringify(data, null, 2)}`);
        return;
      }

      const firstPreviewImage =
        floors.find((f) => f.previewUrl)?.previewUrl || "";

      navigate("/room-list", {
        state: {
          schoolId: data.id,
          channelId: data.id,
          schoolName: data.schoolName ?? trimmed,
          schoolCode: data.accessCode ?? "UNKNOWN",
          accessCode: data.accessCode ?? "UNKNOWN",
          thumbnailImage: data.thumbnailImage || firstPreviewImage,
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

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 py-10">
      <div className="bg-white p-8 rounded-lg shadow-lg w-[760px]">
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

        {/* ✅ 층별 업로드 영역 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-gray-700">
              층별 지도 이미지 업로드
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={addFloor}
                className="px-3 py-2 text-sm font-bold rounded-lg bg-green-600 text-white hover:bg-green-700"
              >
                + 층 추가
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50"
              >
                전체 초기화
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {floors.map((f, idx) => (
              <div key={f.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between gap-3 mb-3">
                  {/* 층 이름 */}
                  <input
                    type="text"
                    value={f.floorName}
                    onChange={(e) => onChangeFloorName(f.id, e.target.value)}
                    className="w-40 px-3 py-2 border rounded-lg bg-white"
                    placeholder="예: 1층"
                  />

                  <div className="flex items-center gap-2">
                    {/* ✅ 층 삭제(1개 남는 건 방지) */}
                    <button
                      type="button"
                      onClick={() => removeFloor(f.id)}
                      disabled={floors.length <= 1}
                      className="px-3 py-2 text-sm rounded-lg border disabled:opacity-40 hover:bg-white"
                      title={
                        floors.length <= 1
                          ? "최소 1개 층은 필요해요"
                          : "층 삭제"
                      }
                    >
                      층 삭제
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-start">
                  {/* 업로드 버튼 */}
                  <div>
                    <input
                      id={`file-${f.id}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        onPickFloorFile(f.id, file);
                        e.target.value = ""; // 같은 파일 다시 선택 가능
                      }}
                      className="hidden"
                    />

                    <label
                      htmlFor={`file-${f.id}`}
                      className="w-full flex items-center justify-between gap-3
                        px-4 py-3 border border-gray-300 rounded-lg cursor-pointer
                        hover:border-green-500 hover:bg-green-50 transition bg-white"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">
                          {f.file ? "파일 선택됨" : "지도 이미지 업로드"}
                        </span>
                        <span className="text-sm text-gray-500">
                          {f.file ? f.file.name : "PNG, JPG 등 이미지 파일"}
                        </span>
                      </div>

                      <span className="shrink-0 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-lg shadow">
                        파일 선택
                      </span>
                    </label>

                    {f.file && (
                      <button
                        type="button"
                        onClick={() => clearFloorFile(f.id)}
                        className="mt-2 text-xs text-gray-600 hover:underline"
                      >
                        이 층 파일 제거
                      </button>
                    )}
                  </div>

                  {/* 미리보기 */}
                  <div className="border rounded-lg overflow-hidden bg-white">
                    {f.previewUrl ? (
                      <img
                        src={f.previewUrl}
                        alt={`preview-${idx}`}
                        className="w-full h-40 object-contain"
                      />
                    ) : (
                      <div className="w-full h-40 flex items-center justify-center text-sm text-gray-400">
                        미리보기 없음
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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
