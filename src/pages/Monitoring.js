import React, { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://disasterar.onenyang.shop";

export default function Monitoring() {
  // =========================
  // 기본 값
  // =========================

  const classroomId = useMemo(() => {
    return (
      localStorage.getItem("classroomId") ||
      localStorage.getItem("roomId") ||
      ""
    );
  }, []);

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");

    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  }, []);

  // =========================
  // 상태
  // =========================

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [monitoringData, setMonitoringData] = useState(null);

  const [allStudents, setAllStudents] = useState([]);

  const [selectedFloorIndex, setSelectedFloorIndex] = useState(0);

  const [selectedMarker, setSelectedMarker] = useState(null);

  const [lastUpdatedAt, setLastUpdatedAt] = useState("");

  // =========================
  // fallback mock
  // =========================

  const MOCK_MONITORING_DATA = {
    classroomId: classroomId || "mock-room",
    mapVersionId: "mock-map",
    floors: [],
  };

  // =========================
  // 유틸
  // =========================

  const resolveImageUrl = useCallback((src) => {
    if (!src) return "";

    if (
      src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("blob:") ||
      src.startsWith("data:")
    ) {
      return src;
    }

    const path = src.startsWith("/") ? src : `/${src}`;

    return `${API_BASE_URL}${path}`;
  }, []);

  const formatTime = (value) => {
    if (!value) return "-";

    return value.replace("T", " ").slice(0, 19);
  };

  const getStudentDetectState = (student) => {
    if (student.isKicked) return "KICKED";

    if (student.beaconState) return student.beaconState;

    if (student.beaconId || student.lastSeenAt) return "DETECTED";

    return "LOST";
  };

  const getSignalText = (rssi) => {
    if (rssi === null || rssi === undefined) {
      return "미감지";
    }

    if (rssi >= -60) {
      return `강함 (${rssi} dBm)`;
    }

    if (rssi >= -75) {
      return `양호 (${rssi} dBm)`;
    }

    return `약함 (${rssi} dBm)`;
  };

  // =========================
  // monitoring-map API
  // =========================

  const fetchMonitoringMap = useCallback(async () => {
    if (!classroomId) {
      throw new Error("classroomId가 없습니다.");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/rooms/${classroomId}/monitoring-map`,
      {
        headers: {
          ...authHeaders,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`monitoring-map 실패 (${response.status})`);
    }

    return response.json();
  }, [classroomId, authHeaders]);

  // =========================
  // 학생 API
  // =========================

  const fetchStudents = useCallback(async () => {
    if (!classroomId) return [];

    const response = await fetch(
      `${API_BASE_URL}/api/rooms/${classroomId}/students`,
      {
        headers: {
          ...authHeaders,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`students 실패 (${response.status})`);
    }

    return response.json();
  }, [classroomId, authHeaders]);

  // =========================
  // 구조도 API
  // =========================

  const fetchMapData = useCallback(async () => {
    if (!classroomId) return null;

    const response = await fetch(
      `${API_BASE_URL}/api/rooms/${classroomId}/map`,
      {
        headers: {
          ...authHeaders,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`map API 실패 (${response.status})`);
    }

    const mapData = await response.json();

    if (!mapData?.floorsJson) return null;

    const parsedFloors = JSON.parse(mapData.floorsJson);

    return {
      mapVersionId: mapData.mapVersionId,
      floors: parsedFloors,
    };
  }, [classroomId, authHeaders]);

  // =========================
  // 데이터 로드
  // =========================

  const fetchAllData = useCallback(async () => {
    try {
      // setLoading(true);

      setError("");

      const [monitoringResult, studentsResult, mapResult] =
        await Promise.allSettled([
          fetchMonitoringMap(),
          fetchStudents(),
          fetchMapData(),
        ]);

      // =========================
      // monitoring-map
      // =========================

      let monitoring = MOCK_MONITORING_DATA;

      if (monitoringResult.status === "fulfilled") {
        monitoring = monitoringResult.value;
      } else {
        console.warn("monitoring-map 실패 → fallback 사용");
      }

      // =========================
      // 구조도 merge
      // =========================

      if (mapResult.status === "fulfilled" && mapResult.value) {
        const mapData = mapResult.value;

        const mergedFloors = (monitoring.floors || []).map((floor, index) => {
          const mapFloor =
            mapData.floors.find(
              (f) =>
                Number(f.floorIndex ?? index) ===
                Number(floor.floorIndex ?? index),
            ) || mapData.floors[index];

          return {
            ...floor,

            floorLabel:
              floor.floorLabel ||
              mapFloor?.floorLabel ||
              mapFloor?.name ||
              `${index + 1}층`,

            image: {
              ...floor.image,

              src:
                floor.image?.src ||
                mapFloor?.image?.src ||
                mapFloor?.imageSrc ||
                null,

              naturalWidth:
                floor.image?.naturalWidth ||
                mapFloor?.image?.natural?.w ||
                1710,

              naturalHeight:
                floor.image?.naturalHeight ||
                mapFloor?.image?.natural?.h ||
                423,
            },
          };
        });

        monitoring = {
          ...monitoring,
          mapVersionId: monitoring.mapVersionId || mapData.mapVersionId,

          floors: mergedFloors,
        };
      }

      // =========================
      // 학생
      // =========================

      let students = [];

      if (studentsResult.status === "fulfilled") {
        students = Array.isArray(studentsResult.value)
          ? studentsResult.value
          : [];
      }

      setMonitoringData(monitoring);

      setAllStudents(students);

      setLastUpdatedAt(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);

      setError(err.message);
    }
  }, [fetchMonitoringMap, fetchStudents, fetchMapData]);

  // =========================
  // 초기 로드
  // =========================

  useEffect(() => {
    const init = async () => {
      await fetchAllData();

      setLoading(false);
    };

    init();

    const timer = setInterval(() => {
      fetchAllData();
    }, 3000);

    return () => clearInterval(timer);
  }, [fetchAllData]);

  // =========================
  // floor
  // =========================

  const floors = monitoringData?.floors || [];

  const selectedFloor = useMemo(() => {
    if (!floors.length) return null;

    return (
      floors.find((f) => Number(f.floorIndex) === Number(selectedFloorIndex)) ||
      floors[0]
    );
  }, [floors, selectedFloorIndex]);

  // =========================
  // image
  // =========================

  const imageUrl = useMemo(() => {
    const src = selectedFloor?.image?.src || selectedFloor?.imageSrc || "";

    return resolveImageUrl(src);
  }, [selectedFloor, resolveImageUrl]);

  // =========================
  // marker
  // =========================

  const markers = Array.isArray(selectedFloor?.beaconMarkers)
    ? selectedFloor.beaconMarkers
    : [];

  // =========================
  // zone
  // =========================

  const zoneElements = (selectedFloor?.elements || []).filter((e) =>
    ["안전 구역", "재난 구역", "제한 구역"].includes(e.type),
  );

  // =========================
  // stats
  // =========================

  const totalStudentCount = allStudents.length;

  const dangerCount = allStudents.filter((student) =>
    ["RESTRICTED"].includes(student.status),
  ).length;

  // =========================
  // unity url
  // =========================

  const unityUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (monitoringData?.classroomId) {
      params.set("classroomId", monitoringData.classroomId);
    }

    if (monitoringData?.mapVersionId) {
      params.set("activeMapVersionId", monitoringData.mapVersionId);
    }

    if (selectedFloor?.floorIndex !== undefined) {
      params.set("floorIndex", selectedFloor.floorIndex);
    }

    return `/WebGL/index.html?${params.toString()}`;
  }, [monitoringData, selectedFloor]);

  // =========================
  // marker click
  // =========================

  const handleSelectMarker = (marker) => {
    setSelectedMarker(marker);

    const iframe = document.getElementById("unity-monitoring-frame");

    iframe?.contentWindow?.postMessage(
      {
        type: "SELECT_BEACON_ZONE",

        payload: {
          elementId: marker.elementId,

          placementName: marker.placementName,

          x: marker.x,

          y: marker.y,

          studentCount: marker.studentCount,

          students: marker.students || [],
        },
      },
      "*",
    );
  };

  // =========================
  // loading
  // =========================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa]">
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
          모니터링 데이터 불러오는 중...
        </div>
      </div>
    );
  }

  // =========================
  // render
  // =========================

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#F9FBE7]">
      <Navbar />

      <div className="flex-1 overflow-auto px-8 pb-8 pt-3 bg-[#F9FBE7] space-y-5">
        {/* header */}

        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#2E7D32] mb-2">
              실시간 통합 모니터링
            </h2>

            <p className="text-sm text-gray-600">
              마지막 갱신 :{lastUpdatedAt}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAllData}
            className="rounded-xl bg-[#66BB6A] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#2E7D32]"
          >
            새로고침
          </button>
        </div>

        {/* error */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* summary */}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[#C8E6C9] bg-white p-5 shadow-md">
            <p className="text-sm text-gray-500">전체 학생 수</p>

            <p className="mt-2 text-4xl font-bold text-[#2E7D32]">
              {totalStudentCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#C8E6C9] bg-white p-5 shadow-md">
            <p className="text-sm text-gray-500">위험 구역 학생 수</p>

            <p className="mt-2 text-4xl font-bold text-[#C62828]">
              {dangerCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#C8E6C9] bg-white p-5 shadow-md">
            <p className="text-sm text-gray-500">현재 층 비콘 수</p>

            <p className="mt-2 text-4xl font-bold text-[#1976D2]">
              {markers.length}
            </p>
          </div>
        </section>

        {/* floor tabs */}

        <div className="flex flex-wrap gap-2">
          {floors.map((floor) => {
            const isActive =
              Number(floor.floorIndex) === Number(selectedFloor?.floorIndex);

            return (
              <button
                key={floor.floorIndex}
                type="button"
                onClick={() => {
                  setSelectedFloorIndex(floor.floorIndex);

                  setSelectedMarker(null);
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium border transition ${
                  isActive
                    ? "bg-[#66BB6A] text-white border-[#66BB6A] shadow-sm"
                    : "bg-white text-[#2E7D32] border-[#A5D6A7] hover:bg-[#F1F8E9]"
                }`}
              >
                {floor.floorLabel || `${floor.floorIndex + 1}층`}
              </button>
            );
          })}
        </div>

        {/* main */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* 2D */}

          <section className="rounded-2xl border border-[#C8E6C9] bg-white p-6 shadow-md">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-[#2E7D32]">
                2D 구조도 모니터링
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                비콘 클릭 시 학생 상세 정보 확인 가능
              </p>
            </div>

            <div
              className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-[#F1F8E9]"
              style={{
                aspectRatio: "1710 / 423",
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="구조도"
                  className="absolute inset-0 h-full w-full object-contain select-none"
                  draggable={false}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  구조도 이미지 없음
                </div>
              )}

              {/* zones */}

              {zoneElements.map((element) => {
                const left = `${(element.x / 1710) * 100}%`;

                const top = `${(element.y / 423) * 100}%`;

                const width = `${((element.width ?? 0) / 1710) * 100}%`;

                const height = `${((element.height ?? 0) / 423) * 100}%`;

                return (
                  <div
                    key={element.id}
                    className={`absolute rounded-lg border-2 ${
                      element.type === "안전 구역"
                        ? "border-green-600 bg-green-500/20"
                        : ""
                    } ${
                      element.type === "재난 구역"
                        ? "border-red-600 bg-red-500/20"
                        : ""
                    } ${
                      element.type === "제한 구역"
                        ? "border-yellow-500 bg-yellow-400/20"
                        : ""
                    }`}
                    style={{
                      left,
                      top,
                      width,
                      height,
                    }}
                  />
                );
              })}

              {/* markers */}

              {markers.map((marker) => {
                const left = `${(marker.x / 1710) * 100}%`;

                const top = `${(marker.y / 423) * 100}%`;

                const selected = selectedMarker?.elementId === marker.elementId;

                return (
                  <button
                    key={marker.elementId}
                    type="button"
                    onClick={() => handleSelectMarker(marker)}
                    className={`absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-sm font-bold text-white shadow-lg transition ${
                      selected
                        ? "bg-green-600 ring-4 ring-green-200"
                        : "bg-blue-500 hover:brightness-110"
                    }`}
                    style={{
                      left,
                      top,
                    }}
                  >
                    {marker.studentCount ?? 0}
                  </button>
                );
              })}
            </div>

            {/* selected students */}

            <div className="mt-4 rounded-2xl border border-[#DCEDC8] bg-[#F1F8E9] p-4">
              {!selectedMarker ? (
                <p className="text-sm text-gray-500">비콘을 선택하세요.</p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="font-bold text-gray-800">
                      {selectedMarker.placementName || "비콘"}
                    </p>

                    <p className="text-sm text-gray-500">
                      {selectedMarker.zoneType}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(selectedMarker.students || []).map((student) => {
                      const state = getStudentDetectState(student);

                      return (
                        <div
                          key={student.studentId}
                          className="rounded-xl border border-[#C8E6C9] bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-gray-800">
                                {student.studentName}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                신호 :{getSignalText(student.lastRssi)}
                              </p>

                              <p className="text-xs text-gray-500">
                                마지막 감지 :{formatTime(student.lastSeenAt)}
                              </p>
                            </div>

                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                state === "DETECTED"
                                  ? "bg-[#E8F5E9] text-[#2E7D32]"
                                  : state === "LOST"
                                    ? "bg-[#FFEBEE] text-[#C62828]"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {state}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 3D */}

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-[#2E7D32]">
                3D 메타버스 모니터링
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Unity WebGL 실시간 연동
              </p>
            </div>

            <div className="h-[420px] overflow-hidden rounded-lg border border-gray-200 bg-[#F1F8E9]">
              <iframe
                id="unity-monitoring-frame"
                src={unityUrl}
                width="100%"
                height="100%"
                title="Unity WebGL Monitoring"
                className="h-full w-full border-0"
              />
            </div>
          </section>
        </div>

        {/* 전체 학생 */}

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#2E7D32]">전체 학생 현황</h3>

            <span className="text-sm text-gray-500">
              총 {allStudents.length}명
            </span>
          </div>

          <div className="overflow-auto rounded-2xl border border-[#C8E6C9]">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F1F8E9]">
                <tr>
                  <th className="border-b px-4 py-3 text-left font-semibold text-gray-700">
                    학생명
                  </th>

                  <th className="border-b px-4 py-3 text-left font-semibold text-gray-700">
                    상태
                  </th>

                  <th className="border-b px-4 py-3 text-left font-semibold text-gray-700">
                    위치
                  </th>

                  <th className="border-b px-4 py-3 text-left font-semibold text-gray-700">
                    신호
                  </th>

                  <th className="border-b px-4 py-3 text-left font-semibold text-gray-700">
                    마지막 감지
                  </th>
                </tr>
              </thead>

              <tbody>
                {allStudents.map((student) => {
                  const state = getStudentDetectState(student);

                  return (
                    <tr key={student.studentId}>
                      <td className="border-b px-4 py-3 text-gray-700">
                        {student.studentName}
                      </td>

                      <td className="border-b px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            state === "DETECTED"
                              ? "bg-green-100 text-green-700"
                              : state === "LOST"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {state}
                        </span>
                      </td>

                      <td className="border-b px-4 py-3 text-gray-700">
                        {student.beaconId || "미감지"}
                      </td>

                      <td className="border-b px-4 py-3 text-gray-700">
                        {getSignalText(student.lastRssi)}
                      </td>

                      <td className="border-b px-4 py-3 text-gray-700">
                        {formatTime(student.lastSeenAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
