// pages/ScenarioManagement.jsx
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import { useLocation } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

// 재난 유형별 팀 구성 매핑
// 화재 시나리오는 백엔드에서 요구하는 teamCode를 반드시 사용합니다.
const TEAM_TYPES_BY_DISASTER = {
  화재: [
    { teamCode: "FIRE", teamName: "소화팀" },
    { teamCode: "CIVILIAN", teamName: "시민" },
    { teamCode: "EMERGENCY", teamName: "응급팀" },
  ],

  // 지진 시나리오의 실제 teamCode는 백엔드 명세 확인 후 변경하세요.
  지진: [{ teamCode: "CIVILIAN", teamName: "시민" }],
};

// 재난 유형별 발생 설정 라벨
const OCCUR_CONFIG = {
  지진: { locationLabel: "지진 피해 위치" },
  화재: { locationLabel: "화재 발생 위치" },
};

function ScenarioManagement() {
  const location = useLocation();

  // ✅ fallback 절대 금지
  const storedRoomContext = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("roomContext") || "{}");
    } catch {
      return {};
    }
  }, []);

  const classroomId = useMemo(() => {
    return (
      location.state?.classroomId ||
      location.state?.roomId ||
      location.state?.classroomID ||
      storedRoomContext?.classroomId ||
      null
    );
  }, [location.state, storedRoomContext]);

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // axios 공통 설정
  const axiosConfig = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        ...authHeaders,
      },
      timeout: 10000,
      validateStatus: () => true,
    }),
    [authHeaders],
  );

  // ====== 시나리오 목록 ======
  const [scenarioList, setScenarioList] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  // 선택된 시나리오(수정 대상)
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [scenarioName, setScenarioName] = useState("");

  // 재난 선택
  const [disasterType, setDisasterType] = useState("지진");

  // 발생 설정 상태
  const [fireSetting, setFireSetting] = useState("자동설정");
  const [fireLocation, setFireLocation] = useState("");
  const [trainingTime, setTrainingTime] = useState("");

  // 팀 설정 상태
  const [teamSetting, setTeamSetting] = useState("자동설정");
  const [teamCounts, setTeamCounts] = useState({});

  // NPC 설정 상태
  const [npcSetting, setNpcSetting] = useState("자동설정");
  const [npcPosition, setNpcPosition] = useState("");
  const [npcStatus, setNpcStatus] = useState("");

  const [saving, setSaving] = useState(false);

  // 드롭다운 옵션
  const fireLocations = ["1층", "2층", "3층", "4층"];
  const npcPositions = ["입구", "복도", "계단", "출구"];
  const npcStatuses = ["정상", "이상", "대기"];

  const teamTypes = TEAM_TYPES_BY_DISASTER[disasterType] || [];

  const occurConfig = OCCUR_CONFIG[disasterType] || {
    locationLabel: "발생 위치",
  };

  const isAllAuto =
    fireSetting === "자동설정" &&
    teamSetting === "자동설정" &&
    npcSetting === "자동설정";

  useEffect(() => {
    if (isAllAuto) {
      setFireLocation("");
      setTrainingTime("");
      setNpcPosition("");
      setNpcStatus("");
      setTeamCounts({});
    }
  }, [isAllAuto]);

  useEffect(() => {
    setTeamCounts((prev) => {
      const next = {};

      teamTypes.forEach((team) => {
        next[team.teamCode] = prev[team.teamCode] || "";
      });

      return next;
    });
  }, [disasterType]);

  const handleTeamCountChange = (team, value) => {
    const onlyNumber = value.replace(/[^0-9]/g, "");
    setTeamCounts((prev) => ({ ...prev, [team]: onlyNumber }));
  };

  const handleTrainingTimeChange = (value) => {
    const onlyNumber = value.replace(/[^0-9]/g, "");
    setTrainingTime(onlyNumber);
  };

  const buildManualTeamCounts = () => {
    return (
      teamTypes
        .map((team) => ({
          teamCode: team.teamCode,
          teamName: team.teamName,
          maxMembers: Number(teamCounts[team.teamCode] || 0),
        }))
        // 인원이 0명인 팀은 요청에서 제외해야 합니다.
        .filter((team) => team.maxMembers > 0)
    );
  };
  const [activeStudentCount, setActiveStudentCount] = useState(
    Number(location.state?.studentCount ?? 0),
  );

  useEffect(() => {
    const fetchActiveStudentCount = async () => {
      if (!classroomId) {
        setActiveStudentCount(0);
        return;
      }

      try {
        const res = await axios.get(
          `${API_BASE}/api/rooms/${classroomId}/students`,
          {
            headers: { ...authHeaders },
            timeout: 10000,
            validateStatus: () => true,
          },
        );

        if (!(res.status >= 200 && res.status < 300)) {
          console.warn("학생 목록 조회 실패 =", res.status, res.data);
          return;
        }

        const students = Array.isArray(res.data) ? res.data : [];

        const activeStudents = students.filter((student) => {
          const status = String(student?.status || "")
            .trim()
            .toUpperCase();

          return student?.isKicked !== true && status !== "KICKED";
        });

        setActiveStudentCount(activeStudents.length);
      } catch (err) {
        console.error("학생 수 조회 중 오류 =", err);
      }
    };

    fetchActiveStudentCount();
  }, [classroomId, authHeaders]);
  // 서버 응답 정규화
  const normalizeScenario = (s) => {
    return {
      id: s?.id ?? s?.scenarioId ?? "",
      classroomId: s?.classroomId ?? "",
      scenarioName: s?.scenarioName ?? "",
      scenarioType: s?.scenarioType ?? "EARTHQUAKE",
      triggerMode: s?.triggerMode ?? "AUTO",
      teamMode: s?.teamMode ?? "AUTO",
      npcMode: s?.npcMode ?? "AUTO",
      location: s?.location ?? "",
      intensity: Number(s?.intensity ?? 0),
      trainTime: Number(s?.trainTime ?? 0),
      teamAssignmentJson: s?.teamAssignmentJson ?? s?.teamAssignment ?? "{}",
      npcPositionsJson:
        s?.npcPositionsJson ?? s?.npcPositions ?? '{"position":"","status":""}',
      participantCount: Number(s?.participantCount ?? 0),
      createdTime: s?.createdTime ?? s?.createdAt ?? null,
    };
  };

  const makePayload = (
    { includeScenarioId } = { includeScenarioId: false },
  ) => {
    const scenarioType = disasterType === "화재" ? "FIRE" : "EARTHQUAKE";
    const triggerMode = fireSetting === "자동설정" ? "AUTO" : "MANUAL";
    const teamMode = teamSetting === "자동설정" ? "AUTO" : "MANUAL";
    const npcMode = npcSetting === "자동설정" ? "AUTO" : "MANUAL";

    const trainTime = trainingTime ? parseInt(trainingTime, 10) : 0;

    const normalizedTeamCounts = Object.fromEntries(
      Object.entries(teamCounts || {}).map(([teamCode, count]) => [
        teamCode,
        Number(count || 0),
      ]),
    );

    const teamAssignment = JSON.stringify(normalizedTeamCounts);
    const npcPositions = JSON.stringify({
      position: npcPosition || "",
      status: npcStatus || "",
    });
    const base = {
      classroomId,
      scenarioName: scenarioName?.trim() || `${disasterType} 시나리오`,
      scenarioType,
      triggerMode,
      teamMode,
      npcMode,
      location: fireLocation || "",
      intensity: 0,
      trainTime,
      teamAssignment,
      npcPositions,
      participantCount: 0,
    };

    if (includeScenarioId) {
      return {
        scenarioId: selectedScenarioId,
        scenarioName: base.scenarioName,
        scenarioType: base.scenarioType,
        triggerMode: base.triggerMode,
        teamMode: base.teamMode,
        npcMode: base.npcMode,
        location: base.location,
        intensity: base.intensity,
        trainTime: base.trainTime,
        teamAssignment: base.teamAssignment,
        npcPositions: base.npcPositions,
        participantCount: base.participantCount,
      };
    }

    return base;
  };

  const saveScenarioConfigToLocalStorage = ({
    scenarioId,
    scenarioType,
    teamMode,
    teamAssignment,
  }) => {
    try {
      const prev = JSON.parse(localStorage.getItem("gameContext") || "{}");

      localStorage.setItem(
        "gameContext",
        JSON.stringify({
          ...prev,
          classroomId,
          scenarioId,
          activeScenarioId: scenarioId,
          scenarioType,
          teamMode,
          teamAssignmentJson: teamAssignment || "{}",
        }),
      );
    } catch (err) {
      console.error("gameContext 저장 실패 =", err);
    }
  };
  const showAxiosError = (title, errOrRes) => {
    const response = errOrRes?.response || errOrRes;
    const data = response?.data || {};
    const code = data?.code || "";

    if (code === "INVALID_JSON_REQUEST") {
      alert("요청 JSON 형식 또는 인코딩을 확인해 주세요.");
      return;
    }

    if (response?.status) {
      alert(
        `${title} (${response.status})\n\n${
          data?.message ||
          (typeof data === "string" ? data : JSON.stringify(data, null, 2))
        }`,
      );
      return;
    }

    alert(`${title}\n\n${errOrRes?.message || "알 수 없는 오류"}`);
  };

  // ✅ 목록 조회
  const fetchScenarioList = async () => {
    if (!classroomId) {
      setScenarioList([]);
      return;
    }

    try {
      setListLoading(true);

      const res = await axios.get(
        `${API_BASE}/api/scenarios/classroom/${classroomId}`,
        {
          headers: { ...authHeaders },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      if (!(res.status >= 200 && res.status < 300)) {
        setScenarioList([]);
        showAxiosError("시나리오 목록 조회 실패", res);
        return;
      }

      const list = Array.isArray(res.data)
        ? res.data.map(normalizeScenario)
        : [];
      setScenarioList(list);

      // ✅ 현재 활성 시나리오 조회
      const ctxRes = await axios.get(
        `${API_BASE}/api/rooms/${classroomId}/game-start-context`,
        {
          headers: { ...authHeaders },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      if (ctxRes.status >= 200 && ctxRes.status < 300) {
        const activeId =
          ctxRes.data?.scenarioId ||
          ctxRes.data?.activeScenarioId ||
          ctxRes.data?.active_scenario_id ||
          null;

        setActiveScenarioId(activeId);
      }
    } catch (err) {
      console.error(err);
      setScenarioList([]);
      showAxiosError("시나리오 목록 조회 중 오류", err);
    } finally {
      setListLoading(false);
    }
  };

  // ✅ 생성
  const handleCreateScenario = async () => {
    if (!classroomId) {
      alert(
        "classroomId를 못 넘겨받았습니다. SchoolChannel에서 들어와야 합니다.",
      );
      return;
    }

    try {
      setSaving(true);

      const payload = makePayload({ includeScenarioId: false });

      const res = await axios.post(
        `${API_BASE}/api/scenarios`,
        payload,
        axiosConfig,
      );

      if (!(res.status >= 200 && res.status < 300)) {
        showAxiosError("시나리오 생성 실패", res);
        return;
      }

      alert("✅ 시나리오가 생성되었습니다.");

      const createdScenarioId = res.data?.scenarioId || res.data?.id || null;

      // ✅ 여기에 추가
      saveScenarioConfigToLocalStorage({
        scenarioId: createdScenarioId,
        scenarioType: payload.scenarioType,
        teamMode: payload.teamMode,
        teamAssignment: payload.teamAssignment,
      });

      setSelectedScenarioId(createdScenarioId);

      if (createdScenarioId) {
        await recordScenarioAction({
          scenarioId: createdScenarioId,
          classroomId,
          studentId: "",
          actionType: "SCENARIO_CREATED",
          floorIndex: 0,
          elementId: "",
          beaconId: "",
          valueInt: 0,
          valueText: scenarioName?.trim() || "",
          metaJson: {
            scenarioType: disasterType,
            triggerMode: fireSetting,
            teamMode: teamSetting,
            npcMode: npcSetting,
          },
        });
      }

      await fetchScenarioList();
    } catch (err) {
      console.error(err);
      showAxiosError("시나리오 생성 중 오류", err);
    } finally {
      setSaving(false);
    }
  };

  // ✅ 수정
  const handleUpdateScenario = async () => {
    if (!classroomId) {
      alert(
        "classroomId를 못 넘겨받았습니다. SchoolChannel에서 들어와야 합니다.",
      );
      return;
    }

    if (!selectedScenarioId) {
      alert("수정할 시나리오를 먼저 선택해 주세요.");
      return;
    }

    try {
      setSaving(true);

      const payload = makePayload({ includeScenarioId: true });

      let res = await axios.put(
        `${API_BASE}/api/scenarios`,
        payload,
        axiosConfig,
      );

      if (res.status === 405) {
        res = await axios.patch(
          `${API_BASE}/api/scenarios`,
          payload,
          axiosConfig,
        );
      }

      if (!(res.status >= 200 && res.status < 300)) {
        showAxiosError("시나리오 수정 실패", res);
        return;
      }

      alert("✅ 시나리오가 수정되었습니다.");

      saveScenarioConfigToLocalStorage({
        scenarioId: selectedScenarioId,
        scenarioType: payload.scenarioType,
        teamMode: payload.teamMode,
        teamAssignment: payload.teamAssignment,
      });
      await fetchScenarioList();
    } catch (err) {
      console.error(err);
      showAxiosError("시나리오 수정 중 오류", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveScenario = async () => {
    if (selectedScenarioId) {
      await handleUpdateScenario();
    } else {
      await handleCreateScenario();
    }
  };

  // ✅ 시나리오 액션 이벤트 기록 (UI 노출 없이 데이터 기록용)
  const recordScenarioAction = async ({
    scenarioId,
    classroomId: reqClassroomId,
    studentId,
    actionType,
    floorIndex = 0,
    elementId = "",
    beaconId = "",
    valueInt = 0,
    valueText = "",
    metaJson = "",
  }) => {
    if (!scenarioId) {
      console.warn("recordScenarioAction: scenarioId가 없습니다.");
      return null;
    }

    const payload = {
      classroomId: reqClassroomId || classroomId,
      studentId: studentId || "",
      actionType: actionType || "",
      floorIndex: Number(floorIndex || 0),
      elementId: elementId || "",
      beaconId: beaconId || "",
      valueInt: Number(valueInt || 0),
      valueText: valueText || "",
      metaJson:
        typeof metaJson === "string"
          ? metaJson
          : JSON.stringify(metaJson || {}),
    };

    try {
      const res = await axios.post(
        `${API_BASE}/api/scenarios/${scenarioId}/actions`,
        payload,
        axiosConfig,
      );

      if (!(res.status >= 200 && res.status < 300)) {
        console.error("시나리오 액션 기록 실패 =", res.status, res.data);
        return null;
      }

      return res.data || null;
    } catch (err) {
      console.error("시나리오 액션 기록 중 오류 =", err);
      return null;
    }
  };

  // ✅ 호출형 미션 시작
  const startScenarioCallMission = async ({
    scenarioId,
    studentId,
    assignmentId,
  }) => {
    if (!scenarioId) {
      console.warn("startScenarioCallMission: scenarioId가 없습니다.");
      return null;
    }

    const payload = {
      studentId: studentId || "",
      assignmentId: assignmentId || "",
    };

    try {
      const res = await axios.post(
        `${API_BASE}/api/scenarios/${scenarioId}/call/start`,
        payload,
        axiosConfig,
      );

      if (!(res.status >= 200 && res.status < 300)) {
        console.error("호출형 미션 시작 실패 =", res.status, res.data);
        return null;
      }

      return res.data || null;
    } catch (err) {
      console.error("호출형 미션 시작 중 오류 =", err);
      return null;
    }
  };

  // ✅ 호출형 미션 종료
  const endScenarioCallMission = async ({
    scenarioId,
    studentId,
    assignmentId,
    success,
  }) => {
    if (!scenarioId) {
      console.warn("endScenarioCallMission: scenarioId가 없습니다.");
      return null;
    }

    const payload = {
      studentId: studentId || "",
      assignmentId: assignmentId || "",
      success: !!success,
    };

    try {
      const res = await axios.post(
        `${API_BASE}/api/scenarios/${scenarioId}/call/end`,
        payload,
        axiosConfig,
      );

      if (!(res.status >= 200 && res.status < 300)) {
        console.error("호출형 미션 종료 실패 =", res.status, res.data);
        return null;
      }

      return res.data || null;
    } catch (err) {
      console.error("호출형 미션 종료 중 오류 =", err);
      return null;
    }
  };
  // ✅ 팀별 정원 저장
  const distributeTeams = async (scenarioId) => {
    if (!scenarioId) {
      alert("팀을 설정할 scenarioId가 없습니다.");
      return null;
    }

    const isManual = teamSetting === "수동설정";

    let payload = {
      mode: isManual ? "MANUAL" : "AUTO",
    };

    if (isManual) {
      const manualTeamCounts = buildManualTeamCounts();

      if (manualTeamCounts.length === 0) {
        alert("수동 팀 설정을 사용할 경우 팀별 인원 수를 입력하세요.");
        return null;
      }

      const totalManualCount = manualTeamCounts.reduce(
        (sum, team) => sum + Number(team.maxMembers || 0),
        0,
      );

      if (activeStudentCount <= 0) {
        alert(
          "현재 배정할 학생이 없습니다.\n" +
            "학생이 입장한 뒤 팀 배정을 다시 진행해 주세요.",
        );

        return null;
      }

      if (totalManualCount !== activeStudentCount) {
        alert(
          `팀별 인원 수 합계(${totalManualCount}명)가 ` +
            `전체 학생 수(${activeStudentCount}명)와 같아야 합니다.`,
        );

        return null;
      }

      const teamCodes = manualTeamCounts.map((team) => team.teamCode);

      const hasDuplicatedTeamCode =
        new Set(teamCodes).size !== teamCodes.length;

      if (hasDuplicatedTeamCode) {
        alert("중복된 팀 코드가 있습니다.");
        return null;
      }

      payload = {
        mode: "MANUAL",
        manualTeamCounts,
      };
    }

    console.log("팀별 정원 저장 payload =", payload);

    try {
      const res = await axios.post(
        `${API_BASE}/api/scenarios/${scenarioId}/teams/distribute`,
        payload,
        axiosConfig,
      );

      console.log("팀별 정원 저장 응답 =", res.status, res.data);

      if (!(res.status >= 200 && res.status < 300)) {
        showAxiosError("팀별 정원 저장 실패", res);
        return null;
      }

      return res.data || null;
    } catch (err) {
      console.error(err);
      showAxiosError("팀별 정원 저장 중 오류", err);
      return null;
    }
  };

  // ✅ 저장된 팀 정원을 기준으로 학생 랜덤 배정
  const assignStudentsToTeams = async (scenarioId) => {
    if (!scenarioId) {
      alert("학생을 배정할 scenarioId가 없습니다.");
      return null;
    }

    try {
      const res = await axios.post(
        `${API_BASE}/api/scenarios/${scenarioId}/teams/assign-students`,
        {},
        axiosConfig,
      );

      console.log("✅ 학생 팀 배정 응답 =", res.status, res.data);

      if (!(res.status >= 200 && res.status < 300)) {
        showAxiosError("학생 팀 배정 실패", res);
        return null;
      }

      return res.data || null;
    } catch (err) {
      console.error(err);
      showAxiosError("학생 팀 배정 중 오류", err);
      return null;
    }
  };
  // ✅ 팀 정원을 저장한 뒤 학생을 랜덤 배정
  const handleConfirmTeamAssignment = async () => {
    if (!selectedScenarioId) {
      alert("먼저 시나리오를 저장하거나 목록에서 선택하세요.");
      return;
    }

    // ✅ 현재 화면의 팀 설정을 localStorage에 먼저 저장
    const normalizedTeamCounts = Object.fromEntries(
      Object.entries(teamCounts || {}).map(([teamCode, count]) => [
        teamCode,
        Number(count || 0),
      ]),
    );

    saveScenarioConfigToLocalStorage({
      scenarioId: selectedScenarioId,
      scenarioType: disasterType === "화재" ? "FIRE" : "EARTHQUAKE",
      teamMode: teamSetting === "수동설정" ? "MANUAL" : "AUTO",
      teamAssignment: JSON.stringify(normalizedTeamCounts),
    });

    const distributed = await distributeTeams(selectedScenarioId);
    if (!distributed) return;

    const assigned = await assignStudentsToTeams(selectedScenarioId);
    if (!assigned) return;

    console.log("✅ 최종 학생별 팀 배정 결과 =", assigned);

    alert("✅ 팀별 정원 저장 및 학생 랜덤 배정이 완료되었습니다.");
  };

  // ✅ 시나리오 평가 실행
  const evaluateScenario = async (scenarioId) => {
    if (!scenarioId) {
      alert("평가할 scenarioId가 없습니다.");
      return null;
    }

    try {
      const res = await axios.post(
        `${API_BASE}/api/scenarios/${scenarioId}/evaluate`,
        {},
        axiosConfig,
      );

      if (!(res.status >= 200 && res.status < 300)) {
        showAxiosError("시나리오 평가 실행 실패", res);
        return null;
      }

      return res.data || null;
    } catch (err) {
      console.error(err);
      showAxiosError("시나리오 평가 실행 중 오류", err);
      return null;
    }
  };

  // ✅ 시나리오 평가 결과 조회
  const fetchScenarioEvaluations = async (scenarioId) => {
    if (!scenarioId) {
      alert("조회할 scenarioId가 없습니다.");
      return null;
    }

    try {
      const res = await axios.get(
        `${API_BASE}/api/scenarios/${scenarioId}/evaluations`,
        {
          headers: { ...authHeaders },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      if (!(res.status >= 200 && res.status < 300)) {
        showAxiosError("시나리오 평가 결과 조회 실패", res);
        return null;
      }

      return res.data || null;
    } catch (err) {
      console.error(err);
      showAxiosError("시나리오 평가 결과 조회 중 오류", err);
      return null;
    }
  };

  // ✅ 선택 시 폼에 채우기
  const handlePickScenario = async (rawScenario) => {
    const s = normalizeScenario(rawScenario);

    const ok = await activateScenario(s.id);
    if (!ok) return;

    setSelectedScenarioId(s.id);
    setActiveScenarioId(s.id);
    setScenarioName(s.scenarioName || "");

    setDisasterType(s.scenarioType === "FIRE" ? "화재" : "지진");

    setFireSetting(s.triggerMode === "MANUAL" ? "수동설정" : "자동설정");
    setTeamSetting(s.teamMode === "MANUAL" ? "수동설정" : "자동설정");
    setNpcSetting(s.npcMode === "MANUAL" ? "수동설정" : "자동설정");

    setFireLocation(s.location || "");
    setTrainingTime(s.trainTime ? String(s.trainTime) : "");

    saveScenarioConfigToLocalStorage({
      scenarioId: s.id,
      scenarioType: s.scenarioType,
      teamMode: s.teamMode,
      teamAssignment: s.teamAssignmentJson,
    });

    alert("✅ 시작할 시나리오로 활성화되었습니다.");

    try {
      const ta = s.teamAssignmentJson ? JSON.parse(s.teamAssignmentJson) : {};
      setTeamCounts(ta && typeof ta === "object" ? ta : {});
    } catch {
      setTeamCounts({});
    }

    try {
      const np = s.npcPositionsJson ? JSON.parse(s.npcPositionsJson) : {};
      setNpcPosition(np?.position || "");
      setNpcStatus(np?.status || "");
    } catch {
      setNpcPosition("");
      setNpcStatus("");
    }
  };

  const activateScenario = async (scenarioId) => {
    if (!classroomId || !scenarioId) return false;

    const res = await axios.put(
      `${API_BASE}/api/rooms/${classroomId}/active-scenario`,
      { scenarioId },
      axiosConfig,
    );

    if (!(res.status >= 200 && res.status < 300)) {
      showAxiosError("활성 시나리오 설정 실패", res);
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (classroomId) {
      fetchScenarioList();
    }
  }, [classroomId]);

  return (
    <div className="bg-[#F9FBE7] min-h-screen">
      <Navbar />
      <div className="p-8 space-y-6">
        <h2 className="text-3xl font-bold text-[#2E7D32] mb-2">
          시나리오 관리
        </h2>

        {!classroomId && (
          <div className="p-4 bg-white rounded shadow border border-red-200">
            <p className="text-red-600 font-bold">
              classroomId를 못 넘겨받았습니다.
            </p>
            <p className="text-sm text-gray-600 mt-1">
              RoomList → SchoolChannel → 시나리오 관리 버튼으로 들어와야 합니다.
            </p>
          </div>
        )}

        {/* 시나리오 목록 */}
        <div className="p-4 bg-white rounded shadow space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[#2E7D32]">
              시나리오 목록
            </h3>
            <button
              onClick={fetchScenarioList}
              disabled={listLoading || !classroomId}
              className="px-4 py-2 bg-[#66BB6A] text-white rounded-lg shadow hover:bg-[#2E7D32] disabled:opacity-60"
            >
              {listLoading ? "불러오는 중..." : "새로고침"}
            </button>
          </div>

          {listLoading && (
            <p className="text-sm text-gray-500">목록 불러오는 중...</p>
          )}

          {!listLoading && classroomId && scenarioList.length === 0 && (
            <p className="text-sm text-gray-500">
              아직 저장된 시나리오가 없습니다.
            </p>
          )}

          {!listLoading && scenarioList.length > 0 && (
            <div className="space-y-2">
              {scenarioList.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handlePickScenario(s)}
                  className={`w-full text-left px-4 py-3 rounded-lg border ${
                    selectedScenarioId === s.id
                      ? "border-[#2E7D32] bg-[#E8F5E9]"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold flex items-center gap-2">
                      {s.scenarioName || "(이름 없음)"}

                      {s.id === activeScenarioId && (
                        <span className="px-3 py-1 text-xs font-bold text-white bg-[#5D8A43] rounded-full">
                          활성 시나리오
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {s.createdTime
                        ? new Date(s.createdTime).toLocaleString()
                        : ""}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    타입: {s.scenarioType} / 모드: {s.triggerMode},{s.teamMode},
                    {s.npcMode}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 시나리오 이름 */}
        <div className="p-4 bg-white rounded shadow space-y-3">
          <h3 className="text-xl font-semibold text-[#2E7D32]">
            시나리오 이름
          </h3>
          <input
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="예: 3학년1반 화재훈련 시나리오"
            className="border px-3 py-2 rounded w-full"
          />
          <p className="text-xs text-gray-500">
            수정은 목록에서 시나리오를 선택한 뒤 저장하세요.
          </p>
        </div>

        {/* 재난 선택하기 */}
        <div className="p-4 bg-white rounded shadow space-y-3">
          <h3 className="text-xl font-semibold text-[#2E7D32]">
            재난 선택하기
          </h3>
          <select
            value={disasterType}
            onChange={(e) => setDisasterType(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          >
            <option value="지진">지진</option>
            <option value="화재">화재</option>
          </select>
          <p className="text-sm text-gray-500">
            선택한 재난 유형에 따라 팀 역할과 발생 설정 항목이 자동으로
            변경됩니다.
          </p>
        </div>

        {/* 발생 설정 */}
        <div className="p-4 bg-white rounded shadow space-y-4">
          <h3 className="text-xl font-semibold text-[#2E7D32]">발생 설정</h3>
          <select
            value={fireSetting}
            onChange={(e) => setFireSetting(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          >
            <option value="자동설정">자동설정</option>
            <option value="수동설정">수동설정</option>
          </select>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">{occurConfig.locationLabel}</label>
              <select
                value={fireLocation}
                onChange={(e) => setFireLocation(e.target.value)}
                disabled={fireSetting === "자동설정" || isAllAuto}
                className={`border px-3 py-2 rounded w-full ${
                  fireSetting === "자동설정" || isAllAuto
                    ? "bg-gray-100 opacity-50"
                    : ""
                }`}
              >
                <option value="">선택</option>
                {fireLocations.map((loc, i) => (
                  <option key={i} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1">훈련 시간(분)</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="30분에서 90분 정도가 적당합니다."
                value={trainingTime}
                onChange={(e) => handleTrainingTimeChange(e.target.value)}
                disabled={fireSetting === "자동설정" || isAllAuto}
                className={`border px-3 py-2 rounded w-full ${
                  fireSetting === "자동설정" || isAllAuto
                    ? "bg-gray-100 opacity-50"
                    : ""
                }`}
              />
            </div>
          </div>
        </div>

        {/* 팀 설정 */}
        <div className="p-4 bg-white rounded shadow space-y-4">
          <h3 className="text-xl font-semibold text-[#2E7D32]">팀 설정</h3>
          <p className="text-sm text-gray-600">
            현재 배정 대상 학생 수:{" "}
            <span className="font-bold">{activeStudentCount}명</span>
          </p>
          <select
            value={teamSetting}
            onChange={(e) => setTeamSetting(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          >
            <option value="자동설정">자동설정</option>
            <option value="수동설정">수동설정</option>
          </select>

          <p className="text-sm text-gray-500">
            각 팀의 인원 수를 입력하면, 이후 훈련 시작 시 학생들이 랜덤으로 팀에
            배정될 수 있도록 사용할 수 있습니다.
          </p>

          <div className="grid grid-cols-3 gap-4">
            {teamTypes.map((team) => {
              const disabled = teamSetting === "자동설정" || isAllAuto;

              return (
                <div key={team.teamCode} className="flex flex-col space-y-1">
                  <span className="font-medium">{team.teamName}</span>

                  <input
                    type="number"
                    min="0"
                    placeholder="인원 수"
                    value={teamCounts[team.teamCode] || ""}
                    onChange={(e) =>
                      handleTeamCountChange(team.teamCode, e.target.value)
                    }
                    disabled={disabled}
                    className={`border px-2 py-2 rounded w-full text-right ${
                      disabled ? "bg-gray-100 opacity-50" : ""
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* NPC 설정 */}
        <div className="p-4 bg-white rounded shadow space-y-4">
          <h3 className="text-xl font-semibold text-[#2E7D32]">NPC 설정</h3>
          <select
            value={npcSetting}
            onChange={(e) => setNpcSetting(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          >
            <option value="자동설정">자동설정</option>
            <option value="수동설정">수동설정</option>
          </select>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">위치</label>
              <select
                value={npcPosition}
                onChange={(e) => setNpcPosition(e.target.value)}
                disabled={npcSetting === "자동설정" || isAllAuto}
                className={`border px-3 py-2 rounded w-full ${
                  npcSetting === "자동설정" || isAllAuto
                    ? "bg-gray-100 opacity-50"
                    : ""
                }`}
              >
                <option value="">선택</option>
                {npcPositions.map((pos, i) => (
                  <option key={i} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1">상태</label>
              <select
                value={npcStatus}
                onChange={(e) => setNpcStatus(e.target.value)}
                disabled={npcSetting === "자동설정" || isAllAuto}
                className={`border px-3 py-2 rounded w-full ${
                  npcSetting === "자동설정" || isAllAuto
                    ? "bg-gray-100 opacity-50"
                    : ""
                }`}
              >
                <option value="">선택</option>
                {npcStatuses.map((status, i) => (
                  <option key={i} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 저장 버튼들 */}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleSaveScenario}
            disabled={saving || !classroomId}
            className="px-6 py-3 bg-[#2E7D32] text-white rounded-lg shadow disabled:opacity-60"
          >
            {saving
              ? "처리 중..."
              : selectedScenarioId
                ? "수정 저장"
                : "시나리오 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ScenarioManagement;
