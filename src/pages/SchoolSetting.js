// src/pages/SchoolSetting.js
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import { useLocation } from "react-router-dom";

const API_BASE = "https://disasterar.onenyang.shop";

export default function SchoolSetting() {
  const location = useLocation();

  const classroomId = useMemo(() => {
    return (
      location.state?.classroomId ||
      location.state?.roomId ||
      location.state?.classroomID ||
      null
    );
  }, [location.state]);

  const schoolId = useMemo(() => {
    return location.state?.schoolId || localStorage.getItem("schoolId") || null;
  }, [location.state]);

  const thumbnailImage = useMemo(() => {
    return (
      location.state?.thumbnailImage ||
      localStorage.getItem("thumbnailImage") ||
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
  console.log("SchoolSetting location.state =", location.state);
  console.log("SchoolSetting classroomId =", classroomId);
  console.log("SchoolSetting schoolId =", schoolId);
  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const [mapVersions, setMapVersions] = useState([]);
  const [activeMapVersionId, setActiveMapVersionId] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedTemplateDetail, setSelectedTemplateDetail] = useState(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");

  const [beaconList, setBeaconList] = useState([]);
  const [beaconLoading, setBeaconLoading] = useState(false);

  // ====== Viewport ======
  const VIEW_W = 900;
  const VIEW_H = 600;
  const MIN_ZOOM = 0.5;

  const viewportRef = useRef(null);
  const menuRef = useRef(null);

  const [autoAnalyzing, setAutoAnalyzing] = useState(false);

  const [currentFloorIndex, setCurrentFloorIndex] = useState(0);
  const currentFloorIndexRef = useRef(0);
  useEffect(() => {
    currentFloorIndexRef.current = currentFloorIndex;
  }, [currentFloorIndex]);

  // 구조도(플랜) 모달
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const [uploadingMap, setUploadingMap] = useState(false);
  const fileInputRef = useRef(null);

  const analyzeRunIdRef = useRef(0);

  const toPublicImg = (raw) => {
    if (!raw || typeof raw !== "string") return null;

    const s = raw.trim();
    if (!s) return null;

    // 이미 완전한 URL이면 그대로 사용
    if (s.startsWith("http://") || s.startsWith("https://")) {
      return s;
    }

    // 서버 상대경로면 API_BASE 붙이기
    if (s.startsWith("/")) {
      return `${API_BASE}${s}`;
    }

    return `${API_BASE}/${s}`;
  };
  const planPreviewRef = useRef(null);
  const [planPreviewW, setPlanPreviewW] = useState(0);

  const showAxiosError = useCallback((title, errOrRes) => {
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
  }, []);

  const fetchMapVersions = useCallback(async () => {
    if (!classroomId) {
      setMapVersions([]);
      return;
    }

    try {
      setMapLoading(true);

      const res = await axios.get(
        `${API_BASE}/api/rooms/${classroomId}/map-versions`,
        {
          headers: { ...authHeaders },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      if (!(res.status >= 200 && res.status < 300)) {
        setMapVersions([]);
        showAxiosError("맵 버전 목록 조회 실패", res);
        return;
      }

      const list = Array.isArray(res.data) ? res.data : [];
      setMapVersions(list);
    } catch (err) {
      console.error(err);
      setMapVersions([]);
      showAxiosError("맵 버전 목록 조회 중 오류", err);
    } finally {
      setMapLoading(false);
    }
  }, [classroomId, authHeaders, showAxiosError]);

  useEffect(() => {
    if (!isPlanModalOpen) return;

    fetchMapVersions();

    const el = planPreviewRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      setPlanPreviewW(el.clientWidth || 0);
    });
    ro.observe(el);
    setPlanPreviewW(el.clientWidth || 0);

    return () => ro.disconnect();
  }, [isPlanModalOpen, fetchMapVersions]);

  useEffect(() => {
    if (isPlanModalOpen) {
      fetchMapVersions();
    }
  }, [isPlanModalOpen, fetchMapVersions]);

  // ====== Helpers ======
  const clamp = useCallback((v, a, b) => Math.max(a, Math.min(b, v)), []);
  const round4 = (n) =>
    typeof n === "number" ? Math.round(n * 10000) / 10000 : n;

  function typeColor(type, alpha = 0.25) {
    switch (type) {
      case "제한 구역":
        return `rgba(255,165,0,${alpha})`;
      case "재난 구역":
        return `rgba(255,0,0,${alpha})`;
      case "안전 구역":
        return `rgba(0,200,0,${alpha})`;
      case "방":
        return `rgba(0,112,255,${alpha})`;
      default:
        return `rgba(0,0,0,0)`;
    }
  }
  // ====== Floor model ======
  const makeEmptyFloor = useCallback(() => {
    return {
      imageSrc: null,
      uploadedFile: null,
      imgNatural: { w: 0, h: 0 },
      elements: [],
      undoStack: [],
      redoStack: [],
      hasAutoAnalysisResult: false,
      autoElementsCache: [],
      autoAnalysisHidden: false,
      abort: { analyze: null },
    };
  }, []);

  const [floorNames, setFloorNames] = useState(["1층"]);
  const [floors, setFloors] = useState([makeEmptyFloor()]);

  const currentFloor = floors[currentFloorIndex] || makeEmptyFloor();
  const imageSrc = currentFloor.imageSrc;
  const imgNatural = currentFloor.imgNatural || { w: 0, h: 0 };

  const elements = useMemo(
    () => currentFloor.elements ?? [],
    [currentFloor.elements],
  );

  const setElements = useCallback(
    (updater) => {
      setFloors((prev) => {
        const next = [...prev];
        const curr = next[currentFloorIndex] || makeEmptyFloor();
        const prevEls = curr.elements || [];
        const nextEls =
          typeof updater === "function" ? updater(prevEls) : updater;
        next[currentFloorIndex] = { ...curr, elements: nextEls };
        return next;
      });
    },
    [currentFloorIndex, makeEmptyFloor],
  );

  const pushUndoSnapshot = useCallback(() => {
    setFloors((prev) => {
      const next = [...prev];
      const curr = next[currentFloorIndex] || makeEmptyFloor();
      const snap = JSON.parse(JSON.stringify(curr.elements || []));
      next[currentFloorIndex] = {
        ...curr,
        undoStack: [...(curr.undoStack || []), snap],
        redoStack: [],
      };
      return next;
    });
  }, [currentFloorIndex, makeEmptyFloor]);

  const performUndoOnce = useCallback(() => {
    setFloors((prev) => {
      const next = [...prev];
      const curr = next[currentFloorIndex] || makeEmptyFloor();
      const undo = curr.undoStack || [];
      if (!undo.length) return prev;

      const last = undo[undo.length - 1];
      const rest = undo.slice(0, -1);

      next[currentFloorIndex] = {
        ...curr,
        elements: last,
        undoStack: rest,
        redoStack: [
          ...(curr.redoStack || []),
          JSON.parse(JSON.stringify(curr.elements || [])),
        ],
      };
      return next;
    });
  }, [currentFloorIndex, makeEmptyFloor]);

  const performRedoOnce = useCallback(() => {
    setFloors((prev) => {
      const next = [...prev];
      const curr = next[currentFloorIndex] || makeEmptyFloor();
      const redo = curr.redoStack || [];
      if (!redo.length) return prev;

      const last = redo[redo.length - 1];
      const rest = redo.slice(0, -1);

      next[currentFloorIndex] = {
        ...curr,
        elements: last,
        redoStack: rest,
        undoStack: [
          ...(curr.undoStack || []),
          JSON.parse(JSON.stringify(curr.elements || [])),
        ],
      };
      return next;
    });
  }, [currentFloorIndex, makeEmptyFloor]);

  // ====== Auto analyze (optional) ======
  const runAutoAnalyze = useCallback(
    async (floorIdx) => {
      const floor = floors[floorIdx];
      const mapId = floor?.mapId;

      if (!schoolId || !mapId) {
        alert("자동 분석할 mapId 또는 schoolId가 없습니다.");
        return;
      }

      const myRunId = ++analyzeRunIdRef.current;
      setAutoAnalyzing(true);

      setFloors((prev) => {
        const next = [...prev];
        const curr = next[floorIdx] || makeEmptyFloor();
        next[floorIdx] = { ...curr, autoAnalysisHidden: false };
        return next;
      });

      const controller = new AbortController();

      setFloors((prev) => {
        const next = [...prev];
        const curr = next[floorIdx] || makeEmptyFloor();
        curr?.abort?.analyze?.abort?.();
        next[floorIdx] = {
          ...curr,
          abort: { analyze: controller },
          autoAnalysisHidden: false,
        };
        return next;
      });

      try {
        const res = await fetch(
          `${API_BASE}/api/channels/${schoolId}/maps/${mapId}/analyze`,
          {
            method: "POST",
            headers: { ...authHeaders },
            signal: controller.signal,
          },
        );

        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();

        const serverElements = Array.isArray(data.elements)
          ? data.elements
          : [];
        const fixedElements = serverElements.map((el) => ({
          ...el,
          floor: floorIdx,
        }));

        if (myRunId !== analyzeRunIdRef.current) return;

        pushUndoSnapshot();

        setFloorNames((prev) => {
          const next = [...prev];
          next[floorIdx] =
            data.floorLabel || next[floorIdx] || `${floorIdx + 1}층`;
          return next;
        });

        setFloors((prev) => {
          const next = [...prev];
          const curr = next[floorIdx] || makeEmptyFloor();

          next[floorIdx] = {
            ...curr,
            mapId: data.mapId || curr.mapId,
            imageSrc: toPublicImg(data.uploadedImage) || curr.imageSrc,
            elements: fixedElements,
            hasAutoAnalysisResult: true,
            autoElementsCache: fixedElements,
            autoAnalysisHidden: false,
            ocrAvailable: !!data.ocrAvailable,
          };

          return next;
        });
      } catch (e) {
        console.error("자동 분석 에러:", e);
        if (e?.name !== "AbortError") {
          alert("자동 분석 실패\n" + (e?.message || "알 수 없는 오류"));
        }
      } finally {
        if (myRunId === analyzeRunIdRef.current) {
          setAutoAnalyzing(false);
          setFloors((prev) => {
            const next = [...prev];
            const curr = next[floorIdx] || makeEmptyFloor();
            next[floorIdx] = { ...curr, abort: { analyze: null } };
            return next;
          });
        }
      }
    },
    [floors, schoolId, authHeaders, makeEmptyFloor, pushUndoSnapshot],
  );
  // ====== UI State ======
  const modeButtons = ["제한 구역", "방", "문", "비콘", "건물윤곽"];
  const [mode, setMode] = useState(null);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const [showImage, setShowImage] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const w = currentFloor?.imgNatural?.w || 0;
    const h = currentFloor?.imgNatural?.h || 0;

    setZoom(1);
    setImgOffset({ x: 0, y: 0 });

    if (imageSrc && w > 0 && h > 0) {
      const fit = Math.min(VIEW_W / w, VIEW_H / h, 1);
      setFitScale(fit);
      setImageLoaded(true);
    } else {
      setFitScale(1);
      setImageLoaded(false);
    }
  }, [
    imageSrc,
    currentFloorIndex,
    currentFloor?.imgNatural?.w,
    currentFloor?.imgNatural?.h,
  ]);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const selectedIdsRef = useRef(selectedIds);
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  const [showHelp, setShowHelp] = useState(false);

  // 저장 모달
  const [isSavePlanModalOpen, setIsSavePlanModalOpen] = useState(false);
  const [savePlanName, setSavePlanName] = useState("");

  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [planFloorIdx, setPlanFloorIdx] = useState(0);
  const [selectedPlanDetail, setSelectedPlanDetail] = useState(null);

  const selectedPlan = useMemo(
    () => mapVersions.find((mv) => mv.mapVersionId === selectedPlanId) || null,
    [mapVersions, selectedPlanId],
  );

  const selectedPlanFloors = useMemo(() => {
    const floorsJson = selectedPlanDetail?.floorsJson || null;
    if (!floorsJson) return [];

    try {
      const parsed = JSON.parse(floorsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("selectedPlan floorsJson parse 실패 =", err, floorsJson);
      return [];
    }
  }, [selectedPlanDetail]);

  const previewFloor =
    selectedPlanFloors[planFloorIdx] || selectedPlanFloors[0] || null;

  useEffect(() => {
    if (!isPlanModalOpen) return;
    if (!mapVersions.length) return;

    const exists = mapVersions.some((mv) => mv.mapVersionId === selectedPlanId);
    if (!exists) {
      setSelectedPlanId(
        activeMapVersionId || mapVersions[0]?.mapVersionId || null,
      );
      setPlanFloorIdx(0);
    }
  }, [isPlanModalOpen, mapVersions, selectedPlanId, activeMapVersionId]);
  // Beacon UI tuning
  const BEACON_SIZE = 28; // 자연좌표 기준 비콘 원 크기
  const BEACON_FONT_MIN = 14; // 숫자 최소 폰트
  // ====== Beacon modal ======
  const [isBeaconModalOpen, setIsBeaconModalOpen] = useState(false);
  const [beaconForm, setBeaconForm] = useState({
    uuid: "",
    major: "",
    minor: "",
  });
  const [pendingBeaconNat, setPendingBeaconNat] = useState(null);

  const [editingBeaconId, setEditingBeaconId] = useState(null);

  // 현재 층에서 다음 비콘 번호 계산 (1부터)
  const nextBeaconNo = useMemo(() => {
    const currentServerBeacons = (beaconList || []).filter(
      (b) => Number(b.floorIndex) === Number(currentFloorIndex),
    );
    const maxNo = currentServerBeacons.reduce(
      (m, b) => Math.max(m, Number(b.beaconNo || 0)),
      0,
    );
    return maxNo + 1;
  }, [beaconList, currentFloorIndex]);

  const fetchBeacons = useCallback(async () => {
    if (!schoolId) {
      setBeaconList([]);
      return;
    }

    try {
      setBeaconLoading(true);

      const res = await axios.get(`${API_BASE}/api/beacons`, {
        params: { schoolId },
        headers: { ...authHeaders },
        timeout: 30000,
        validateStatus: () => true,
      });

      console.log("비콘 목록 조회 응답 =", res.status, res.data);

      if (!(res.status >= 200 && res.status < 300)) {
        setBeaconList([]);
        showAxiosError("비콘 목록 조회 실패", res);
        return;
      }

      const list = Array.isArray(res.data) ? res.data : [];
      setBeaconList(list);
    } catch (err) {
      console.error(err);
      setBeaconList([]);
      showAxiosError("비콘 목록 조회 중 오류", err);
    } finally {
      setBeaconLoading(false);
    }
  }, [schoolId, authHeaders, showAxiosError]);
  const createBeaconOnServer = useCallback(
    async ({ floorIndex, x, y, uuid, major, minor, beaconNo }) => {
      if (!schoolId) {
        alert("schoolId가 없습니다.");
        return null;
      }

      const payload = {
        schoolId: String(schoolId),
        floorIndex: Number(floorIndex),
        uuid: String(uuid).trim(),
        major: Number(major),
        minor: Number(minor),
        beaconNo: Number(beaconNo),
        mac: "",
        x: Number(x),
        y: Number(y),
        realXM: 0,
        realYM: 0,
        realZM: 0,
        name: `비콘 ${beaconNo}`,
        txPower: 0,
      };

      console.log("=== 비콘 등록 payload ===");
      console.log(JSON.stringify(payload, null, 2));
      console.log("payload.schoolId =", payload.schoolId);
      console.log("payload.floorIndex =", payload.floorIndex);
      console.log("payload.uuid =", payload.uuid);
      console.log("payload.major =", payload.major);
      console.log("payload.minor =", payload.minor);
      console.log("payload.beaconNo =", payload.beaconNo);
      console.log("payload.x =", payload.x);
      console.log("payload.y =", payload.y);

      const res = await axios.post(`${API_BASE}/api/beacons`, payload, {
        headers: { "Content-Type": "application/json", ...authHeaders },
        timeout: 10000,
        validateStatus: () => true,
      });

      console.log("=== 비콘 등록 응답 ===");
      console.log("status =", res.status);
      console.log("data =", res.data);

      if (!(res.status >= 200 && res.status < 300)) {
        showAxiosError("비콘 등록 실패", res);
        return null;
      }

      return res.data || null;
    },
    [schoolId, authHeaders, showAxiosError],
  );
  const updateBeaconOnServer = useCallback(
    async (beaconId, payload) => {
      console.log("비콘 수정 beaconId =", beaconId);
      console.log("비콘 수정 payload =", payload);

      const res = await axios.put(
        `${API_BASE}/api/beacons/${beaconId}`,
        payload,
        {
          headers: { "Content-Type": "application/json", ...authHeaders },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      console.log("비콘 수정 응답 =", res.status, res.data);

      if (!(res.status >= 200 && res.status < 300)) {
        showAxiosError("비콘 수정 실패", res);
        return null;
      }

      return res.data || null;
    },
    [authHeaders, showAxiosError],
  );
  const deleteBeaconOnServer = useCallback(
    async (beaconId) => {
      console.log("비콘 삭제 beaconId =", beaconId);

      const res = await axios.delete(`${API_BASE}/api/beacons/${beaconId}`, {
        headers: { ...authHeaders },
        timeout: 10000,
        validateStatus: () => true,
      });

      console.log("비콘 삭제 응답 =", res.status, res.data);

      if (!(res.status >= 200 && res.status < 300)) {
        showAxiosError("비콘 삭제 실패", res);
        return false;
      }

      return true;
    },
    [authHeaders, showAxiosError],
  );

  const confirmAddBeacon = useCallback(async () => {
    console.log("===== 비콘 추가 클릭 =====");
    console.log("현재 층 index =", currentFloorIndex);
    console.log("현재 층 elements =", floors[currentFloorIndex]?.elements);
    console.log(
      "현재 층 비콘 elements =",
      (floors[currentFloorIndex]?.elements || []).filter(
        (el) => el.type === "비콘",
      ),
    );
    console.log("서버 beaconList =", beaconList);

    if (!pendingBeaconNat) return alert("위치를 먼저 선택하세요.");

    const uuid = (beaconForm.uuid || "").trim();
    const majorNum = Number(beaconForm.major);
    const minorNum = Number(beaconForm.minor);

    if (!uuid) return alert("UUID를 입력하세요.");
    if (!Number.isInteger(majorNum)) return alert("Major는 정수로 입력하세요.");
    if (!Number.isInteger(minorNum)) return alert("Minor는 정수로 입력하세요.");

    const floorIdx = pendingBeaconNat.floorIdx ?? currentFloorIndex;

    pushUndoSnapshot();

    // 수정 모드
    if (editingBeaconId) {
      const localBeacon = elements.find((el) => el.id === editingBeaconId);
      const serverBeaconId = localBeacon?.serverBeaconId;

      if (!serverBeaconId) {
        alert("서버 비콘 ID가 없어 수정할 수 없습니다.");
        return;
      }

      const payload = {
        schoolId,
        floorIndex: floorIdx,
        uuid,
        major: majorNum,
        minor: minorNum,
        beaconNo: localBeacon?.beaconNo || nextBeaconNo,
        mac: localBeacon?.mac || "",
        x: pendingBeaconNat.x,
        y: pendingBeaconNat.y,
        realXM: localBeacon?.realXM || 0,
        realYM: localBeacon?.realYM || 0,
        realZM: localBeacon?.realZM || 0,
        name:
          localBeacon?.name || `비콘 ${localBeacon?.beaconNo || nextBeaconNo}`,
        txPower: localBeacon?.txPower || 0,
      };

      const updated = await updateBeaconOnServer(serverBeaconId, payload);
      if (!updated) return;

      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== editingBeaconId) return el;
          return {
            ...el,
            beaconUuid: uuid,
            beaconMajor: majorNum,
            beaconMinor: minorNum,
            x: pendingBeaconNat.x,
            y: pendingBeaconNat.y,
            width: el.width || BEACON_SIZE,
            height: el.height || BEACON_SIZE,
          };
        }),
      );
      const mapId = floors[floorIdx]?.mapId;
      if (mapId) {
        await updateMapToServer(mapId, floorIdx);
      }
      await fetchBeacons();

      setIsBeaconModalOpen(false);
      setPendingBeaconNat(null);
      setEditingBeaconId(null);
      return;
    }

    // 추가 모드
    const created = await createBeaconOnServer({
      floorIndex: floorIdx,
      x: pendingBeaconNat.x,
      y: pendingBeaconNat.y,
      uuid,
      major: majorNum,
      minor: minorNum,
      beaconNo: nextBeaconNo,
    });

    if (!created) return;

    const id = `beacon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newBeacon = {
      id,
      type: "비콘",
      x: pendingBeaconNat.x,
      y: pendingBeaconNat.y,
      width: BEACON_SIZE,
      height: BEACON_SIZE,
      floor: floorIdx,
      beaconUuid: uuid,
      beaconMajor: majorNum,
      beaconMinor: minorNum,
      beaconNo: created.beaconNo ?? nextBeaconNo,
      serverBeaconId: created.beaconId,
      mac: created.mac || "",
      realXM: created.realXM || 0,
      realYM: created.realYM || 0,
      realZM: created.realZM || 0,
      name: created.name || `비콘 ${created.beaconNo ?? nextBeaconNo}`,
      txPower: created.txPower || 0,
    };

    setElements((prev) => [...prev, newBeacon]);
    setSelectedId(id);
    setSelectedIds([id]);
    const mapId = floors[floorIdx]?.mapId;
    if (mapId) {
      await updateMapToServer(mapId, floorIdx);
    }
    await fetchBeacons();

    setIsBeaconModalOpen(false);
    setPendingBeaconNat(null);
    setEditingBeaconId(null);
  }, [
    pendingBeaconNat,
    beaconForm,
    currentFloorIndex,
    nextBeaconNo,
    pushUndoSnapshot,
    editingBeaconId,
    elements,
    schoolId,
    BEACON_SIZE,
    updateBeaconOnServer,
    createBeaconOnServer,
    fetchBeacons,
    setElements,
    setSelectedId,
    setSelectedIds,
  ]);

  // 현재 파일의 “층 라벨”
  const currentFloorLabel = useMemo(() => {
    return floorNames[currentFloorIndex] || `${currentFloorIndex + 1}층`;
  }, [currentFloorIndex, floorNames]);

  const buildFloorsPayload = useCallback(() => {
    return floors.map((f, idx) => ({
      name: floorNames[idx] || `${idx + 1}층`,
      image: {
        src: f.imageSrc || null,
        natural: f.imgNatural || { w: 0, h: 0 },
      },
      elements: (f.elements || []).map((el) => ({
        ...el,
        floor: idx,
      })),
    }));
  }, [floors, floorNames]);

  const fetchActiveMap = useCallback(async () => {
    if (!classroomId) return;

    try {
      const res = await axios.get(`${API_BASE}/api/rooms/${classroomId}/map`, {
        headers: { ...authHeaders },
        timeout: 10000,
        validateStatus: () => true,
      });

      if (!(res.status >= 200 && res.status < 300)) {
        return;
      }

      const data = res.data || {};
      setActiveMapVersionId(data.mapVersionId || null);

      if (!data.floorsJson) return;

      const parsedFloors = JSON.parse(data.floorsJson);
      if (!Array.isArray(parsedFloors) || parsedFloors.length === 0) return;

      setFloorNames(parsedFloors.map((f, idx) => f?.name || `${idx + 1}층`));

      setFloors(
        parsedFloors.map((f, idx) => ({
          imageSrc: f?.image?.src || null,
          uploadedFile: null,
          imgNatural: f?.image?.natural || { w: 0, h: 0 },
          elements: Array.isArray(f?.elements)
            ? f.elements.map((el) => ({ ...el, floor: idx }))
            : [],
          undoStack: [],
          redoStack: [],
          hasAutoAnalysisResult: false,
          autoElementsCache: [],
          autoAnalysisHidden: false,
          abort: { analyze: null },
        })),
      );

      setCurrentFloorIndex((prev) =>
        Math.min(prev, Math.max(parsedFloors.length - 1, 0)),
      );
    } catch (err) {
      console.error(err);
    }
  }, [classroomId, authHeaders]);
  const fetchSchoolMaps = useCallback(async () => {
    if (!schoolId) return;

    try {
      const res = await axios.get(`${API_BASE}/api/channels/${schoolId}/maps`, {
        headers: { ...authHeaders },
        timeout: 30000,
        validateStatus: () => true,
      });
      console.log("🔥 maps 응답:", res.data);

      if (!(res.status >= 200 && res.status < 300)) {
        showAxiosError("학교 구조도 조회 실패", res);
        return;
      }

      const list = Array.isArray(res.data) ? res.data : [];
      console.log("school maps res.data =", list);

      if (list.length === 0) {
        setFloorNames(["1층"]);
        setFloors([
          {
            ...makeEmptyFloor(),
            imageSrc: toPublicImg(thumbnailImage),
          },
        ]);
        setCurrentFloorIndex(0);
        return;
      }

      const sorted = [...list].sort(
        (a, b) => (a.floorIndex ?? 0) - (b.floorIndex ?? 0),
      );
      console.log(
        "층 목록 확인",
        sorted.map((m, idx) => ({
          idx,
          floorIndex: m.floorIndex,
          floorLabel: m.floorLabel,
          uploadedImage: m.uploadedImage,
          thumbnailImage: m.thumbnailImage,
          finalImage: toPublicImg(
            m.uploadedImage || m.thumbnailImage || thumbnailImage,
          ),
        })),
      );

      setFloorNames(
        sorted.map(
          (m, idx) => m.floorLabel || `${(m.floorIndex ?? idx) + 1}층`,
        ),
      );
      console.log(
        "🔥 최종 imageSrc 목록:",
        sorted.map((m) =>
          toPublicImg(m.uploadedImage || m.thumbnailImage || thumbnailImage),
        ),
      );
      setFloors((prevFloors) =>
        sorted.map((m, idx) => {
          let parsedElements = [];
          try {
            parsedElements = m.elementsJson ? JSON.parse(m.elementsJson) : [];
          } catch {
            parsedElements = [];
          }

          const nextImageSrc = toPublicImg(
            m.uploadedImage || m.thumbnailImage || thumbnailImage,
          );

          const prevFloor = prevFloors[idx];
          const keepNatural =
            prevFloor?.imageSrc === nextImageSrc ? prevFloor.imgNatural : null;

          return {
            mapId: m.mapId,
            imageSrc: nextImageSrc,
            uploadedFile: null,
            imgNatural: keepNatural || { w: 0, h: 0 },
            elements: Array.isArray(parsedElements)
              ? parsedElements.map((el) => ({ ...el, floor: idx }))
              : [],
            undoStack: [],
            redoStack: [],
            hasAutoAnalysisResult: false,
            autoElementsCache: [],
            autoAnalysisHidden: false,
            abort: { analyze: null },
          };
        }),
      );

      setCurrentFloorIndex((prev) =>
        Math.min(prev, Math.max(sorted.length - 1, 0)),
      );
    } catch (err) {
      console.error(err);
      showAxiosError("학교 구조도 조회 중 오류", err);
    }
  }, [schoolId, authHeaders, showAxiosError, makeEmptyFloor, thumbnailImage]);

  const fetchSingleMap = useCallback(
    async (mapId) => {
      if (!schoolId || !mapId) return null;

      try {
        const res = await axios.get(
          `${API_BASE}/api/channels/${schoolId}/maps/${mapId}`,
          {
            headers: { ...authHeaders },
            timeout: 30000,
            validateStatus: () => true,
          },
        );

        console.log("단일 구조도 조회 응답 =", res.status, res.data);

        if (!(res.status >= 200 && res.status < 300)) {
          showAxiosError("구조도 상세 조회 실패", res);
          return null;
        }

        return res.data || null;
      } catch (err) {
        console.error(err);
        showAxiosError("구조도 상세 조회 중 오류", err);
        return null;
      }
    },
    [schoolId, authHeaders, showAxiosError],
  );

  const updateMapToServer = useCallback(
    async (mapId, floorIdx) => {
      if (!schoolId || !mapId) {
        alert("schoolId 또는 mapId가 없습니다.");
        return null;
      }

      const floor = floors[floorIdx];
      if (!floor) {
        alert("저장할 층 정보가 없습니다.");
        return null;
      }

      const rawElements = floor.elements || [];

      const normalizedElements = rawElements.map((el) => {
        // 건물 윤곽은 points/rawPoints 중심으로 저장
        if (el.type === "건물윤곽") {
          return {
            id: el.id,
            type: el.type,
            floor: el.floor ?? floorIdx,
            points: Array.isArray(el.points) ? el.points : [],
            rawPoints: Array.isArray(el.rawPoints) ? el.rawPoints : [],
          };
        }

        // 비콘은 프론트 전용 필드(serverBeaconId, beaconUuid 등)를 최대한 빼고 저장
        if (el.type === "비콘") {
          return {
            id: el.id,
            type: el.type,
            floor: el.floor ?? floorIdx,
            x: Number(el.x ?? 0),
            y: Number(el.y ?? 0),
            width: Number(el.width ?? 28),
            height: Number(el.height ?? 28),
            beaconNo: Number(el.beaconNo ?? 0),
            name: el.name || "",
          };
        }

        // 문
        if (el.type === "문") {
          return {
            id: el.id,
            type: el.type,
            floor: el.floor ?? floorIdx,
            x: Number(el.x ?? 0),
            y: Number(el.y ?? 0),
            angle: Number(el.angle ?? 0),
          };
        }

        // 일반 박스형 요소(방, 제한구역 등)
        return {
          id: el.id,
          type: el.type,
          floor: el.floor ?? floorIdx,
          x: Number(el.x ?? 0),
          y: Number(el.y ?? 0),
          width: Number(el.width ?? 0),
          height: Number(el.height ?? 0),
          name: el.name || "",
        };
      });

      const outlineList = normalizedElements.filter(
        (el) => el.type === "건물윤곽",
      );

      const payload = {
        floorIndex: floorIdx,
        floorLabel: floorNames[floorIdx] || `${floorIdx + 1}층`,
        outlineJson: JSON.stringify(outlineList),
        scaleMPerPx: 0,
        originX: 0,
        originY: 0,
        elementsJson: JSON.stringify(normalizedElements),
      };

      console.log("구조도 수정 전 rawElements =", rawElements);
      console.log("구조도 수정 전 normalizedElements =", normalizedElements);
      console.log("구조도 수정 payload =", payload);
      console.log("payload.floorIndex =", payload.floorIndex);
      console.log("payload.floorLabel =", payload.floorLabel);
      console.log("payload.outlineJson =", payload.outlineJson);
      console.log("payload.elementsJson =", payload.elementsJson);

      try {
        const parsed = JSON.parse(payload.elementsJson);
        console.log("parsed elementsJson =", parsed);
      } catch (e) {
        console.error("elementsJson 파싱 실패 =", e);
      }

      try {
        const res = await axios.post(
          `${API_BASE}/api/channels/${schoolId}/maps/${mapId}`,
          payload,
          {
            headers: { "Content-Type": "application/json", ...authHeaders },
            timeout: 30000,
            validateStatus: () => true,
          },
        );

        console.log("구조도 수정 응답 =", res.status, res.data);

        if (!(res.status >= 200 && res.status < 300)) {
          showAxiosError("구조도 저장 실패", res);
          return null;
        }

        return res.data || null;
      } catch (err) {
        console.error(err);
        showAxiosError("구조도 저장 중 오류", err);
        return null;
      }
    },
    [schoolId, floors, floorNames, authHeaders, showAxiosError],
  );
  const handleSaveAsTemplate = async () => {
    if (!activeMapVersionId) {
      alert("먼저 맵 버전을 선택하세요.");
      return;
    }

    const templateName = prompt("템플릿 이름 입력");
    if (!templateName) return;

    try {
      const res = await axios.post(
        `${API_BASE}/api/rooms/${classroomId}/map-versions/${activeMapVersionId}/save-as-template`,
        {
          templateName,
          description: "",
        },
        {
          headers: { ...authHeaders },
        },
      );

      if (!(res.status >= 200 && res.status < 300)) {
        alert("템플릿 저장 실패");
        return;
      }

      alert("✅ 템플릿 저장 완료");
    } catch (err) {
      console.error(err);
      alert("템플릿 저장 중 오류");
    }
  };
  const applyAnalysisToMap = useCallback(
    async (mapId, floorIdx) => {
      if (!schoolId || !mapId) {
        alert("schoolId 또는 mapId가 없습니다.");
        return null;
      }

      const floor = floors[floorIdx];
      if (!floor) {
        alert("적용할 층 정보가 없습니다.");
        return null;
      }

      const outlineList = (floor.elements || []).filter(
        (el) => el.type === "건물윤곽",
      );

      const payload = {
        outlineJson: JSON.stringify(outlineList),
        elementsJson: JSON.stringify(floor.elements || []),
      };

      console.log("분석 결과 반영 payload =", payload);

      try {
        const res = await axios.post(
          `${API_BASE}/api/channels/${schoolId}/maps/${mapId}/analysis/apply`,
          payload,
          {
            headers: { "Content-Type": "application/json", ...authHeaders },
            timeout: 30000,
            validateStatus: () => true,
          },
        );

        console.log("분석 결과 반영 응답 =", res.status, res.data);

        if (!(res.status >= 200 && res.status < 300)) {
          showAxiosError("분석 결과 반영 실패", res);
          return null;
        }

        return res.data || null;
      } catch (err) {
        console.error(err);
        showAxiosError("분석 결과 반영 중 오류", err);
        return null;
      }
    },
    [schoolId, floors, authHeaders, showAxiosError],
  );

  const fetchMapElements = useCallback(
    async (mapId) => {
      if (!schoolId || !mapId) {
        alert("schoolId 또는 mapId가 없습니다.");
        return [];
      }

      try {
        const res = await axios.get(
          `${API_BASE}/api/channels/${schoolId}/maps/${mapId}/elements`,
          {
            headers: { ...authHeaders },
            timeout: 30000,
            validateStatus: () => true,
          },
        );

        console.log("구조도 요소 목록 조회 응답 =", res.status, res.data);

        if (!(res.status >= 200 && res.status < 300)) {
          showAxiosError("구조도 요소 목록 조회 실패", res);
          return [];
        }

        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.error(err);
        showAxiosError("구조도 요소 목록 조회 중 오류", err);
        return [];
      }
    },
    [schoolId, authHeaders, showAxiosError],
  );

  const fetchMapElementDetail = useCallback(
    async (mapId, elementId) => {
      if (!schoolId || !mapId || !elementId) {
        alert("schoolId, mapId 또는 elementId가 없습니다.");
        return null;
      }

      try {
        const res = await axios.get(
          `${API_BASE}/api/channels/${schoolId}/maps/${mapId}/elements/${elementId}`,
          {
            headers: { ...authHeaders },
            timeout: 30000,
            validateStatus: () => true,
          },
        );

        console.log("구조도 요소 상세 조회 응답 =", res.status, res.data);

        if (!(res.status >= 200 && res.status < 300)) {
          showAxiosError("구조도 요소 상세 조회 실패", res);
          return null;
        }

        return res.data || null;
      } catch (err) {
        console.error(err);
        showAxiosError("구조도 요소 상세 조회 중 오류", err);
        return null;
      }
    },
    [schoolId, authHeaders, showAxiosError],
  );

  const updateMapElementMeta = useCallback(
    async (mapId, elementId, { name, tagsJson }) => {
      if (!schoolId || !mapId || !elementId) {
        alert("schoolId, mapId 또는 elementId가 없습니다.");
        return null;
      }

      const payload = {
        name: name ?? "",
        tagsJson:
          typeof tagsJson === "string"
            ? tagsJson
            : JSON.stringify(tagsJson ?? []),
      };

      console.log("구조도 요소 수정 payload =", payload);

      try {
        const res = await axios.put(
          `${API_BASE}/api/channels/${schoolId}/maps/${mapId}/elements/${elementId}`,
          payload,
          {
            headers: { "Content-Type": "application/json", ...authHeaders },
            timeout: 30000,
            validateStatus: () => true,
          },
        );

        console.log("구조도 요소 수정 응답 =", res.status, res.data);

        if (!(res.status >= 200 && res.status < 300)) {
          showAxiosError("구조도 요소 수정 실패", res);
          return null;
        }

        return res.data || null;
      } catch (err) {
        console.error(err);
        showAxiosError("구조도 요소 수정 중 오류", err);
        return null;
      }
    },
    [schoolId, authHeaders, showAxiosError],
  );
  const createMapVersionFromChannel = useCallback(
    async ({ channelMapId, label }) => {
      if (!classroomId) {
        alert("classroomId가 없습니다.");
        return null;
      }

      const finalLabel = (label || "").trim();
      if (!channelMapId) {
        alert("channelMapId가 없습니다.");
        return null;
      }
      if (!finalLabel) {
        alert("맵 버전 이름(label)을 입력하세요.");
        return null;
      }

      const payload = {
        channelMapId,
        label: finalLabel,
        createdBy: userId || "",
      };

      console.log("단일 채널 맵 복사 payload =", payload);

      try {
        const res = await axios.post(
          `${API_BASE}/api/rooms/${classroomId}/map-versions/from-channel`,
          payload,
          {
            headers: { "Content-Type": "application/json", ...authHeaders },
            timeout: 30000,
            validateStatus: () => true,
          },
        );

        console.log("단일 채널 맵 복사 응답 =", res.status, res.data);

        if (!(res.status >= 200 && res.status < 300)) {
          showAxiosError("단일 채널 맵 복사 실패", res);
          return null;
        }

        return res.data || null;
      } catch (err) {
        console.error(err);
        showAxiosError("단일 채널 맵 복사 중 오류", err);
        return null;
      }
    },
    [classroomId, userId, authHeaders, showAxiosError],
  );

  const createMapVersionFromTemplate = useCallback(
    async ({ templateId, label }) => {
      if (!classroomId) {
        alert("classroomId가 없습니다.");
        return null;
      }

      const finalLabel = (label || "").trim();
      if (!templateId) {
        alert("templateId가 없습니다.");
        return null;
      }
      if (!finalLabel) {
        alert("맵 버전 이름(label)을 입력하세요.");
        return null;
      }

      const payload = {
        templateId,
        label: finalLabel,
        createdBy: userId || "",
      };

      console.log("템플릿 복사 payload =", payload);

      try {
        const res = await axios.post(
          `${API_BASE}/api/rooms/${classroomId}/map-versions/from-template`,
          payload,
          {
            headers: { "Content-Type": "application/json", ...authHeaders },
            timeout: 30000,
            validateStatus: () => true,
          },
        );

        console.log("템플릿 복사 응답 =", res.status, res.data);

        if (!(res.status >= 200 && res.status < 300)) {
          showAxiosError("템플릿으로 맵 버전 생성 실패", res);
          return null;
        }

        return res.data || null;
      } catch (err) {
        console.error(err);
        showAxiosError("템플릿으로 맵 버전 생성 중 오류", err);
        return null;
      }
    },
    [classroomId, userId, authHeaders, showAxiosError],
  );

  const saveMapVersionAsTemplate = useCallback(
    async (mapVersionId, { templateName, description }) => {
      if (!classroomId || !mapVersionId) {
        alert("classroomId 또는 mapVersionId가 없습니다.");
        return null;
      }

      const payload = {
        templateName: (templateName || "").trim(),
        description: (description || "").trim(),
      };

      if (!payload.templateName) {
        alert("템플릿 이름을 입력하세요.");
        return null;
      }

      console.log("맵 버전 템플릿 저장 payload =", payload);

      try {
        const res = await axios.post(
          `${API_BASE}/api/rooms/${classroomId}/map-versions/${mapVersionId}/save-as-template`,
          payload,
          {
            headers: { "Content-Type": "application/json", ...authHeaders },
            timeout: 30000,
            validateStatus: () => true,
          },
        );

        console.log("맵 버전 템플릿 저장 응답 =", res.status, res.data);

        if (!(res.status >= 200 && res.status < 300)) {
          showAxiosError("맵 버전 템플릿 저장 실패", res);
          return null;
        }

        return res.data || null;
      } catch (err) {
        console.error(err);
        showAxiosError("맵 버전 템플릿 저장 중 오류", err);
        return null;
      }
    },
    [classroomId, authHeaders, showAxiosError],
  );
  const fetchMapTemplates = useCallback(async () => {
    console.log("템플릿 조회 schoolId =", schoolId);

    if (!schoolId) {
      setTemplates([]);
      return;
    }

    try {
      const res = await axios.get(
        `${API_BASE}/api/schools/${schoolId}/map-templates`,
        {
          headers: { ...authHeaders },
          timeout: 30000,
          validateStatus: () => true,
        },
      );

      console.log("템플릿 목록 조회 응답 =", res.status, res.data);
      console.log("템플릿 저장 classroomId =", classroomId);
      console.log("템플릿 저장 activeMapVersionId =", activeMapVersionId);
      console.log("템플릿 저장 schoolId =", schoolId);

      if (!(res.status >= 200 && res.status < 300)) {
        setTemplates([]);
        showAxiosError("템플릿 목록 조회 실패", res);
        return;
      }

      setTemplates(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setTemplates([]);
      showAxiosError("템플릿 목록 조회 중 오류", err);
    }
  }, [schoolId, authHeaders, showAxiosError]);

  useEffect(() => {
    if (!schoolId) return;
    fetchMapTemplates();
  }, [schoolId, fetchMapTemplates]);

  const fetchMapTemplateDetail = useCallback(
    async (templateId) => {
      if (!schoolId || !templateId) {
        alert("schoolId 또는 templateId가 없습니다.");
        return null;
      }

      try {
        const res = await axios.get(
          `${API_BASE}/api/schools/${schoolId}/map-templates/${templateId}`,
          {
            headers: { ...authHeaders },
            timeout: 30000,
            validateStatus: () => true,
          },
        );

        console.log("템플릿 상세 조회 응답 =", res.status, res.data);

        if (!(res.status >= 200 && res.status < 300)) {
          showAxiosError("템플릿 상세 조회 실패", res);
          return null;
        }

        return res.data || null;
      } catch (err) {
        console.error(err);
        showAxiosError("템플릿 상세 조회 중 오류", err);
        return null;
      }
    },
    [schoolId, authHeaders, showAxiosError],
  );

  useEffect(() => {
    if (!isTemplateModalOpen) return;
    if (!selectedTemplateId) {
      setSelectedTemplateDetail(null);
      return;
    }

    const run = async () => {
      const detail = await fetchMapTemplateDetail(selectedTemplateId);
      setSelectedTemplateDetail(detail);
    };

    run();
  }, [isTemplateModalOpen, selectedTemplateId, fetchMapTemplateDetail]);

  useEffect(() => {
    if (!selectedTemplateDetail) {
      setTemplateName("");
      setTemplateDescription("");
      return;
    }

    setTemplateName(
      selectedTemplateDetail.templateName || selectedTemplateDetail.name || "",
    );

    setTemplateDescription(selectedTemplateDetail.description || "");
  }, [selectedTemplateDetail]);

  const updateMapTemplateMeta = useCallback(
    async (templateId, { templateName, description }) => {
      if (!schoolId || !templateId) {
        alert("schoolId 또는 templateId가 없습니다.");
        return null;
      }

      const payload = {
        templateName: (templateName || "").trim(),
        description: (description || "").trim(),
      };

      console.log("템플릿 수정 payload =", payload);

      try {
        const res = await axios.put(
          `${API_BASE}/api/schools/${schoolId}/map-templates/${templateId}`,
          payload,
          {
            headers: { "Content-Type": "application/json", ...authHeaders },
            timeout: 30000,
            validateStatus: () => true,
          },
        );

        console.log("템플릿 수정 응답 =", res.status, res.data);

        if (!(res.status >= 200 && res.status < 300)) {
          showAxiosError("템플릿 수정 실패", res);
          return null;
        }

        return res.data || null;
      } catch (err) {
        console.error(err);
        showAxiosError("템플릿 수정 중 오류", err);
        return null;
      }
    },
    [schoolId, authHeaders, showAxiosError],
  );
  const deleteMapTemplate = useCallback(
    async (templateId) => {
      if (!schoolId || !templateId) {
        alert("schoolId 또는 templateId가 없습니다.");
        return false;
      }

      try {
        const res = await axios.delete(
          `${API_BASE}/api/schools/${schoolId}/map-templates/${templateId}`,
          {
            headers: { ...authHeaders },
            timeout: 30000,
            validateStatus: () => true,
          },
        );

        console.log("템플릿 삭제 응답 =", res.status, res.data);

        if (!(res.status >= 200 && res.status < 300)) {
          showAxiosError("템플릿 삭제 실패", res);
          return false;
        }

        return true;
      } catch (err) {
        console.error(err);
        showAxiosError("템플릿 삭제 중 오류", err);
        return false;
      }
    },
    [schoolId, authHeaders, showAxiosError],
  );

  const handleDeleteTemplate = useCallback(
    async (templateId) => {
      if (!templateId) {
        alert("삭제할 templateId가 없습니다.");
        return;
      }

      const ok = window.confirm("이 템플릿을 삭제하시겠습니까?");
      if (!ok) return;

      const success = await deleteMapTemplate(templateId);
      if (!success) return;

      if (selectedTemplateId === templateId) {
        setSelectedTemplateId(null);
        setSelectedTemplateDetail(null);
      }

      await fetchMapTemplates();
      alert("✅ 템플릿이 삭제되었습니다.");
    },
    [
      deleteMapTemplate,
      fetchMapTemplates,
      selectedTemplateId,
      setSelectedTemplateId,
      setSelectedTemplateDetail,
    ],
  );

  const createMapVersionFromChannelSet = useCallback(
    async (label) => {
      if (!classroomId) {
        alert("classroomId가 없습니다.");
        return null;
      }

      if (!schoolId) {
        alert("schoolId가 없습니다.");
        return null;
      }

      const finalLabel = (label || "").trim();
      if (!finalLabel) {
        alert("맵 버전 이름(label)을 입력하세요.");
        return null;
      }

      const payload = {
        schoolId,
        label: finalLabel,
        createdByUserId: userId || "",
      };

      console.log("채널 전체 구조도 세트 복사 payload =", payload);

      try {
        const res = await axios.post(
          `${API_BASE}/api/rooms/${classroomId}/map-versions/from-channel-set`,
          payload,
          {
            headers: { "Content-Type": "application/json", ...authHeaders },
            timeout: 30000,
            validateStatus: () => true,
          },
        );

        console.log("채널 전체 구조도 세트 복사 응답 =", res.status, res.data);

        if (!(res.status >= 200 && res.status < 300)) {
          showAxiosError("채널 구조도 세트 복사 실패", res);
          return null;
        }

        return res.data || null;
      } catch (err) {
        console.error(err);
        showAxiosError("채널 구조도 세트 복사 중 오류", err);
        return null;
      }
    },
    [classroomId, schoolId, userId, authHeaders, showAxiosError],
  );

  const simulateBeaconDetect = useCallback(
    async ({
      scenarioId,
      classroomId: reqClassroomId,
      studentId,
      beaconId,
      rssi,
      updateLocation = true,
      saveEvent = true,
      note = "",
    }) => {
      if (!scenarioId) {
        alert("scenarioId가 없습니다.");
        return null;
      }

      const payload = {
        classroomId: reqClassroomId ?? classroomId,
        studentId,
        beaconId,
        rssi,
        updateLocation,
        saveEvent,
        note,
      };

      console.log("비콘 감지 시뮬레이션 payload =", payload);

      try {
        const res = await axios.post(
          `${API_BASE}/api/scenarios/${scenarioId}/simulate-beacon-detect`,
          payload,
          {
            headers: { "Content-Type": "application/json", ...authHeaders },
            timeout: 30000,
            validateStatus: () => true,
          },
        );

        console.log("비콘 감지 시뮬레이션 응답 =", res.status, res.data);

        if (!(res.status >= 200 && res.status < 300)) {
          showAxiosError("비콘 감지 시뮬레이션 실패", res);
          return null;
        }

        return res.data || null;
      } catch (err) {
        console.error(err);
        showAxiosError("비콘 감지 시뮬레이션 중 오류", err);
        return null;
      }
    },
    [classroomId, authHeaders, showAxiosError],
  );

  const deleteMapFromServer = useCallback(
    async (mapId) => {
      if (!schoolId || !mapId) {
        alert("schoolId 또는 mapId가 없습니다.");
        return false;
      }

      try {
        const res = await axios.delete(
          `${API_BASE}/api/channels/${schoolId}/maps/${mapId}`,
          {
            headers: { ...authHeaders },
            timeout: 30000,
            validateStatus: () => true,
          },
        );

        console.log("구조도 삭제 응답 =", res.status, res.data);

        if (!(res.status >= 200 && res.status < 300)) {
          showAxiosError("구조도 삭제 실패", res);
          return false;
        }

        return true;
      } catch (err) {
        console.error(err);
        showAxiosError("구조도 삭제 중 오류", err);
        return false;
      }
    },
    [schoolId, authHeaders, showAxiosError],
  );

  useEffect(() => {
    if (!schoolId) return;

    fetchBeacons();
    fetchSchoolMaps();
  }, [schoolId, fetchBeacons, fetchSchoolMaps]);

  // ====== Zoom & Pan ======
  const [fitScale, setFitScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 });
  const imgOffsetRef = useRef(imgOffset);
  useEffect(() => {
    imgOffsetRef.current = imgOffset;
  }, [imgOffset]);

  const displayedScale = fitScale * zoom;
  const displayedW = (imgNatural.w || 0) * displayedScale;
  const displayedH = (imgNatural.h || 0) * displayedScale;

  const viewportCenterX = VIEW_W / 2;
  const viewportCenterY = VIEW_H / 2;

  const imgLeft = viewportCenterX - displayedW / 2 + imgOffset.x;
  const imgTop = viewportCenterY - displayedH / 2 + imgOffset.y;

  console.log("VIEW_W, VIEW_H =", VIEW_W, VIEW_H);
  console.log("displayedW, displayedH =", displayedW, displayedH);
  console.log("viewportCenter =", viewportCenterX, viewportCenterY);
  console.log("imgLeft, imgTop =", imgLeft, imgTop);

  const clampOffsetForScale = useCallback(
    (ox, oy, newScale) => {
      const w = (imgNatural.w || 0) * newScale;
      const h = (imgNatural.h || 0) * newScale;

      // 이미지가 뷰포트보다 작으면 중앙 고정
      if (w <= VIEW_W) {
        ox = 0;
      } else {
        const minOffsetX = -(w - VIEW_W) / 2;
        const maxOffsetX = (w - VIEW_W) / 2;
        ox = clamp(ox, minOffsetX, maxOffsetX);
      }

      if (h <= VIEW_H) {
        oy = 0;
      } else {
        const minOffsetY = -(h - VIEW_H) / 2;
        const maxOffsetY = (h - VIEW_H) / 2;
        oy = clamp(oy, minOffsetY, maxOffsetY);
      }

      return { x: ox, y: oy };
    },
    [imgNatural.w, imgNatural.h, clamp],
  );
  const setActiveMapToServer = useCallback(
    async (mapVersionId) => {
      if (!classroomId || !mapVersionId) {
        alert("활성화할 mapVersionId가 없습니다.");
        return;
      }

      try {
        const res = await axios.put(
          `${API_BASE}/api/rooms/${classroomId}/active-map`,
          { mapVersionId },
          {
            headers: { "Content-Type": "application/json", ...authHeaders },
            timeout: 10000,
            validateStatus: () => true,
          },
        );

        if (!(res.status >= 200 && res.status < 300)) {
          showAxiosError("활성 맵 설정 실패", res);
          return;
        }

        setActiveMapVersionId(mapVersionId);
        alert("✅ 활성 맵이 변경되었습니다.");
        await fetchMapVersions();
        await fetchActiveMap();
      } catch (err) {
        console.error(err);
        showAxiosError("활성 맵 설정 중 오류", err);
      }
    },
    [
      classroomId,
      authHeaders,
      showAxiosError,
      fetchMapVersions,
      fetchActiveMap,
    ],
  );
  const fetchMapVersionDetail = useCallback(
    async (mapVersionId) => {
      if (!classroomId || !mapVersionId) return null;

      try {
        const res = await axios.get(
          `${API_BASE}/api/rooms/${classroomId}/map-versions/${mapVersionId}`,
          {
            headers: { ...authHeaders },
            timeout: 10000,
            validateStatus: () => true,
          },
        );

        console.log("구조도 버전 상세 조회 응답 =", res.status, res.data);

        if (!(res.status >= 200 && res.status < 300)) {
          showAxiosError("구조도 상세 조회 실패", res);
          return null;
        }

        return res.data || null;
      } catch (err) {
        console.error(err);
        showAxiosError("구조도 상세 조회 중 오류", err);
        return null;
      }
    },
    [classroomId, authHeaders, showAxiosError],
  );

  const updateMapVersionOnServer = useCallback(
    async (mapVersionId, { label, floorsJson }) => {
      if (!classroomId || !mapVersionId) {
        alert("classroomId 또는 mapVersionId가 없습니다.");
        return null;
      }

      const payload = {
        label: label ?? "",
        floorsJson:
          typeof floorsJson === "string"
            ? floorsJson
            : JSON.stringify(floorsJson ?? []),
      };

      console.log("맵 버전 수정 payload =", payload);

      try {
        const res = await axios.put(
          `${API_BASE}/api/rooms/${classroomId}/map-versions/${mapVersionId}`,
          payload,
          {
            headers: { "Content-Type": "application/json", ...authHeaders },
            timeout: 10000,
            validateStatus: () => true,
          },
        );

        console.log("맵 버전 수정 응답 =", res.status, res.data);

        if (!(res.status >= 200 && res.status < 300)) {
          showAxiosError("맵 버전 수정 실패", res);
          return null;
        }

        return res.data || null;
      } catch (err) {
        console.error(err);
        showAxiosError("맵 버전 수정 중 오류", err);
        return null;
      }
    },
    [classroomId, authHeaders, showAxiosError],
  );

  const saveMapVersionToServer = useCallback(async () => {
    if (!classroomId) {
      alert("classroomId가 없습니다.");
      return;
    }

    if (!schoolId) {
      alert("schoolId가 없습니다.");
      return;
    }

    const label = (savePlanName || "").trim();
    if (!label) {
      alert("맵 버전 이름을 입력하세요.");
      return;
    }

    const floorsJson = JSON.stringify(buildFloorsPayload());

    try {
      if (selectedPlanId) {
        const updated = await updateMapVersionOnServer(selectedPlanId, {
          label,
          floorsJson,
        });

        if (!updated) return;

        await fetchMapVersions();
        setSavePlanName("");
        setIsSavePlanModalOpen(false);
        alert("✅ 맵 버전이 수정되었습니다.");
        return;
      }

      const payload = {
        schoolId,
        label,
        createdBy: userId || "",
        floorsJson,
      };

      const res = await axios.post(
        `${API_BASE}/api/rooms/${classroomId}/map-versions`,
        payload,
        {
          headers: { "Content-Type": "application/json", ...authHeaders },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      if (!(res.status >= 200 && res.status < 300)) {
        showAxiosError("맵 버전 저장 실패", res);
        return;
      }

      const saved = res.data || {};
      const newMapVersionId = saved.mapVersionId || null;

      await fetchMapVersions();

      if (newMapVersionId) {
        setSelectedPlanId(newMapVersionId);
        setPlanFloorIdx(0);
        await setActiveMapToServer(newMapVersionId);
      }

      setSavePlanName("");
      setIsSavePlanModalOpen(false);
      alert("✅ 맵 버전이 저장되었습니다.");
    } catch (err) {
      console.error(err);
      showAxiosError("맵 버전 저장 중 오류", err);
    }
  }, [
    classroomId,
    schoolId,
    savePlanName,
    userId,
    buildFloorsPayload,
    authHeaders,
    showAxiosError,
    fetchMapVersions,
    setActiveMapToServer,
    selectedPlanId,
    updateMapVersionOnServer,
  ]);

  useEffect(() => {
    if (!isPlanModalOpen) return;
    if (!mapVersions.length) return;

    const targetId =
      selectedPlanId || activeMapVersionId || mapVersions[0]?.mapVersionId;

    if (!targetId) return;

    const run = async () => {
      const detail = await fetchMapVersionDetail(targetId);
      setSelectedPlanId(targetId);
      setPlanFloorIdx(0);
      setSelectedPlanDetail(detail);
    };

    run();
  }, [
    isPlanModalOpen,
    mapVersions,
    selectedPlanId,
    activeMapVersionId,
    fetchMapVersionDetail,
  ]);

  const applyZoomAroundPoint = useCallback(
    (oldZoom, newZoom, centerClient) => {
      if (!viewportRef.current || !centerClient || !imageSrc || !imageLoaded) {
        return;
      }

      const rect = viewportRef.current.getBoundingClientRect();
      const clientX = centerClient.x;
      const clientY = centerClient.y;

      const oldScale = fitScale * oldZoom;
      const newScale = fitScale * newZoom;

      const viewportCenterX = VIEW_W / 2;
      const viewportCenterY = VIEW_H / 2;

      const oldDisplayedW = (imgNatural.w || 0) * oldScale;
      const oldDisplayedH = (imgNatural.h || 0) * oldScale;
      const oldLeft =
        viewportCenterX - oldDisplayedW / 2 + imgOffsetRef.current.x;
      const oldTop =
        viewportCenterY - oldDisplayedH / 2 + imgOffsetRef.current.y;

      const localX = clientX - rect.left - oldLeft;
      const localY = clientY - rect.top - oldTop;

      const natX = localX / oldScale;
      const natY = localY / oldScale;

      const newDisplayedW = (imgNatural.w || 0) * newScale;
      const newDisplayedH = (imgNatural.h || 0) * newScale;
      const newLeftBase = viewportCenterX - newDisplayedW / 2;
      const newTopBase = viewportCenterY - newDisplayedH / 2;

      const desiredOffsetX =
        clientX - rect.left - newLeftBase - natX * newScale;
      const desiredOffsetY = clientY - rect.top - newTopBase - natY * newScale;

      const clamped = clampOffsetForScale(
        desiredOffsetX,
        desiredOffsetY,
        newScale,
      );

      setImgOffset(clamped);
    },
    [
      clampOffsetForScale,
      fitScale,
      imageLoaded,
      imageSrc,
      imgNatural.w,
      imgNatural.h,
    ],
  );

  const zoomIn = useCallback(() => {
    if (!viewportRef.current) return;
    const r = viewportRef.current.getBoundingClientRect();
    const center = { x: r.left + VIEW_W / 2, y: r.top + VIEW_H / 2 };

    setZoom((z) => {
      const next = clamp(z + 0.1, MIN_ZOOM, 10);
      if (next !== z) applyZoomAroundPoint(z, next, center);
      return next;
    });
  }, [applyZoomAroundPoint, clamp]);

  const zoomOut = useCallback(() => {
    if (!viewportRef.current) return;
    const r = viewportRef.current.getBoundingClientRect();
    const center = { x: r.left + VIEW_W / 2, y: r.top + VIEW_H / 2 };

    setZoom((z) => {
      const next = clamp(z - 0.1, MIN_ZOOM, 10);
      if (next !== z) applyZoomAroundPoint(z, next, center);
      return next;
    });
  }, [applyZoomAroundPoint, clamp]);

  // nat <-> disp
  const natToDispX = (natX) => imgLeft + natX * displayedScale;
  const natToDispY = (natY) => imgTop + natY * displayedScale;
  const natToDispW = (natW) => natW * displayedScale;
  const natToDispH = (natH) => natH * displayedScale;

  const clientToNatural = useCallback(
    (clientX, clientY) => {
      const rect = viewportRef.current.getBoundingClientRect();
      const localX = clientX - rect.left - imgLeft;
      const localY = clientY - rect.top - imgTop;
      return { x: localX / displayedScale, y: localY / displayedScale };
    },
    [displayedScale, imgLeft, imgTop],
  );

  const isInsideImageNatural = useCallback(
    (n) =>
      n.x >= 0 &&
      n.y >= 0 &&
      n.x <= (imgNatural.w || 0) &&
      n.y <= (imgNatural.h || 0),
    [imgNatural.h, imgNatural.w],
  );

  // Ctrl+wheel zoom
  useEffect(() => {
    const handler = (e) => {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (!imageSrc || !imageLoaded) return;

      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      )
        return;

      if (!e.ctrlKey) return;
      e.preventDefault();

      const oldZoom = zoom;
      const nextZoom = clamp(oldZoom - e.deltaY * 0.0015, MIN_ZOOM, 10);
      if (nextZoom === oldZoom) return;

      applyZoomAroundPoint(oldZoom, nextZoom, { x: e.clientX, y: e.clientY });
      setZoom(nextZoom);
    };

    window.addEventListener("wheel", handler, { passive: false });
    return () => window.removeEventListener("wheel", handler);
  }, [applyZoomAroundPoint, clamp, imageLoaded, imageSrc, zoom]);

  // ====== Space Panning ======
  const spacePressedRef = useRef(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef(null);
  const panOriginRef = useRef(null);

  // ====== Drawing / Preview ======
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [preview, setPreview] = useState(null);

  // ====== Drag selection ======
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState(null);
  const selectionStartRef = useRef(null);

  // ====== Hover ======
  const [hover, setHover] = useState(null);

  // ====== Resize ======
  const [resizing, setResizing] = useState(null);
  const [editingResizeId, setEditingResizeId] = useState(null);

  // ====== Door rotate ======
  const [rotatingDoorId, setRotatingDoorId] = useState(null);
  const [pendingDoorId, setPendingDoorId] = useState(null);

  // ====== Outline drawing ======
  const [outlineRawPoints, setOutlineRawPoints] = useState([]);
  const [outlinePoints, setOutlinePoints] = useState([]);
  const outlineRawPointsRef = useRef(outlineRawPoints);
  useEffect(() => {
    outlineRawPointsRef.current = outlineRawPoints;
  }, [outlineRawPoints]);

  const snapAngleTo45 = useCallback((rad) => {
    const step = Math.PI / 4;
    return Math.round(rad / step) * step;
  }, []);

  const finalizeOutlineFromRaw = useCallback(
    (rawPoints, closed = true) => {
      if (!rawPoints || rawPoints.length < 2)
        return { points: rawPoints || [], rawPoints: rawPoints || [] };

      const snapped = [];
      snapped.push({ ...rawPoints[0] });

      for (let i = 1; i < rawPoints.length; i++) {
        const prevRaw = rawPoints[i - 1];
        const currRaw = rawPoints[i];
        const prevSnap = snapped[i - 1];

        const dx = currRaw.x - prevRaw.x;
        const dy = currRaw.y - prevRaw.y;
        const len = Math.hypot(dx, dy);
        if (len === 0) {
          snapped.push({ ...prevSnap });
          continue;
        }

        const angle = Math.atan2(dy, dx);
        const snapA = snapAngleTo45(angle);
        snapped.push({
          x: prevSnap.x + len * Math.cos(snapA),
          y: prevSnap.y + len * Math.sin(snapA),
        });
      }

      if (closed && rawPoints.length >= 2) {
        const n = rawPoints.length;
        const rawLast = rawPoints[n - 1];
        const rawFirst = rawPoints[0];
        const dx = rawFirst.x - rawLast.x;
        const dy = rawFirst.y - rawLast.y;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          const angle = Math.atan2(dy, dx);
          const snapA = snapAngleTo45(angle);
          const newLastX = snapped[0].x - len * Math.cos(snapA);
          const newLastY = snapped[0].y - len * Math.sin(snapA);
          snapped[n - 1] = { x: newLastX, y: newLastY };
        }
      }

      return { points: snapped, rawPoints: [...rawPoints] };
    },
    [snapAngleTo45],
  );

  const finalizeCurrentOutline = useCallback(() => {
    const raw = outlineRawPointsRef.current;
    if (!raw || raw.length < 3) {
      alert("윤곽선은 최소 3개 이상 점이 필요합니다.");
      return;
    }
    pushUndoSnapshot();

    const { points: snappedOutline, rawPoints: rawOutline } =
      finalizeOutlineFromRaw(raw, true);
    const id = `outline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    setElements((prev) => [
      ...prev,
      {
        id,
        type: "건물윤곽",
        points: snappedOutline,
        rawPoints: rawOutline,
        floor: currentFloorIndex,
      },
    ]);

    setOutlinePoints([]);
    setOutlineRawPoints([]);
    setMode(null);
  }, [
    currentFloorIndex,
    finalizeOutlineFromRaw,
    pushUndoSnapshot,
    setElements,
  ]);

  // ====== Hit test ======
  function pointToSegmentDistance(p, a, b) {
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const wx = p.x - a.x;
    const wy = p.y - a.y;
    const c1 = vx * wx + vy * wy;
    if (c1 <= 0) return Math.hypot(p.x - a.x, p.y - a.y);
    const c2 = vx * vx + vy * vy;
    if (c2 <= c1) return Math.hypot(p.x - b.x, p.y - b.y);
    const t = c1 / c2;
    const projx = a.x + t * vx;
    const projy = a.y + t * vy;
    return Math.hypot(p.x - projx, p.y - projy);
  }

  const hitTestElement = useCallback(
    (nat) => {
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if ((el.floor ?? 0) !== currentFloorIndex) continue;

        if (el.type === "문") {
          const naturalR = 20 / displayedScale;
          const dx = nat.x - el.x;
          const dy = nat.y - el.y;
          if (dx * dx + dy * dy <= naturalR * naturalR)
            return { kind: "door", el };
        } else if (el.type === "비콘") {
          const w = el.width || 30;
          const h = el.height || 30;
          if (
            nat.x >= el.x - w / 2 &&
            nat.x <= el.x + w / 2 &&
            nat.y >= el.y - h / 2 &&
            nat.y <= el.y + h / 2
          )
            return { kind: "beacon", el };
        } else if (el.type === "건물윤곽") {
          const pts = el.points || [];
          for (let j = 0; j < pts.length; j++) {
            const a = pts[j];
            const b = pts[(j + 1) % pts.length];
            const dist = pointToSegmentDistance(nat, a, b);
            const threshold = 8 / displayedScale;
            if (dist <= threshold)
              return { kind: "contour-seg", el, segIndex: j, a, b };
          }
        } else {
          if (
            nat.x >= el.x &&
            nat.x <= el.x + el.width &&
            nat.y >= el.y &&
            nat.y <= el.y + el.height
          ) {
            return { kind: "box", el };
          }
        }
      }
      return null;
    },
    [elements, currentFloorIndex, displayedScale],
  );

  const onImgLoad = useCallback(
    (ev) => {
      const img = ev.target;
      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      const floorIdx = currentFloorIndexRef.current;

      setFloors((prev) => {
        const next = [...prev];
        const curr = next[floorIdx] || makeEmptyFloor();
        next[floorIdx] = { ...curr, imgNatural: { w, h } };
        return next;
      });

      const fit = w && h ? Math.min(VIEW_W / w, VIEW_H / h, 1) : 1;
      setFitScale(fit);
      setZoom(1);
      setImgOffset({ x: 0, y: 0 });
      setImageLoaded(true);
    },
    [makeEmptyFloor],
  );

  // ====== Floors UI ======
  const goPrevFloor = useCallback(() => {
    setCurrentFloorIndex((p) => Math.max(0, p - 1));
    setMode(null);
    setSelectedId(null);
    setSelectedIds([]);
    setEditingResizeId(null);
    setContextMenu(null);
    setPreview(null);
    setOutlineRawPoints([]);
    setOutlinePoints([]);
    setRotatingDoorId(null);
    setPendingDoorId(null);
  }, []);

  const goNextFloor = useCallback(() => {
    console.log("▶ 클릭 전", {
      currentFloorIndex,
      floorsLength: floors.length,
      floorNames,
      imageSrcs: floors.map((f) => f.imageSrc),
    });

    setCurrentFloorIndex((p) => {
      const maxIdx = floors.length - 1;
      const next = Math.min(p + 1, maxIdx);
      console.log("▶ 계산", { prev: p, maxIdx, next });
      return next;
    });

    setMode(null);
    setSelectedId(null);
    setSelectedIds([]);
    setEditingResizeId(null);
    setContextMenu(null);
    setPreview(null);
    setOutlineRawPoints([]);
    setOutlinePoints([]);
    setRotatingDoorId(null);
    setPendingDoorId(null);
  }, [currentFloorIndex, floors, floorNames]);

  const renameFloor = useCallback(() => {
    const currName =
      floorNames[currentFloorIndex] || `${currentFloorIndex + 1}층`;
    const name = window.prompt("층 이름을 수정하세요", currName);
    if (!name || !name.trim()) return;

    setFloorNames((prev) => {
      const next = [...prev];
      next[currentFloorIndex] = name.trim();
      return next;
    });
  }, [currentFloorIndex, floorNames]);

  // ====== Context menu ======
  const [contextMenu, setContextMenu] = useState(null);

  // ====== Wheel pan ======
  const onViewportWheel = useCallback(
    (e) => {
      if (!imageSrc || !imageLoaded) return;
      if (e.ctrlKey) return;

      if (displayedH <= VIEW_H) return;
      e.preventDefault();

      const deltaY = e.deltaY;
      const newScale = fitScale * zoom;
      const desiredY = imgOffsetRef.current.y - deltaY;

      const clamped = clampOffsetForScale(
        imgOffsetRef.current.x,
        desiredY,
        newScale,
      );
      setImgOffset(clamped);
    },
    [clampOffsetForScale, displayedH, fitScale, imageLoaded, imageSrc, zoom],
  );

  // ====== Shortcuts ======
  const keyGuardRef = useRef({ undo: false, redo: false });
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === "Space") spacePressedRef.current = true;

      const active = document.activeElement;
      const isTyping =
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.tagName === "SELECT" ||
          active.isContentEditable);

      if (
        !e.ctrlKey &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        if (isTyping) return;
        const ids = selectedIdsRef.current;
        if (!ids.length) return;

        e.preventDefault();
        if (!e.repeat) pushUndoSnapshot();

        const step = 1;
        let dx = 0,
          dy = 0;
        if (e.key === "ArrowUp") dy = -step;
        if (e.key === "ArrowDown") dy = step;
        if (e.key === "ArrowLeft") dx = -step;
        if (e.key === "ArrowRight") dx = step;

        setElements((prev) =>
          prev.map((p) => {
            if ((p.floor ?? 0) !== currentFloorIndex) return p;
            if (!ids.includes(p.id)) return p;

            const w = p.width || 0;
            const h = p.height || 0;

            let nx = p.x + dx;
            let ny = p.y + dy;

            if (p.type === "문" || p.type === "비콘") {
              nx = clamp(nx, 0, imgNatural.w);
              ny = clamp(ny, 0, imgNatural.h);
              return { ...p, x: nx, y: ny };
            }

            nx = clamp(nx, 0, imgNatural.w - w);
            ny = clamp(ny, 0, imgNatural.h - h);
            return { ...p, x: nx, y: ny };
          }),
        );
        return;
      }

      if (!e.ctrlKey && (e.key === "Backspace" || e.key === "Delete")) {
        if (isTyping) return;
        const ids = selectedIdsRef.current;
        if (!ids.length) return;

        e.preventDefault();
        pushUndoSnapshot();
        setElements((prev) => prev.filter((p) => !ids.includes(p.id)));
        setSelectedId(null);
        setSelectedIds([]);
        setEditingResizeId(null);
        return;
      }

      if (!e.ctrlKey) return;
      if (e.repeat) return;

      if (e.key === "z" || e.key === "Z") {
        if (keyGuardRef.current.undo) return;
        keyGuardRef.current.undo = true;
        e.preventDefault();
        performUndoOnce();
        setSelectedId(null);
        setSelectedIds([]);
        setEditingResizeId(null);
        return;
      }

      if (e.key === "y" || e.key === "Y") {
        if (keyGuardRef.current.redo) return;
        keyGuardRef.current.redo = true;
        e.preventDefault();
        performRedoOnce();
        setSelectedId(null);
        setSelectedIds([]);
        setEditingResizeId(null);
        return;
      }

      if (e.key === "0") {
        e.preventDefault();
        if (!imageSrc || !imageLoaded) return;
        setZoom(1);
        setImgOffset({ x: 0, y: 0 });
      }
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        zoomIn();
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomOut();
      }
    };

    const onKeyUp = (e) => {
      if (e.code === "Space") spacePressedRef.current = false;
      if (e.key === "z" || e.key === "Z") keyGuardRef.current.undo = false;
      if (e.key === "y" || e.key === "Y") keyGuardRef.current.redo = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    clamp,
    currentFloorIndex,
    elements,
    imageLoaded,
    imageSrc,
    imgNatural.h,
    imgNatural.w,
    performRedoOnce,
    performUndoOnce,
    pushUndoSnapshot,
    setElements,
    zoomIn,
    zoomOut,
  ]);

  // ESC
  useEffect(() => {
    const fn = (ev) => {
      if (ev.key !== "Escape") return;

      if (
        modeRef.current === "건물윤곽" &&
        outlineRawPointsRef.current.length < 3
      ) {
        setOutlinePoints([]);
        setOutlineRawPoints([]);
      }

      setContextMenu(null);
      setRotatingDoorId(null);
      setResizing(null);
      setMode(null);
      setIsPanning(false);
      setIsBoxSelecting(false);
      setSelectionRect(null);
      setEditingResizeId(null);
      setPendingDoorId(null);
      setPreview(null);
      setIsDrawing(false);
      setDrawStart(null);

      setIsPlanModalOpen(false);
      setIsSavePlanModalOpen(false);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  // ====== Dragging elements ======
  const [dragging, setDragging] = useState(null);
  const startElementsDrag = useCallback(
    (ids, startNat) => {
      if (!ids?.length) return;
      const origPositions = {};
      elements.forEach((p) => {
        if (ids.includes(p.id)) origPositions[p.id] = { x: p.x, y: p.y };
      });
      setDragging({ type: "elements", startNat, ids: [...ids], origPositions });
    },
    [elements],
  );

  // ====== Mouse handlers ======
  const onViewportMouseDown = useCallback(
    (e) => {
      if (e.button === 2) return;
      if (!viewportRef.current) return;
      if (!imageSrc || !imageLoaded) return;

      const rect = viewportRef.current.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      )
        return;

      const nat = clientToNatural(e.clientX, e.clientY);
      const inside = isInsideImageNatural(nat);
      const clicked = inside ? hitTestElement(nat) : null;

      if (rotatingDoorId && mode === "문") {
        setRotatingDoorId(null);
        return;
      }
      if (resizing) return;
      if (rotatingDoorId) return;

      if (mode === null) {
        if (
          !clicked &&
          inside &&
          spacePressedRef.current &&
          (displayedW > VIEW_W || displayedH > VIEW_H)
        ) {
          setIsPanning(true);
          panStartRef.current = { x: e.clientX, y: e.clientY };
          panOriginRef.current = { ...imgOffsetRef.current };
          setContextMenu(null);
          return;
        }

        if (clicked) {
          const elId = clicked.el.id;
          const current = selectedIdsRef.current;
          let newSelectedIds;

          if (e.ctrlKey) {
            newSelectedIds = current.includes(elId)
              ? current.filter((id) => id !== elId)
              : [...current, elId];
          } else {
            newSelectedIds = [elId];
          }

          setSelectedIds(newSelectedIds);
          setSelectedId(
            newSelectedIds.length
              ? newSelectedIds[newSelectedIds.length - 1]
              : null,
          );
          setContextMenu(null);
          setEditingResizeId(null);

          startElementsDrag(newSelectedIds, nat);
          return;
        }

        setSelectedId(null);
        setSelectedIds([]);
        setDragging(null);
        setEditingResizeId(null);

        if (inside) {
          setIsBoxSelecting(true);
          selectionStartRef.current = { x: e.clientX, y: e.clientY };
          setSelectionRect({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            w: 0,
            h: 0,
          });
        }
        setContextMenu(null);
        return;
      }

      if (mode === "문" && inside) {
        pushUndoSnapshot();
        const id = `door-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const newDoor = {
          id,
          type: "문",
          x: nat.x,
          y: nat.y,
          angle: 0,
          floor: currentFloorIndex,
        };
        setElements((prev) => [...prev, newDoor]);
        setSelectedId(id);
        setSelectedIds([id]);
        setPendingDoorId(id);
        return;
      }

      if (mode === "비콘" && inside) {
        // ✅ 기존 비콘 클릭이면 "수정"
        if (clicked?.kind === "beacon") {
          const b = clicked.el;
          setEditingBeaconId(b.id);
          setPendingBeaconNat({
            x: b.x,
            y: b.y,
            floorIdx: b.floor ?? currentFloorIndex,
          });
          setBeaconForm({
            uuid: b.beaconUuid || "",
            major: String(b.beaconMajor ?? ""),
            minor: String(b.beaconMinor ?? ""),
          });
          setIsBeaconModalOpen(true);
          return;
        }

        // ✅ 빈 곳 클릭이면 "추가"
        setEditingBeaconId(null);
        setPendingBeaconNat({
          x: nat.x,
          y: nat.y,
          floorIdx: currentFloorIndex,
        });
        setBeaconForm({ uuid: "", major: "", minor: "" });
        setIsBeaconModalOpen(true);
        return;
      }

      if (mode === "건물윤곽" && inside) {
        const naturalSnapClose = 8 / displayedScale;

        if (outlineRawPoints.length === 0) {
          setOutlineRawPoints([nat]);
          setOutlinePoints([nat]);
        } else {
          const first = outlineRawPoints[0];
          const dxClose = nat.x - first.x;
          const dyClose = nat.y - first.y;
          if (
            Math.hypot(dxClose, dyClose) <= naturalSnapClose &&
            outlineRawPoints.length >= 3
          ) {
            finalizeCurrentOutline();
          } else {
            setOutlineRawPoints((prev) => [...prev, nat]);
            setOutlinePoints((prev) => [...prev, nat]);
          }
        }
        return;
      }

      if (["제한 구역", "방", "재난 구역", "안전 구역"].includes(mode)) {
        if (mode !== "제한 구역" && !inside) return;

        const natClamped = {
          x: clamp(nat.x, 0, imgNatural.w),
          y: clamp(nat.y, 0, imgNatural.h),
        };

        setIsDrawing(true);
        setDrawStart(mode === "제한 구역" ? natClamped : nat);
        setPreview(null);
      }
    },
    [
      clamp,
      clientToNatural,
      displayedH,
      displayedScale,
      displayedW,
      finalizeCurrentOutline,
      hitTestElement,
      imageLoaded,
      imageSrc,
      imgNatural.h,
      imgNatural.w,
      isInsideImageNatural,
      mode,
      outlineRawPoints,
      pushUndoSnapshot,
      resizing,
      rotatingDoorId,
      currentFloorIndex,
      setElements,
      startElementsDrag,
    ],
  );

  const onViewportMouseMove = useCallback(
    (e) => {
      if (!imageSrc || !imageLoaded) return;
      if (!viewportRef.current) return;

      const rect = viewportRef.current.getBoundingClientRect();
      const nat = clientToNatural(e.clientX, e.clientY);
      const inside = isInsideImageNatural(nat);

      const hitForHover = inside ? hitTestElement(nat) : null;
      if (hitForHover) {
        if (hitForHover.kind === "contour-seg") {
          setHover({
            kind: "contour-seg",
            id: hitForHover.el.id,
            segIndex: hitForHover.segIndex,
            el: hitForHover.el,
          });
        } else if (hitForHover.kind === "box")
          setHover({ kind: "box", id: hitForHover.el.id });
        else if (hitForHover.kind === "door")
          setHover({ kind: "door", id: hitForHover.el.id });
        else if (hitForHover.kind === "beacon")
          setHover({ kind: "beacon", id: hitForHover.el.id });
      } else {
        setHover(null);
      }

      if (isPanning && panStartRef.current && panOriginRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;

        const newScale = fitScale * zoom;
        const desiredX = panOriginRef.current.x + dx;
        const desiredY = panOriginRef.current.y + dy;

        const clampedOffset = clampOffsetForScale(desiredX, desiredY, newScale);
        setImgOffset(clampedOffset);
        return;
      }

      if (isBoxSelecting && selectionStartRef.current) {
        const sx = selectionStartRef.current.x - rect.left;
        const sy = selectionStartRef.current.y - rect.top;
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;

        const x = Math.min(sx, cx);
        const y = Math.min(sy, cy);
        const w = Math.abs(cx - sx);
        const h = Math.abs(cy - sy);
        setSelectionRect({ x, y, w, h });
        return;
      }

      if (rotatingDoorId) {
        setElements((prev) =>
          prev.map((p) => {
            if (p.id !== rotatingDoorId) return p;
            const dx = nat.x - p.x;
            const dy = nat.y - p.y;
            let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
            const snapped = Math.round(angle / 45) * 45;
            return { ...p, angle: snapped };
          }),
        );
        return;
      }

      if (dragging && dragging.type === "elements" && mode === null && inside) {
        const dx = nat.x - dragging.startNat.x;
        const dy = nat.y - dragging.startNat.y;

        setElements((prev) =>
          prev.map((p) => {
            if ((p.floor ?? 0) !== currentFloorIndex) return p;
            if (!dragging.ids.includes(p.id)) return p;

            const orig = dragging.origPositions[p.id];
            if (!orig) return p;

            if (p.type === "문" || p.type === "비콘") {
              const nx = clamp(orig.x + dx, 0, imgNatural.w);
              const ny = clamp(orig.y + dy, 0, imgNatural.h);
              return { ...p, x: nx, y: ny };
            }

            const w = p.width || 0;
            const h = p.height || 0;
            const nx = clamp(orig.x + dx, 0, imgNatural.w - w);
            const ny = clamp(orig.y + dy, 0, imgNatural.h - h);
            return { ...p, x: nx, y: ny };
          }),
        );
        return;
      }

      if (isDrawing && drawStart) {
        if (mode !== "제한 구역" && !inside) return;

        const natNow =
          mode === "제한 구역"
            ? {
                x: clamp(nat.x, 0, imgNatural.w),
                y: clamp(nat.y, 0, imgNatural.h),
              }
            : nat;

        const rectNat = {
          x: Math.max(0, Math.min(drawStart.x, natNow.x)),
          y: Math.max(0, Math.min(drawStart.y, natNow.y)),
          width: Math.min(imgNatural.w, Math.abs(natNow.x - drawStart.x)),
          height: Math.min(imgNatural.h, Math.abs(natNow.y - drawStart.y)),
        };

        setPreview(rectNat);
      }
    },
    [
      clamp,
      clampOffsetForScale,
      clientToNatural,
      dragging,
      drawStart,
      fitScale,
      hitTestElement,
      imageLoaded,
      imageSrc,
      imgNatural.h,
      imgNatural.w,
      isBoxSelecting,
      isDrawing,
      isInsideImageNatural,
      isPanning,
      mode,
      rotatingDoorId,
      zoom,
      currentFloorIndex,
      setElements,
    ],
  );

  const onViewportMouseUp = useCallback(() => {
    if (pendingDoorId) {
      setRotatingDoorId(pendingDoorId);
      setPendingDoorId(null);
    }

    if (isPanning) setIsPanning(false);

    if (isBoxSelecting && selectionRect && viewportRef.current) {
      const vpRect = viewportRef.current.getBoundingClientRect();
      const toNatural = (sx, sy) =>
        clientToNatural(vpRect.left + sx, vpRect.top + sy);

      const p1 = toNatural(selectionRect.x, selectionRect.y);
      const p2 = toNatural(
        selectionRect.x + selectionRect.w,
        selectionRect.y + selectionRect.h,
      );

      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);

      const ids = [];
      elements.forEach((el) => {
        if ((el.floor ?? 0) !== currentFloorIndex) return;

        if (el.type === "문") {
          if (el.x >= minX && el.x <= maxX && el.y >= minY && el.y <= maxY)
            ids.push(el.id);
        } else if (el.type === "비콘") {
          const w = el.width || 30;
          const h = el.height || 30;
          const cx = el.x,
            cy = el.y;
          if (
            cx + w / 2 >= minX &&
            cx - w / 2 <= maxX &&
            cy + h / 2 >= minY &&
            cy - h / 2 <= maxY
          )
            ids.push(el.id);
        } else if (el.type !== "건물윤곽") {
          const ex1 = el.x,
            ex2 = el.x + el.width;
          const ey1 = el.y,
            ey2 = el.y + el.height;
          if (ex2 >= minX && ex1 <= maxX && ey2 >= minY && ey1 <= maxY)
            ids.push(el.id);
        }
      });

      setSelectedIds(ids);
      setSelectedId(ids.length ? ids[ids.length - 1] : null);
      setIsBoxSelecting(false);
      setSelectionRect(null);
    }

    if (isDrawing && preview) {
      if (mode === "방") {
        const name = window.prompt("이 방의 이름을 입력하세요:", "");
        if (name === null) {
          setIsDrawing(false);
          setDrawStart(null);
          setPreview(null);
          setDragging(null);
          return;
        }

        const id = `room-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        pushUndoSnapshot();
        const newBox = {
          id,
          type: "방",
          ...preview,
          name,
          floor: currentFloorIndex,
        };
        setElements((prev) => [...prev, newBox]);
        setSelectedId(id);
        setSelectedIds([id]);
      } else {
        const id = `box-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        pushUndoSnapshot();
        const newBox = { id, type: mode, ...preview, floor: currentFloorIndex };
        setElements((prev) => [...prev, newBox]);
        setSelectedId(id);
        setSelectedIds([id]);
      }
    }

    setIsDrawing(false);
    setDrawStart(null);
    setPreview(null);
    setDragging(null);
  }, [
    clientToNatural,
    currentFloorIndex,
    elements,
    isBoxSelecting,
    isDrawing,
    isPanning,
    mode,
    pendingDoorId,
    preview,
    pushUndoSnapshot,
    selectionRect,
    setElements,
  ]);

  const onViewportContextMenu = useCallback(
    (e) => {
      e.preventDefault();
      if (!imageSrc || !imageLoaded) return;

      const nat = clientToNatural(e.clientX, e.clientY);
      const hit = isInsideImageNatural(nat) ? hitTestElement(nat) : null;

      if (!hit) {
        const opts = [
          {
            label: "Undo (되돌리기)",
            action: () => {
              performUndoOnce();
              setContextMenu(null);
              setSelectedId(null);
              setSelectedIds([]);
              setEditingResizeId(null);
            },
          },
          {
            label: "Redo (다시하기)",
            action: () => {
              performRedoOnce();
              setContextMenu(null);
              setSelectedId(null);
              setSelectedIds([]);
              setEditingResizeId(null);
            },
          },
        ];

        const flipY = e.clientY > window.innerHeight - 220;
        setContextMenu({ x: e.clientX, y: e.clientY, flipY, options: opts });
        return;
      }

      setSelectedId(hit.el.id);
      setSelectedIds([hit.el.id]);

      const opts = [];

      if (hit.el.type === "건물윤곽") {
        opts.push(
          {
            label: "이 윤곽 삭제",
            action: () => {
              pushUndoSnapshot();
              setElements((prev) => prev.filter((p) => p.id !== hit.el.id));
              setContextMenu(null);
              setSelectedId(null);
              setSelectedIds([]);
              setEditingResizeId(null);
            },
          },
          {
            label: "윤곽 전체 삭제",
            action: () => {
              pushUndoSnapshot();
              setElements((prev) =>
                prev.filter(
                  (p) =>
                    !(
                      (p.floor ?? 0) === currentFloorIndex &&
                      p.type === "건물윤곽"
                    ),
                ),
              );
              setContextMenu(null);
              setSelectedId(null);
              setSelectedIds([]);
              setEditingResizeId(null);
            },
          },
        );
      } else {
        opts.push({
          label: "삭제",
          action: async () => {
            pushUndoSnapshot();

            if (hit.el.type === "비콘" && hit.el.serverBeaconId) {
              const ok = await deleteBeaconOnServer(hit.el.serverBeaconId);
              if (!ok) return;
              await fetchBeacons();
            }

            setElements((prev) => prev.filter((p) => p.id !== hit.el.id));
            setContextMenu(null);
            setSelectedId(null);
            setSelectedIds([]);
            setEditingResizeId(null);
          },
        });
      }

      if (hit.el.type === "문") {
        opts.push(
          {
            label: "문 반전(180° 회전)",
            action: () => {
              pushUndoSnapshot();
              setElements((prev) =>
                prev.map((p) =>
                  p.id !== hit.el.id
                    ? p
                    : { ...p, angle: ((p.angle || 0) + 180) % 360 },
                ),
              );
              setContextMenu(null);
            },
          },
          {
            label: "각도 수정(드래그, 45° 스냅)",
            action: () => {
              setRotatingDoorId(hit.el.id);
              setContextMenu(null);
            },
          },
        );
      }

      const flipY = e.clientY > window.innerHeight - 220;
      setContextMenu({ x: e.clientX, y: e.clientY, flipY, options: opts });
    },
    [
      clientToNatural,
      currentFloorIndex,
      hitTestElement,
      imageLoaded,
      imageSrc,
      isInsideImageNatural,
      performRedoOnce,
      performUndoOnce,
      pushUndoSnapshot,
      setElements,
    ],
  );

  const updateMapVersionToServer = useCallback(
    async (mapVersionId) => {
      if (!classroomId || !mapVersionId) {
        alert("mapVersionId가 없습니다.");
        return null;
      }

      const label = (
        selectedPlanDetail?.label ||
        selectedPlan?.label ||
        ""
      ).trim();
      if (!label) {
        alert("구조도 이름이 없습니다.");
        return null;
      }

      const payload = {
        label,
        floorsJson: JSON.stringify(buildFloorsPayload()),
      };

      try {
        const res = await axios.put(
          `${API_BASE}/api/rooms/${classroomId}/map-versions/${mapVersionId}`,
          payload,
          {
            headers: { "Content-Type": "application/json", ...authHeaders },
            timeout: 10000,
            validateStatus: () => true,
          },
        );

        if (!(res.status >= 200 && res.status < 300)) {
          showAxiosError("구조도 수정 실패", res);
          return null;
        }

        const detail = await fetchMapVersionDetail(mapVersionId);
        setSelectedPlanDetail(detail);
        await fetchMapVersions();

        alert("✅ 구조도가 수정되었습니다.");
        return detail;
      } catch (err) {
        console.error(err);
        showAxiosError("구조도 수정 중 오류", err);
        return null;
      }
    },
    [
      classroomId,
      selectedPlanDetail,
      selectedPlan,
      buildFloorsPayload,
      authHeaders,
      showAxiosError,
      fetchMapVersionDetail,
      fetchMapVersions,
    ],
  );
  const loadMapVersionDetail = useCallback(
    async (mapVersionId) => {
      if (!classroomId || !mapVersionId) return;

      try {
        const res = await axios.get(
          `${API_BASE}/api/rooms/${classroomId}/map-versions/${mapVersionId}`,
          {
            headers: { ...authHeaders },
            timeout: 10000,
            validateStatus: () => true,
          },
        );

        if (!(res.status >= 200 && res.status < 300)) {
          showAxiosError("맵 버전 상세 조회 실패", res);
          return;
        }

        const data = res.data || {};
        const parsedFloors = JSON.parse(data.floorsJson || "[]");

        if (!Array.isArray(parsedFloors) || parsedFloors.length === 0) {
          alert("불러올 floorsJson이 비어 있습니다.");
          return;
        }

        setActiveMapVersionId(data.mapVersionId || null);
        setFloorNames(parsedFloors.map((f, idx) => f?.name || `${idx + 1}층`));
        setFloors(
          parsedFloors.map((f, idx) => ({
            imageSrc: f?.image?.src || null,
            uploadedFile: null,
            imgNatural: f?.image?.natural || { w: 0, h: 0 },
            elements: Array.isArray(f?.elements)
              ? f.elements.map((el) => ({ ...el, floor: idx }))
              : [],
            undoStack: [],
            redoStack: [],
            hasAutoAnalysisResult: false,
            autoElementsCache: [],
            autoAnalysisHidden: false,
            abort: { analyze: null },
          })),
        );

        setCurrentFloorIndex((prev) =>
          Math.min(prev, Math.max(parsedFloors.length - 1, 0)),
        );
      } catch (err) {
        console.error(err);
        showAxiosError("맵 버전 상세 조회 중 오류", err);
      }
    },
    [classroomId, authHeaders, showAxiosError],
  );
  useEffect(() => {
    function onDocMouseDown(e) {
      if (contextMenu && menuRef.current && !menuRef.current.contains(e.target))
        setContextMenu(null);

      if (
        viewportRef.current &&
        !viewportRef.current.contains(e.target) &&
        (!menuRef.current || !menuRef.current.contains(e.target))
      ) {
        setSelectedId(null);
        setSelectedIds([]);
        setEditingResizeId(null);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [contextMenu]);

  // ====== Resize handles ======
  const handleSize = 8;
  const handleCursorMap = {
    nw: "nwse-resize",
    se: "nwse-resize",
    ne: "nesw-resize",
    sw: "nesw-resize",
    n: "ns-resize",
    s: "ns-resize",
    e: "ew-resize",
    w: "ew-resize",
  };

  function renderResizeHandles(el) {
    if (!el) return null;
    if (!["방", "제한 구역", "재난 구역", "안전 구역"].includes(el.type))
      return null;
    if (mode !== null) return null;
    if (editingResizeId !== el.id) return null;

    const dispW = Math.max(1, natToDispW(el.width));
    const dispH = Math.max(1, natToDispH(el.height));

    const handles = {
      nw: { x: 0, y: 0 },
      n: { x: dispW / 2, y: 0 },
      ne: { x: dispW, y: 0 },
      e: { x: dispW, y: dispH / 2 },
      se: { x: dispW, y: dispH },
      s: { x: dispW / 2, y: dispH },
      sw: { x: 0, y: dispH },
      w: { x: 0, y: dispH / 2 },
    };

    return Object.entries(handles).map(([name, pt]) => (
      <div
        key={name}
        onMouseDown={(ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          pushUndoSnapshot();

          const startNat = clientToNatural(ev.clientX, ev.clientY);
          setResizing({
            id: el.id,
            handle: name,
            startNat,
            orig: { x: el.x, y: el.y, width: el.width, height: el.height },
          });

          setContextMenu(null);
          setDragging(null);
        }}
        style={{
          position: "absolute",
          left: pt.x - handleSize / 2,
          top: pt.y - handleSize / 2,
          width: handleSize,
          height: handleSize,
          background: "#fff",
          border: "1px solid #444",
          borderRadius: 2,
          zIndex: 200,
          cursor: handleCursorMap[name] || "move",
          pointerEvents: "auto",
          boxSizing: "border-box",
        }}
      />
    ));
  }

  // ====== Buttons ======
  const btnSub =
    "px-4 py-2 bg-[#66BB6A] text-white rounded-lg shadow hover:bg-[#2E7D32] disabled:opacity-60";
  const btnGray =
    "px-4 py-2 bg-gray-700 text-white rounded-lg shadow hover:bg-gray-800 disabled:opacity-60";
  const chipActive = "bg-[#E8F5E9] border-[#2E7D32] text-[#2E7D32]";
  const chipIdle = "bg-white border-gray-200 text-gray-700 hover:bg-gray-50";

  // ====== Render ======
  return (
    <div className="bg-[#F9FBE7] min-h-screen overflow-x-hidden">
      <Navbar />

      <div className="p-8">
        <h2 className="text-3xl font-bold text-[#2E7D32]">학교 환경 설정</h2>

        {/* 상단 툴바 */}
        <div className="p-4 bg-white rounded shadow space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={async () => {
                  await fetchMapVersions();
                  setIsPlanModalOpen(true);
                }}
                className={btnGray}
              >
                구조도 목록
              </button>

              <button
                onClick={() => setShowImage((p) => !p)}
                className={btnGray}
                disabled={!imageSrc}
              >
                {showImage ? "이미지 숨기기" : "이미지 보이기"}
              </button>

              <button onClick={() => setShowHelp((p) => !p)} className={btnSub}>
                {showHelp ? "사용 방법 닫기" : "사용 방법"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTemplateModalOpen(true);
                  fetchMapTemplates();
                }}
                className="px-4 py-2 rounded-lg bg-white border border-green-600 text-green-700 font-semibold hover:bg-green-50"
              >
                템플릿 관리
              </button>
            </div>

            {/* 층 이동/이름 */}
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-2 border rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-60"
                onClick={goPrevFloor}
                disabled={currentFloorIndex === 0}
              >
                ◀ 이전 층
              </button>

              <div className="px-4 py-2 bg-[#E8F5E9] rounded-lg border border-[#2E7D32] text-sm font-medium flex items-center gap-2">
                <span className="text-[#2E7D32]">{currentFloorLabel}</span>
                <button
                  className="text-xs px-2 py-1 border rounded bg-white"
                  onClick={renameFloor}
                >
                  ✏
                </button>
              </div>

              <button
                className="px-3 py-2 border rounded-lg text-sm bg-white hover:bg-gray-50"
                onClick={goNextFloor}
              >
                다음 층 ▶
              </button>
            </div>
          </div>

          {/* 모드 버튼 */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            {autoAnalyzing ? (
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-gray-700">
                  구조도 자동 분석 중...
                </div>
                <button
                  onClick={() => {
                    analyzeRunIdRef.current += 1;
                    setFloors((prev) => {
                      const next = [...prev];
                      const idx = currentFloorIndexRef.current;
                      const curr = next[idx] || makeEmptyFloor();
                      curr?.abort?.analyze?.abort?.();
                      next[idx] = { ...curr, abort: { analyze: null } };
                      return next;
                    });
                    setAutoAnalyzing(false);
                  }}
                  className={btnGray}
                >
                  자동 분석 멈추기
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  const curr = floors[currentFloorIndex];
                  if (!curr?.mapId) {
                    alert("자동 분석할 구조도 mapId가 없습니다.");
                    return;
                  }
                  runAutoAnalyze(currentFloorIndex);
                }}
                className="w-[200px] h-[52px] rounded-xl bg-[#5E8B45] text-white font-extrabold hover:opacity-90"
              >
                구조도 자동 분석
              </button>
            )}

            <div className="text-sm font-semibold text-gray-700 mr-2">
              도구:
            </div>

            {modeButtons.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode((prev) => {
                    if (prev === m) {
                      if (m === "건물윤곽") {
                        setOutlinePoints([]);
                        setOutlineRawPoints([]);
                      }
                      return null;
                    }
                    return m;
                  });
                  setContextMenu(null);
                  setEditingResizeId(null);
                }}
                className={`px-3 py-2 rounded-full border text-sm ${mode === m ? chipActive : chipIdle}`}
                disabled={!imageSrc}
              >
                {m}
              </button>
            ))}

            <div className="flex items-center gap-2 text-sm ml-auto shrink-0">
              <button
                onClick={zoomOut}
                className="px-3 py-2 border rounded bg-white"
                disabled={!imageSrc}
              >
                -
              </button>
              <div className="text-gray-700 w-20 text-center">
                {zoom.toFixed(2)}×
              </div>
              <button
                onClick={zoomIn}
                className="px-3 py-2 border rounded bg-white"
                disabled={!imageSrc}
              >
                +
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setImgOffset({ x: 0, y: 0 });
                }}
                className="px-3 py-2 border rounded bg-white"
                disabled={!imageSrc}
              >
                리셋
              </button>
              <button
                onClick={() => {
                  if (!imageSrc) return;
                  setSavePlanName("");
                  setIsSavePlanModalOpen(true);
                }}
                disabled={!imageSrc}
                className="px-4 py-2 rounded bg-[#2E7D32] text-white font-bold shadow hover:bg-[#256428] disabled:opacity-60"
              >
                저장
              </button>
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                className="px-4 py-2 rounded-lg bg-white border border-green-600 text-green-700 font-semibold hover:bg-green-50"
              >
                템플릿으로 저장
              </button>
            </div>
          </div>

          {/* 도움말 */}
          {showHelp && (
            <div className="p-4 rounded border bg-[#FAFAFA] text-sm text-gray-800 space-y-2">
              <div className="font-bold text-[#2E7D32]">사용 방법(핵심)</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  선택 모드(도구 선택 안함): 클릭=선택, Ctrl+클릭=다중 선택
                </li>
                <li>빈 공간 드래그=박스 선택</li>
                <li>Space 누른 채 드래그=패닝</li>
                <li>Ctrl+휠=줌</li>
                <li>우클릭=삭제/문 회전 등</li>
              </ul>
            </div>
          )}
        </div>

        {/* 편집 영역 */}
        <div className="flex gap-4 items-start mt-4">
          {/* 뷰포트 */}
          <div
            ref={viewportRef}
            className="relative bg-white shadow border"
            style={{
              width: VIEW_W,
              height: VIEW_H,
              userSelect: "none",
              overflow: "hidden",
              position: "relative",
            }}
            onMouseDown={onViewportMouseDown}
            onMouseMove={onViewportMouseMove}
            onMouseUp={onViewportMouseUp}
            onContextMenu={onViewportContextMenu}
            onWheel={onViewportWheel}
          >
            {/* 이미지 */}
            {imageSrc && showImage ? (
              <img
                key={`${currentFloorIndex}-${imageSrc}`}
                src={imageSrc}
                alt="floorplan"
                onLoad={(e) => {
                  console.log("✅ 이미지 로드 성공:", imageSrc);
                  onImgLoad(e);
                }}
                onError={(e) => {
                  console.error("❌ 이미지 로드 실패:", imageSrc, e);
                  setImageLoaded(false);
                }}
                draggable={false}
                style={{
                  position: "absolute",
                  left: imgLeft,
                  top: imgTop,
                  width: displayedW,
                  height: displayedH,
                  pointerEvents: "none",
                  opacity: imageLoaded ? 1 : 0,
                }}
              />
            ) : !imageSrc ? (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#777",
                }}
              >
                저장된 구조도를 불러오거나 맵 버전을 선택하세요.
              </div>
            ) : (
              <div
                style={{
                  color: "#777",
                  position: "absolute",
                  left: 12,
                  top: 12,
                }}
              >
                이미지 숨김 상태
              </div>
            )}

            {/* 건물 윤곽 SVG */}
            <svg
              style={{
                position: "absolute",
                left: imgLeft,
                top: imgTop,
                width: displayedW,
                height: displayedH,
                pointerEvents: "none",
                zIndex: 45,
              }}
            >
              {elements
                .filter(
                  (el) =>
                    el.type === "건물윤곽" &&
                    (el.floor ?? 0) === currentFloorIndex,
                )
                .map((el) => {
                  if (!el.points || el.points.length < 3) return null;
                  const path =
                    el.points
                      .map(
                        (p, i) =>
                          `${i === 0 ? "M" : "L"} ${p.x * displayedScale} ${p.y * displayedScale}`,
                      )
                      .join(" ") + " Z";
                  return (
                    <path
                      key={el.id}
                      d={path}
                      fill="rgba(0,0,0,0.04)"
                      stroke="none"
                    />
                  );
                })}

              {elements
                .filter(
                  (el) =>
                    el.type === "건물윤곽" &&
                    (el.floor ?? 0) === currentFloorIndex,
                )
                .map((el) => {
                  const pts = el.points || [];
                  return pts.map((p, idx) => {
                    const a = p;
                    const b = pts[(idx + 1) % pts.length];
                    const isHoverSeg =
                      hover &&
                      hover.kind === "contour-seg" &&
                      hover.id === el.id &&
                      hover.segIndex === idx;

                    const strokeW = isHoverSeg ? 4 : 2;
                    const strokeColor = isHoverSeg
                      ? "rgba(0,120,220,0.95)"
                      : "rgba(0,0,0,0.6)";

                    return (
                      <line
                        key={`${el.id}-seg-${idx}`}
                        x1={a.x * displayedScale}
                        y1={a.y * displayedScale}
                        x2={b.x * displayedScale}
                        y2={b.y * displayedScale}
                        stroke={strokeColor}
                        strokeWidth={strokeW}
                        pointerEvents="none"
                      />
                    );
                  });
                })}

              {outlinePoints.length > 0 && (
                <>
                  <polyline
                    points={outlinePoints
                      .map(
                        (p) =>
                          `${p.x * displayedScale},${p.y * displayedScale}`,
                      )
                      .join(" ")}
                    fill="none"
                    stroke="rgba(0,120,220,0.9)"
                    strokeWidth={2}
                    strokeDasharray="6"
                  />
                  {outlinePoints.map((p, idx) => (
                    <circle
                      key={idx}
                      cx={p.x * displayedScale}
                      cy={p.y * displayedScale}
                      r={4}
                      fill="rgba(0,120,220,0.9)"
                    />
                  ))}
                </>
              )}
            </svg>

            {/* 요소 렌더 */}
            {elements
              .filter((el) => (el.floor ?? 0) === currentFloorIndex)
              .map((el) => {
                if (el.type === "문") {
                  const dispX = natToDispX(el.x);
                  const dispY = natToDispY(el.y);
                  const doorW = 28 * displayedScale;
                  const doorH = 10 * displayedScale;

                  const transform = `translate(${dispX - doorW / 2}px, ${dispY - doorH / 2}px) rotate(${el.angle || 0}deg)`;
                  const isRotating = rotatingDoorId === el.id;
                  const isHoverDoor =
                    hover && hover.kind === "door" && hover.id === el.id;
                  const isSelectedDoor = selectedIds.includes(el.id);

                  return (
                    <div
                      key={el.id}
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: VIEW_W,
                        height: VIEW_H,
                        pointerEvents: "none",
                        zIndex: isSelectedDoor ? 50 : 35,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          transformOrigin: "center",
                          transform,
                          left: 0,
                          top: 0,
                          width: doorW,
                          height: doorH,
                          pointerEvents: "auto",
                          cursor:
                            mode === null
                              ? "grab"
                              : mode === "문"
                                ? "crosshair"
                                : "default",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            width: doorW,
                            height: doorH,
                            background: "rgba(60,60,60,0.95)",
                            border: isRotating
                              ? "3px solid #ffb84d"
                              : isSelectedDoor
                                ? "2px solid #0b74de"
                                : isHoverDoor
                                  ? "2px dashed #0b74de"
                                  : "1px solid rgba(0,0,0,0.4)",
                            borderRadius: 2,
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    </div>
                  );
                }

                if (el.type === "비콘") {
                  const dispX = natToDispX(el.x);
                  const dispY = natToDispY(el.y);
                  const sizeNat = el.width || BEACON_SIZE;
                  const size = sizeNat * displayedScale;
                  const fontSize = Math.max(BEACON_FONT_MIN, size * 0.55);

                  const isSelected = selectedIds.includes(el.id);
                  const isHoverB =
                    hover && hover.kind === "beacon" && hover.id === el.id;

                  return (
                    <div
                      key={el.id}
                      title={`${el.beaconUuid || ""}\nMajor:${el.beaconMajor ?? ""} Minor:${el.beaconMinor ?? ""}`}
                      style={{
                        position: "absolute",
                        left: dispX - size / 2,
                        top: dispY - size / 2,
                        width: size,
                        height: size,
                        borderRadius: "50%",
                        background:
                          "radial-gradient(circle at 30% 30%, #ffffff 0%, #f2f2f2 55%, #d9d9d9 100%)",
                        border: isSelected
                          ? "3px solid #0b74de"
                          : isHoverB
                            ? "2px dashed #ff8800"
                            : "1px solid rgba(0,0,0,0.18)",
                        boxShadow: "0 6px 14px rgba(0,0,0,0.18)",
                        pointerEvents: "auto",
                        zIndex: 32,

                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize,
                        color: "#111",
                        textShadow: "0 1px 0 rgba(255,255,255,0.85)",
                        userSelect: "none",
                      }}
                    >
                      {el.beaconNo ?? ""}
                    </div>
                  );
                }

                if (el.type === "건물윤곽") return null;

                const isHoverBox =
                  hover && hover.kind === "box" && hover.id === el.id;
                const isSelectedBox = selectedIds.includes(el.id);

                const boxW = Math.max(1, natToDispW(el.width));
                const boxH = Math.max(1, natToDispH(el.height));

                return (
                  <div
                    key={el.id}
                    style={{
                      position: "absolute",
                      left: natToDispX(el.x),
                      top: natToDispY(el.y),
                      width: boxW,
                      height: boxH,
                      backgroundColor: typeColor(el.type, 0.25),
                      border: isSelectedBox
                        ? "3px solid #0b74de"
                        : isHoverBox
                          ? "2px dashed #ff8800"
                          : "2px solid rgba(0,0,0,0.5)",
                      boxSizing: "border-box",
                      zIndex: isSelectedBox ? 40 : 30,
                      pointerEvents: "auto",
                      display: "flex",
                      alignItems: "flex-start",
                    }}
                  >
                    {el.name && (
                      <div
                        style={{
                          background: "rgba(255,255,255,0.9)",
                          padding: "2px 6px",
                          fontSize: 12,
                          borderRadius: 4,
                          margin: 4,
                        }}
                      >
                        {el.name}
                      </div>
                    )}
                    {renderResizeHandles(el)}
                  </div>
                );
              })}

            {/* 미리보기 */}
            {preview && (
              <div
                style={{
                  position: "absolute",
                  left: natToDispX(preview.x),
                  top: natToDispY(preview.y),
                  width: Math.max(1, natToDispW(preview.width)),
                  height: Math.max(1, natToDispH(preview.height)),
                  border: "2px dashed #ff6600",
                  backgroundColor: "rgba(255, 165, 0, 0.12)",
                  zIndex: 60,
                  pointerEvents: "none",
                }}
              />
            )}

            {/* 박스 선택 */}
            {selectionRect && (
              <div
                style={{
                  position: "absolute",
                  left: selectionRect.x,
                  top: selectionRect.y,
                  width: selectionRect.w,
                  height: selectionRect.h,
                  border: "1px dashed #0b74de",
                  background: "rgba(11, 116, 222, 0.08)",
                  zIndex: 90,
                  pointerEvents: "none",
                }}
              />
            )}
          </div>

          {/* 오른쪽 패널 */}
          <div className="w-[320px] shrink-0">
            <div className="bg-white border shadow rounded p-4 space-y-2 sticky top-32">
              <div className="text-sm text-gray-700">
                <b>현재 모드:</b> {mode ?? "선택"}
              </div>
              <div className="text-sm text-gray-700">
                <b>선택:</b>{" "}
                {selectedIds.length ? `${selectedIds.length}개` : "없음"}
              </div>
              <div className="text-sm text-gray-700">
                <b>팁:</b> Space+드래그로 패닝, Ctrl+휠로 줌
              </div>
              <div className="pt-2 border-t text-xs text-gray-500 space-y-1">
                <div>• 우클릭: 삭제/문 회전</div>
                <div>• ESC: 모드/드래그/회전 취소</div>
              </div>
            </div>
          </div>
        </div>

        {/* 컨텍스트 메뉴 */}
        {contextMenu && (
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              left: contextMenu.x,
              top: contextMenu.y,
              transform: contextMenu.flipY
                ? "translateY(-100%)"
                : "translateY(0)",
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: 6,
              boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
              zIndex: 200,
              minWidth: 220,
              overflow: "hidden",
            }}
          >
            {contextMenu.options.map((opt, i) => (
              <div
                key={i}
                onClick={() => opt.action()}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  borderBottom:
                    i === contextMenu.options.length - 1
                      ? "none"
                      : "1px solid #eee",
                  fontSize: 13,
                }}
                onMouseEnter={(ev) =>
                  (ev.currentTarget.style.background = "#f5f5f5")
                }
                onMouseLeave={(ev) =>
                  (ev.currentTarget.style.background = "#fff")
                }
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ 구조도 목록 모달 */}
      {isPlanModalOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
          onMouseDown={() => setIsPlanModalOpen(false)}
        >
          <div
            className="bg-white w-[1120px] max-w-[95vw] h-[86vh] rounded-[24px] shadow-xl overflow-hidden relative"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-8 pt-7 pb-4 border-b">
              <div className="text-[20px] font-extrabold text-gray-900">
                저장된 구조도
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-gray-100 text-gray-600 text-2xl leading-none"
                aria-label="닫기"
                title="닫기"
              >
                ×
              </button>
            </div>

            <div className="flex h-[calc(86vh-84px)]">
              {/* 가운데 목록 */}
              <div className="w-[420px] bg-[#F7F8F5] border-r px-6 py-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                  <div className="text-[18px] font-extrabold text-[#3F6D2B]">
                    구조도 목록
                  </div>

                  <button
                    onClick={fetchMapVersions}
                    className="px-4 py-2 rounded-xl bg-[#9CCC7C] text-white font-bold hover:opacity-90"
                  >
                    새로고침
                  </button>
                </div>

                {mapLoading && (
                  <div className="text-sm text-gray-500">불러오는 중.</div>
                )}

                {!mapLoading && mapVersions.length === 0 && (
                  <div className="text-sm text-gray-500">
                    저장된 구조도가 없습니다.
                  </div>
                )}

                {!mapLoading &&
                  mapVersions.map((mv) => {
                    const active = mv.mapVersionId === selectedPlanId;

                    return (
                      <button
                        key={mv.mapVersionId}
                        type="button"
                        onClick={async () => {
                          setSelectedPlanId(mv.mapVersionId);
                          setPlanFloorIdx(0);

                          const detail = await fetchMapVersionDetail(
                            mv.mapVersionId,
                          );
                          setSelectedPlanDetail(detail);
                        }}
                        className={`w-full text-left rounded-2xl border p-5 mb-4 transition ${
                          active
                            ? "border-[#5E8B45] bg-[#EEF5E9] shadow-sm"
                            : "border-[#E3E6DD] bg-white hover:bg-[#F5F8F1]"
                        }`}
                      >
                        <div className="text-[16px] font-extrabold text-black">
                          {mv.label || "이름 없는 구조도"}
                        </div>

                        <div className="text-sm text-gray-500 mt-2">
                          {mv.createdAt
                            ? new Date(mv.createdAt).toLocaleString("ko-KR")
                            : "저장 시각 정보 없음"}
                        </div>

                        {mv.mapVersionId === activeMapVersionId && (
                          <div className="mt-3 inline-flex items-center rounded-lg bg-[#5E8B45] px-3 py-1 text-xs font-bold text-white">
                            활성 맵
                          </div>
                        )}
                      </button>
                    );
                  })}
              </div>

              {/* 오른쪽 미리보기 */}
              <div className="flex-1 bg-white px-6 py-6 overflow-y-auto">
                {!selectedPlan ? (
                  <div className="h-full flex items-center justify-center text-sm text-gray-500">
                    왼쪽에서 구조도를 선택하세요.
                  </div>
                ) : (
                  <div className="h-full flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[22px] font-extrabold text-black">
                          {selectedPlan.label || "이름 없는 구조도"}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          미리보기
                        </div>
                      </div>

                      {selectedPlanFloors.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">층 선택</span>
                          <select
                            value={planFloorIdx}
                            onChange={(e) =>
                              setPlanFloorIdx(Number(e.target.value))
                            }
                            className="border rounded-lg px-3 py-2 text-sm bg-white"
                          >
                            {selectedPlanFloors.map((f, idx) => (
                              <option key={idx} value={idx}>
                                {f.name || `${idx + 1}층`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div
                      ref={planPreviewRef}
                      className="flex-1 min-h-[420px] rounded-2xl border bg-[#FCFCFA] p-4"
                    >
                      {!previewFloor ? (
                        <div className="h-full flex items-center justify-center text-sm text-gray-500">
                          미리보기 데이터가 없습니다.
                        </div>
                      ) : (
                        <>
                          <div className="w-full overflow-auto rounded-xl border bg-white">
                            <svg
                              width="100%"
                              viewBox={`0 0 ${
                                previewFloor?.image?.natural?.w || 1000
                              } ${previewFloor?.image?.natural?.h || 700}`}
                              style={{ display: "block", background: "#fff" }}
                            >
                              {toPublicImg(previewFloor?.image?.src) && (
                                <image
                                  href={toPublicImg(previewFloor?.image?.src)}
                                  x="0"
                                  y="0"
                                  width={
                                    previewFloor?.image?.natural?.w || 1000
                                  }
                                  height={
                                    previewFloor?.image?.natural?.h || 700
                                  }
                                  preserveAspectRatio="xMidYMid meet"
                                />
                              )}

                              {(previewFloor?.elements || []).map((el) => {
                                if (
                                  el.type === "건물윤곽" &&
                                  Array.isArray(el.points)
                                ) {
                                  return (
                                    <polygon
                                      key={el.id}
                                      points={el.points
                                        .map((p) => `${p.x},${p.y}`)
                                        .join(" ")}
                                      fill="rgba(80,120,255,0.08)"
                                      stroke="rgba(60,60,60,0.9)"
                                      strokeWidth="3"
                                    />
                                  );
                                }

                                if (el.type === "문") {
                                  return (
                                    <circle
                                      key={el.id}
                                      cx={el.x}
                                      cy={el.y}
                                      r="12"
                                      fill="rgba(120,120,120,0.9)"
                                    />
                                  );
                                }

                                if (el.type === "비콘") {
                                  return (
                                    <circle
                                      key={el.id}
                                      cx={el.x}
                                      cy={el.y}
                                      r="14"
                                      fill="rgba(255,140,0,0.9)"
                                    />
                                  );
                                }

                                return (
                                  <rect
                                    key={el.id}
                                    x={el.x}
                                    y={el.y}
                                    width={el.width || 0}
                                    height={el.height || 0}
                                    fill={typeColor(el.type, 0.25)}
                                    stroke="rgba(0,0,0,0.55)"
                                    strokeWidth="2"
                                    rx="4"
                                  />
                                );
                              })}
                            </svg>
                          </div>

                          <div className="mt-4">
                            <div className="text-sm font-bold text-gray-800 mb-2">
                              요소 요약
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>
                                총 {previewFloor?.elements?.length || 0}개
                              </div>
                              <div>
                                건물윤곽:{" "}
                                {
                                  (previewFloor?.elements || []).filter(
                                    (el) => el.type === "건물윤곽",
                                  ).length
                                }
                              </div>
                              <div>
                                방:{" "}
                                {
                                  (previewFloor?.elements || []).filter(
                                    (el) => el.type === "방",
                                  ).length
                                }
                              </div>
                              <div>
                                안전 구역:{" "}
                                {
                                  (previewFloor?.elements || []).filter(
                                    (el) => el.type === "안전 구역",
                                  ).length
                                }
                              </div>
                              <div>
                                비상구/문:{" "}
                                {
                                  (previewFloor?.elements || []).filter(
                                    (el) => el.type === "문",
                                  ).length
                                }
                              </div>
                            </div>
                          </div>

                          <div className="mt-5">
                            <button
                              onClick={async () => {
                                if (!selectedPlan?.mapVersionId) {
                                  alert("적용할 구조도를 먼저 선택하세요.");
                                  return;
                                }

                                await setActiveMapToServer(
                                  selectedPlan.mapVersionId,
                                );
                                setIsPlanModalOpen(false);
                              }}
                              className="w-full h-[52px] rounded-xl bg-[#5E8B45] text-white font-extrabold hover:opacity-90"
                            >
                              이 구조도를 현재 층에 적용
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ✅ 저장 모달 (구조도 목록 모달 바깥) */}
      {isSavePlanModalOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
          onMouseDown={() => setIsSavePlanModalOpen(false)}
        >
          <div
            className="bg-white w-[520px] rounded-lg shadow p-4 relative"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold">구조도 저장</div>
              <button
                onClick={() => setIsSavePlanModalOpen(false)}
                className="w-9 h-9 rounded hover:bg-gray-100 text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="text-sm text-gray-700 mb-2">
              저장할 구조도 이름을 입력하세요
            </div>

            <input
              value={savePlanName}
              onChange={(e) => setSavePlanName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="예) 제한구역 3개 구조도"
              autoFocus
            />
            <div className="flex justify-end mt-6">
              <button
                onClick={saveMapVersionToServer}
                className="px-6 py-3 rounded-xl bg-[#2E7D32] text-white font-bold hover:bg-[#256428]"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-[#2E7D32]">템플릿 관리</h3>
              <button
                type="button"
                onClick={() => {
                  setIsTemplateModalOpen(false);
                  setSelectedTemplateId(null);
                  setSelectedTemplateDetail(null);
                }}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                닫기
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* 왼쪽: 템플릿 목록 */}
              <div className="border rounded-xl p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold">템플릿 목록</h4>
                  <button
                    type="button"
                    onClick={fetchMapTemplates}
                    className="px-3 py-2 rounded-lg border border-green-600 text-green-700 hover:bg-green-50"
                  >
                    새로고침
                  </button>
                </div>

                {templates.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    저장된 템플릿이 없습니다.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto">
                    {templates.map((tpl) => {
                      const templateId =
                        tpl.templateId || tpl.id || tpl.mapTemplateId || "";

                      const templateTitle =
                        tpl.templateName || tpl.name || "이름 없는 템플릿";

                      return (
                        <div
                          key={templateId}
                          className={`rounded-xl border p-3 ${
                            selectedTemplateId === templateId
                              ? "border-green-600 bg-green-50"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => setSelectedTemplateId(templateId)}
                              className="flex-1 text-left"
                            >
                              <div className="font-semibold text-gray-900">
                                {templateTitle}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {tpl.description || "설명 없음"}
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteTemplate(templateId)}
                              className="shrink-0 px-3 py-2 rounded-lg border border-red-500 text-red-600 hover:bg-red-50"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 오른쪽: 선택 템플릿 상세 */}
              <div className="border rounded-xl p-4 bg-white">
                <h4 className="text-lg font-semibold mb-3">템플릿 상세</h4>

                {!selectedTemplateDetail ? (
                  <p className="text-sm text-gray-500">
                    왼쪽에서 템플릿을 선택하세요.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        템플릿 이름
                      </label>
                      <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="템플릿 이름"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        설명
                      </label>
                      <textarea
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 min-h-[120px]"
                        placeholder="템플릿 설명"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!selectedTemplateId) {
                            alert("수정할 템플릿을 먼저 선택하세요.");
                            return;
                          }

                          const updated = await updateMapTemplateMeta(
                            selectedTemplateId,
                            {
                              templateName,
                              description: templateDescription,
                            },
                          );

                          if (!updated) return;

                          await fetchMapTemplates();
                          const detail =
                            await fetchMapTemplateDetail(selectedTemplateId);
                          setSelectedTemplateDetail(detail);
                          alert("✅ 템플릿이 수정되었습니다.");
                        }}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                      >
                        수정 저장
                      </button>
                    </div>

                    <div className="text-xs text-gray-500 pt-2 border-t">
                      선택된 템플릿 ID:{" "}
                      {selectedTemplateDetail.templateId ||
                        selectedTemplateDetail.id ||
                        selectedTemplateId}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ✅ 비콘 입력 모달 */}
      {isBeaconModalOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
          onMouseDown={() => {
            setIsBeaconModalOpen(false);
            setPendingBeaconNat(null);
            setEditingBeaconId(null);
          }}
        >
          <div
            className="bg-white w-[520px] rounded-lg shadow p-4 relative"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold">
                {editingBeaconId ? "비콘 정보 수정" : "비콘 정보 입력"}
              </div>
              <button
                onClick={() => {
                  setIsBeaconModalOpen(false);
                  setPendingBeaconNat(null);
                  setEditingBeaconId(null);
                }}
                className="w-9 h-9 rounded hover:bg-gray-100 text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="text-sm text-gray-700 mb-3">
              이 위치에 추가할 비콘의 UUID / Major / Minor 를 입력하세요.
            </div>

            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-600 mb-1">UUID</div>
                <input
                  value={beaconForm.uuid}
                  onChange={(e) =>
                    setBeaconForm((p) => ({ ...p, uuid: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                  placeholder="예: 31415926-5358-9793-2384-626433832795"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Major</div>
                  <input
                    value={beaconForm.major}
                    onChange={(e) =>
                      setBeaconForm((p) => ({ ...p, major: e.target.value }))
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="예: 3"
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <div className="text-xs text-gray-600 mb-1">Minor</div>
                  <input
                    value={beaconForm.minor}
                    onChange={(e) =>
                      setBeaconForm((p) => ({ ...p, minor: e.target.value }))
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="예: 301"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="text-xs text-gray-500 pt-2">
                {editingBeaconId ? (
                  <div className="text-xs text-gray-500 pt-2">
                    표시 번호:{" "}
                    <b>
                      {elements.find((e) => e.id === editingBeaconId)
                        ?.beaconNo ?? "-"}
                    </b>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 pt-2">
                    표시 번호: <b>{nextBeaconNo}</b> (현재 층 기준 자동 부여)
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 rounded border hover:bg-gray-50"
                onClick={() => {
                  setIsBeaconModalOpen(false);
                  setPendingBeaconNat(null);
                }}
              >
                취소
              </button>
              <button
                onClick={confirmAddBeacon}
                className="px-6 py-2 rounded bg-[#2E7D32] text-white font-bold hover:bg-[#256428]"
              >
                {editingBeaconId ? "수정" : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
