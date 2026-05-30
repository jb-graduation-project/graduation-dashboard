import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function safeJsonParse(value, fallback = {}) {
  if (!value) return fallback;

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("JSON parse 실패:", value, error);
    return fallback;
  }
}

function formatScore(value) {
  const numberValue = Number(value || 0);
  return `${numberValue.toFixed(1)}점`;
}

function AnalysisResult() {
  const { scenarioId } = useParams();

  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");

  const [scenarioEvaluation, setScenarioEvaluation] = useState(null);
  const [studentEvaluations, setStudentEvaluations] = useState([]);
  const [studentNameMap, setStudentNameMap] = useState({});

  const fetchEvaluations = useCallback(async () => {
    if (!scenarioId) {
      setError("scenarioId가 없습니다. 라우터 경로를 확인해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/scenarios/${scenarioId}/evaluations`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`평가 결과 조회 실패: ${response.status}`);
      }

      const data = await response.json();

      setScenarioEvaluation(data.scenarioEvaluation || null);
      setStudentEvaluations(data.studentEvaluations || []);
    } catch (err) {
      console.error(err);
      setError("평가 결과를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [scenarioId]);

  const runEvaluate = useCallback(async () => {
    if (!scenarioId) {
      setError("scenarioId가 없습니다. 평가를 실행할 수 없습니다.");
      return;
    }

    setEvaluating(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/scenarios/${scenarioId}/evaluate`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`평가 실행 실패: ${response.status}`);
      }

      /*
        evaluate 응답에도 studentEvaluations가 들어오지만,
        백엔드 정책상 기존 평가 삭제 후 최신 평가 저장이므로
        evaluate 실행 후 evaluations를 다시 조회해서 화면을 최신 저장 결과 기준으로 맞춘다.
      */
      await fetchEvaluations();
    } catch (err) {
      console.error(err);
      setError("평가 실행에 실패했습니다.");
    } finally {
      setEvaluating(false);
    }
  }, [scenarioId, fetchEvaluations]);

  useEffect(() => {
    if (scenarioId) {
      runEvaluate();
    }
  }, [scenarioId, runEvaluate]);

  useEffect(() => {
    const fetchStudentNames = async () => {
      const classroomId = localStorage.getItem("classroomId");

      if (!classroomId) {
        console.warn("[AnalysisResult] classroomId가 없어 학생 이름 조회 생략");
        return;
      }

      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${API_BASE_URL}/api/rooms/${classroomId}/students`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },
          },
        );

        if (!response.ok) {
          throw new Error(`학생 목록 조회 실패: ${response.status}`);
        }

        const students = await response.json();

        const nextMap = {};

        if (Array.isArray(students)) {
          students.forEach((student) => {
            if (!student?.studentId) return;

            nextMap[String(student.studentId)] =
              student.studentName || "이름 없음";
          });
        }

        setStudentNameMap(nextMap);
      } catch (err) {
        console.error("[AnalysisResult] 학생 이름 조회 실패", err);
      }
    };

    fetchStudentNames();
  }, []);

  const getStudentName = (student) => {
    if (!student) return "이름 없음";

    return (
      student.studentName ||
      student.name ||
      studentNameMap[String(student.studentId || "")] ||
      "이름 없음"
    );
  };

  const scenarioScoreJson = useMemo(() => {
    return safeJsonParse(scenarioEvaluation?.scoreJson, {});
  }, [scenarioEvaluation]);

  const scenarioDetailsJson = useMemo(() => {
    return safeJsonParse(scenarioEvaluation?.detailsJson, {});
  }, [scenarioEvaluation]);

  const parsedStudentEvaluations = useMemo(() => {
    return studentEvaluations.map((student) => {
      const scoreJson = safeJsonParse(student.scoreJson, {});
      const detailsJson = safeJsonParse(student.detailsJson, {});

      return {
        ...student,
        scoreJson,
        detailsJson,
      };
    });
  }, [studentEvaluations]);

  const summaryData = useMemo(() => {
    const studentCount =
      scenarioDetailsJson.evaluatedStudentCount ??
      scenarioScoreJson.studentCount ??
      parsedStudentEvaluations.length;

    const averageScore =
      scenarioDetailsJson.averageScore ??
      scenarioScoreJson.average ??
      scenarioEvaluation?.scoreTotal ??
      0;

    const totalStudentScore =
      scenarioDetailsJson.totalStudentScore ??
      scenarioScoreJson.totalStudentScore ??
      parsedStudentEvaluations.reduce(
        (sum, student) => sum + Number(student.scoreTotal || 0),
        0,
      );

    const safezoneCompletedCount = parsedStudentEvaluations.filter(
      (student) => student.detailsJson?.safeZoneCompleted === true,
    ).length;

    const totalCorrectQuizCount = parsedStudentEvaluations.reduce(
      (sum, student) =>
        sum + Number(student.detailsJson?.correctQuizCount || 0),
      0,
    );

    return {
      studentCount,
      averageScore,
      totalStudentScore,
      safezoneCompletedCount,
      totalCorrectQuizCount,
    };
  }, [
    scenarioDetailsJson,
    scenarioScoreJson,
    scenarioEvaluation,
    parsedStudentEvaluations,
  ]);

  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      <Navbar />

      <div className="p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#2E7D32]">분석 결과</h2>
          </div>

          <button
            type="button"
            onClick={runEvaluate}
            disabled={evaluating || loading}
            className={`px-5 py-2 rounded-lg text-white font-semibold shadow ${
              evaluating || loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#2E7D32] hover:bg-[#256428]"
            }`}
          >
            {evaluating ? "평가 계산 중..." : "평가 다시 계산"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {(loading || evaluating) && (
          <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg text-gray-600">
            평가 데이터를 불러오는 중입니다.
          </div>
        )}

        {/* 전체 분석 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
            <span className="text-base font-semibold text-gray-500">
              평균 점수
            </span>
            <span className="text-3xl font-bold text-[#2E7D32] mt-2">
              {formatScore(summaryData.averageScore)}
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
            <span className="text-base font-semibold text-gray-500">
              평가 학생 수
            </span>
            <span className="text-3xl font-bold text-[#2E7D32] mt-2">
              {summaryData.studentCount}명
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
            <span className="text-base font-semibold text-gray-500">
              총 학생 점수
            </span>
            <span className="text-3xl font-bold text-[#2E7D32] mt-2">
              {formatScore(summaryData.totalStudentScore)}
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
            <span className="text-base font-semibold text-gray-500">
              안전구역 도착
            </span>
            <span className="text-3xl font-bold text-[#2E7D32] mt-2">
              {summaryData.safezoneCompletedCount}명
            </span>
          </div>
        </div>

        {/* 점수 기준 안내 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-[#2E7D32] mb-4">
            평가 점수 기준
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 bg-green-50">
              <p className="font-bold text-[#2E7D32]">퀴즈 점수</p>
              <p className="text-sm text-gray-600 mt-1">정답 퀴즈 개수 × 6점</p>
            </div>

            <div className="border rounded-lg p-4 bg-blue-50">
              <p className="font-bold text-blue-700">역할 점수</p>
              <p className="text-sm text-gray-600 mt-1">
                소화기 획득, 소화기 퀴즈, 화재 진압 참여
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-yellow-50">
              <p className="font-bold text-yellow-700">개인 점수</p>
              <p className="text-sm text-gray-600 mt-1">
                랜덤 퀴즈, 119 신고, 소화기 찾기
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-purple-50">
              <p className="font-bold text-purple-700">안전구역 점수</p>
              <p className="text-sm text-gray-600 mt-1">
                안전구역 도착 완료 시 10점
              </p>
            </div>
          </div>
        </div>

        {/* 개별 학생 결과 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-semibold text-[#2E7D32]">
              개별 학생 평가 결과
            </h3>

            <span className="text-sm text-gray-500">
              정답 퀴즈 총 {summaryData.totalCorrectQuizCount}개
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-[#2E7D32] text-white">
                <tr>
                  <th className="px-4 py-3 border whitespace-nowrap">학생명</th>
                  <th className="px-4 py-3 border whitespace-nowrap">총점</th>
                  <th className="px-4 py-3 border whitespace-nowrap">퀴즈</th>
                  <th className="px-4 py-3 border whitespace-nowrap">역할</th>
                  <th className="px-4 py-3 border whitespace-nowrap">개인</th>
                  <th className="px-4 py-3 border whitespace-nowrap">
                    안전구역
                  </th>
                  <th className="px-4 py-3 border whitespace-nowrap">
                    정답 퀴즈
                  </th>
                  <th className="px-4 py-3 border whitespace-nowrap">
                    안전구역 완료
                  </th>
                  <th className="px-4 py-3 border whitespace-nowrap">피드백</th>
                </tr>
              </thead>

              <tbody>
                {parsedStudentEvaluations.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-4 py-8 text-center text-gray-500 border"
                    >
                      평가 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  parsedStudentEvaluations.map((student) => {
                    const quizScore = student.scoreJson?.quiz ?? 0;
                    const roleScore = student.scoreJson?.role ?? 0;
                    const personalScore = student.scoreJson?.personal ?? 0;
                    const safezoneScore = student.scoreJson?.safezone ?? 0;
                    const totalScore =
                      student.scoreJson?.total ?? student.scoreTotal ?? 0;

                    const correctQuizCount =
                      student.detailsJson?.correctQuizCount ?? 0;

                    const safeZoneCompleted =
                      student.detailsJson?.safeZoneCompleted;

                    return (
                      <tr
                        key={student.evaluationId || student.studentId}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 border font-medium whitespace-nowrap">
                          {getStudentName(student)}
                        </td>

                        <td className="px-4 py-3 border text-center font-bold text-[#2E7D32] whitespace-nowrap">
                          {formatScore(totalScore)}
                        </td>

                        <td className="px-4 py-3 border text-center whitespace-nowrap">
                          {formatScore(quizScore)}
                        </td>

                        <td className="px-4 py-3 border text-center whitespace-nowrap">
                          {formatScore(roleScore)}
                        </td>

                        <td className="px-4 py-3 border text-center whitespace-nowrap">
                          {formatScore(personalScore)}
                        </td>

                        <td className="px-4 py-3 border text-center whitespace-nowrap">
                          {formatScore(safezoneScore)}
                        </td>

                        <td className="px-4 py-3 border text-center whitespace-nowrap">
                          {correctQuizCount}개
                        </td>

                        <td className="px-4 py-3 border text-center whitespace-nowrap">
                          {safeZoneCompleted === true ? (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              완료
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                              미완료
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 border text-gray-600 min-w-[280px]">
                          {student.feedbackText || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 시나리오 평가 상세 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-[#2E7D32] mb-3">
            시나리오 평가 요약
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="border rounded-lg p-4">
              <p className="font-semibold text-gray-500 mb-1">평가 피드백</p>
              <p className="text-gray-800">
                {scenarioEvaluation?.feedbackText || "-"}
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <p className="font-semibold text-gray-500 mb-1">평가 생성 시각</p>
              <p className="text-gray-800">
                {scenarioEvaluation?.createdAt
                  ? new Date(scenarioEvaluation.createdAt).toLocaleString()
                  : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalysisResult;
