import React, { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL || "https://disasterar.onenyang.shop";

const MOCK_MONITORING_DATA = {
  classroomId: "test-room",
  mapVersionId: "mock-map-version",
  floors: [
    {
      floorIndex: 0,
      floorLabel: "1층",
      image: {
        src: null,
        naturalWidth: 1710,
        naturalHeight: 423,
      },
      beaconMarkers: [
        {
          elementId: "beacon-1",
          placementName: "1학년 1반",
          zoneType: "방",
          x: 300,
          y: 160,
          studentCount: 2,
          students: [
            {
              studentId: "s1",
              studentName: "학생A",
              beaconState: "DETECTED",
              lastRssi: -55,
              lastSeenAt: new Date().toISOString(),
            },
            {
              studentId: "s2",
              studentName: "학생B",
              beaconState: "DETECTED",
              lastRssi: -61,
              lastSeenAt: new Date().toISOString(),
            },
          ],
        },
        {
          elementId: "beacon-2",
          placementName: "복도",
          zoneType: "제한 구역",
          x: 850,
          y: 210,
          studentCount: 1,
          students: [
            {
              studentId: "s3",
              studentName: "학생C",
              beaconState: "LOST",
              lastRssi: -78,
              lastSeenAt: new Date().toISOString(),
            },
          ],
        },
      ],
    },
  ],
};

function resolveImageUrl(src) {
  if (!src) return "";

  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  const baseUrl = API_BASE.replace(/\/$/, "");
  const path = src.startsWith("/") ? src : `/${src}`;

  return `${baseUrl}${path}`;
}

function formatTime(value) {
  if (!value) return "-";
  return String(value).replace("T", " ").slice(0, 19);
}

function getBeaconStateStyle(state) {
  const normalized = String(state || "").toUpperCase();

  if (normalized === "DETECTED") {
    return "bg-green-100 text-green-700 border-green-200";
  }

  if (normalized === "LOST") {
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }

  return "bg-gray-100 text-gray-600 border-gray-200";
}

export default function Monitoring() {
  const [data, setData] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [selectedFloorIndex, setSelectedFloorIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const classroomId = useMemo(() => {
    return (
      localStorage.getItem("classroomId") ||
      localStorage.getItem("roomId") ||
      ""
    );
  }, []);

  const activeMapVersionId = useMemo(() => {
    return (
      localStorage.getItem("activeMapVersionId") || data?.mapVersionId || ""
    );
  }, [data?.mapVersionId]);

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const floors = useMemo(() => {
    return Array.isArray(data?.floors) ? data.floors : [];
  }, [data]);

  const currentFloor = useMemo(() => {
    return floors[selectedFloorIndex] || floors[0] || null;
  }, [floors, selectedFloorIndex]);

  const imageUrl = useMemo(() => {
    return resolveImageUrl(currentFloor?.image?.src);
  }, [currentFloor]);

  const naturalWidth = useMemo(() => {
    return (
      currentFloor?.image?.naturalWidth ||
      currentFloor?.image?.natural?.w ||
      currentFloor?.image?.natural?.width ||
      1710
    );
  }, [currentFloor]);

  const naturalHeight = useMemo(() => {
    return (
      currentFloor?.image?.naturalHeight ||
      currentFloor?.image?.natural?.h ||
      currentFloor?.image?.natural?.height ||
      423
    );
  }, [currentFloor]);

  const markers = useMemo(() => {
    return Array.isArray(currentFloor?.beaconMarkers)
      ? currentFloor.beaconMarkers
      : [];
  }, [currentFloor]);

  const allStudents = useMemo(() => {
    return floors.flatMap((floor) =>
      (floor.beaconMarkers || []).flatMap((marker) =>
        (marker.students || []).map((student) => ({
          ...student,
          floorLabel: floor.floorLabel || `${floor.floorIndex ?? 0}층`,
          placementName: marker.placementName,
          zoneType: marker.zoneType,
          markerX: marker.x,
          markerY: marker.y,
        })),
      ),
    );
  }, [floors]);

  const totalStudentCount = useMemo(() => {
    return markers.reduce(
      (sum, marker) => sum + Number(marker.studentCount || 0),
      0,
    );
  }, [markers]);

  const dangerCount = useMemo(() => {
    return markers
      .filter((marker) =>
        ["재난 구역", "제한 구역", "화재 구역"].includes(marker.zoneType),
      )
      .reduce((sum, marker) => sum + Number(marker.studentCount || 0), 0);
  }, [markers]);

  const unityUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (classroomId) params.set("classroomId", classroomId);
    if (activeMapVersionId)
      params.set("activeMapVersionId", activeMapVersionId);
    if (currentFloor?.floorIndex !== undefined) {
      params.set("floorIndex", currentFloor.floorIndex);
    }

    return `/WebGL/index.html?${params.toString()}`;
  }, [classroomId, activeMapVersionId, currentFloor?.floorIndex]);

  const fetchActiveMapImageFloors = useCallback(async () => {
    if (!classroomId) return null;

    const response = await fetch(`${API_BASE}/api/rooms/${classroomId}/map`, {
      headers: {
        ...authHeaders,
      },
    });

    if (!response.ok) {
      throw new Error(`활성 구조도 API 호출 실패: ${response.status}`);
    }

    const mapData = await response.json();

    if (!mapData?.floorsJson) return null;

    const parsedFloors = JSON.parse(mapData.floorsJson);
    if (!Array.isArray(parsedFloors)) return null;

    return {
      mapVersionId: mapData.mapVersionId,
      floors: parsedFloors,
    };
  }, [classroomId, authHeaders]);

  const fetchMonitoringMap = useCallback(async () => {
    try {
      setError("");

      if (!classroomId) {
        throw new Error("classroomId가 없습니다.");
      }

      const [monitoringResult, activeMapResult] = await Promise.allSettled([
        fetch(`${API_BASE}/api/rooms/${classroomId}/monitoring-map`, {
          headers: {
            ...authHeaders,
          },
        }),
        fetchActiveMapImageFloors(),
      ]);

      let monitoringData = null;

      if (
        monitoringResult.status === "fulfilled" &&
        monitoringResult.value.ok
      ) {
        monitoringData = await monitoringResult.value.json();
      } else {
        console.warn("monitoring-map 실패 → 더미 데이터 사용");
        monitoringData = MOCK_MONITORING_DATA;
      }

      let activeMapData = null;

      if (activeMapResult.status === "fulfilled") {
        activeMapData = activeMapResult.value;
      }

      if (activeMapData?.floors?.length > 0) {
        const mergedFloors = monitoringData.floors.map((floor, index) => {
          const mapFloor =
            activeMapData.floors.find(
              (f) =>
                Number(f.floorIndex ?? f.floor ?? index) ===
                Number(floor.floorIndex ?? index),
            ) || activeMapData.floors[index];

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
                mapFloor?.image?.naturalWidth ||
                1710,
              naturalHeight:
                floor.image?.naturalHeight ||
                mapFloor?.image?.natural?.h ||
                mapFloor?.image?.naturalHeight ||
                423,
              natural: floor.image?.natural || mapFloor?.image?.natural || null,
            },
          };
        });

        monitoringData = {
          ...monitoringData,
          mapVersionId:
            monitoringData.mapVersionId ||
            activeMapData.mapVersionId ||
            activeMapVersionId,
          floors: mergedFloors,
        };
      }

      setData(monitoringData);
    } catch (err) {
      console.warn("모니터링 전체 실패 → 임시 데이터 사용:", err);
      setData(MOCK_MONITORING_DATA);
      setError("");
    } finally {
      setLoading(false);
    }
  }, [classroomId, authHeaders, activeMapVersionId, fetchActiveMapImageFloors]);

  useEffect(() => {
    fetchMonitoringMap();

    // 백엔드 준비 후 실시간 갱신 사용
    // const timer = setInterval(fetchMonitoringMap, 2000);
    // return () => clearInterval(timer);
  }, [fetchMonitoringMap]);

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

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col">
      <Navbar />

      <main className="p-6 lg:p-8 space-y-6">
        <section className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#2E7D32]">
              실시간 통합 모니터링
            </h2>
          </div>

          <button
            type="button"
            onClick={fetchMonitoringMap}
            className="self-start rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            새로고침
          </button>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-gray-500">
            모니터링 데이터를 불러오는 중입니다.
          </div>
        )}

        {!loading && !error && !currentFloor && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-gray-500">
            연결된 구조도 데이터가 없습니다.
          </div>
        )}

        {!loading && currentFloor && (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">현재 층 학생 수</p>
                <p className="mt-2 text-3xl font-bold text-[#2E7D32]">
                  {totalStudentCount}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">위험/제한 구역 학생 수</p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {dangerCount}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">전체 감지 학생 수</p>
                <p className="mt-2 text-3xl font-bold text-gray-800">
                  {allStudents.length}
                </p>
              </div>
            </section>

            {floors.length > 1 && (
              <section className="flex flex-wrap gap-2">
                {floors.map((floor, index) => (
                  <button
                    key={`${floor.floorIndex}-${index}`}
                    type="button"
                    onClick={() => {
                      setSelectedFloorIndex(index);
                      setSelectedMarker(null);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium border ${
                      selectedFloorIndex === index
                        ? "bg-[#2E7D32] text-white border-[#2E7D32]"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {floor.floorLabel || `${floor.floorIndex ?? index}층`}
                  </button>
                ))}
              </section>
            )}

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-[#2E7D32]">
                      2D 모니터링 공간
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      숫자를 클릭하면 해당 구역과 학생 상태를 확인할 수
                      있습니다.
                    </p>
                  </div>

                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    {currentFloor.floorLabel ||
                      `${currentFloor.floorIndex ?? 0}층`}
                  </span>
                </div>

                <div
                  className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                  style={{
                    aspectRatio: `${naturalWidth} / ${naturalHeight}`,
                  }}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="구조도"
                      draggable={false}
                      className="absolute inset-0 h-full w-full select-none object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      구조도 이미지가 없습니다.
                    </div>
                  )}

                  {markers.map((marker) => {
                    const left = `${(Number(marker.x || 0) / naturalWidth) * 100}%`;
                    const top = `${(Number(marker.y || 0) / naturalHeight) * 100}%`;
                    const selected =
                      selectedMarker?.elementId === marker.elementId;

                    return (
                      <button
                        key={marker.elementId}
                        type="button"
                        onClick={() => handleSelectMarker(marker)}
                        title={marker.placementName}
                        className={`absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-sm font-bold text-white shadow-lg transition ${
                          selected
                            ? "bg-green-600 ring-4 ring-green-200"
                            : "bg-blue-500 hover:brightness-110"
                        }`}
                        style={{ left, top }}
                      >
                        {marker.studentCount || 0}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  {!selectedMarker ? (
                    <p className="text-sm text-gray-500">
                      비콘 마커를 선택하면 구역 상세 정보가 표시됩니다.
                    </p>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-gray-800">
                            {selectedMarker.placementName}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {selectedMarker.zoneType || "구역 정보 없음"}
                          </p>
                        </div>

                        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                          {selectedMarker.studentCount || 0}명
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        {selectedMarker.students?.length > 0 ? (
                          selectedMarker.students.map((student) => (
                            <div
                              key={student.studentId}
                              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-bold text-gray-800">
                                  {student.studentName || "이름 없음"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  RSSI: {student.lastRssi ?? "-"} / 마지막 감지:{" "}
                                  {formatTime(student.lastSeenAt)}
                                </p>
                              </div>

                              <span
                                className={`rounded-full border px-2 py-1 text-xs font-medium ${getBeaconStateStyle(
                                  student.beaconState,
                                )}`}
                              >
                                {student.beaconState || "-"}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">
                            현재 이 구역에 감지된 학생이 없습니다.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-[#2E7D32]">
                    3D 모니터링 공간
                  </h3>
                </div>

                <div className="w-full aspect-video overflow-hidden rounded-lg border border-gray-200 bg-[#f3f4f6]">
                  <iframe
                    id="unity-monitoring-frame"
                    key={unityUrl}
                    src={unityUrl}
                    width="100%"
                    height="100%"
                    title="Unity WebGL Monitoring"
                    style={{
                      border: "none",
                      display: "block",
                      width: "100%",
                      height: "100%",
                    }}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold text-[#2E7D32]">
                  전체 학생 현황
                </h3>
                <span className="text-sm text-gray-500">
                  총 {allStudents.length}명
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {allStudents.length > 0 ? (
                  allStudents.map((student) => (
                    <div
                      key={`${student.studentId}-${student.placementName}`}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-gray-800">
                            {student.studentName || "이름 없음"}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            위치: {student.floorLabel} /{" "}
                            {student.placementName || "-"}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            RSSI: {student.lastRssi ?? "-"}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-medium ${getBeaconStateStyle(
                            student.beaconState,
                          )}`}
                        >
                          {student.beaconState || "-"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                    현재 감지된 학생이 없습니다.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
