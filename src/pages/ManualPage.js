// src/pages/ManualPage.js

import React, { useState } from "react";
import Navbar from "../components/Navbar";

export default function ManualPage() {
  const [openSection, setOpenSection] = useState("web");

  const toggleSection = (key) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  // 학생 앱 이미지 크기 통일
  const studentImageStyle =
    "w-full max-w-[280px] h-[520px] object-contain mx-auto";

  const studentCardStyle =
    "bg-[#FAFAFA] rounded-2xl border border-[#E5E5E5] p-5 flex flex-col justify-between";

  return (
    <div className="bg-[#F5F5E8] min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto p-8 space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#DCE8D5] p-8">
          <h1 className="text-4xl font-bold text-[#2E7D32]">사용자 메뉴얼</h1>

          <p className="mt-3 text-lg text-gray-600">
            AR 재난 시뮬레이션 시스템 사용 가이드
          </p>
        </div>

        {/* 실제 진행 순서 */}
        <div className="bg-[#FFF8E1] rounded-2xl border-l-4 border-[#FFB300] shadow-sm p-8">
          <h2 className="text-3xl font-bold text-[#F57C00] mb-8">
            🚨 실제 훈련 진행 순서
          </h2>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
            {[
              "학교 생성",
              "구조도 업로드",
              "방 생성",
              "시나리오 생성",
              "학생 입장",
              "훈련 시작",
              "실시간 모니터링",
              "결과 분석",
            ].map((step, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#FFE0B2] p-5 text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#FFB300] text-white flex items-center justify-center text-xl font-bold">
                  {idx + 1}
                </div>

                <div className="font-bold text-[#F57C00] text-lg">{step}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= 교사용 웹 ================= */}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-[#DCE8D5]">
          <button
            onClick={() => toggleSection("web")}
            className="w-full px-8 py-6 flex items-center justify-between hover:bg-[#F1F8E9] transition"
          >
            <h2 className="text-3xl font-bold text-[#2E7D32]">
              👨‍🏫 교사용 웹 시스템
            </h2>

            <span className="text-4xl text-[#66BB6A]">
              {openSection === "web" ? "−" : "+"}
            </span>
          </button>

          {openSection === "web" && (
            <div className="border-t border-[#E5E5E5] p-8 space-y-16">
              {/* 메인 */}
              <div className="grid xl:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-[#2E7D32] mb-6">
                    🏫 메인 화면
                  </h3>

                  <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                    <p>교사용 웹 시스템의 시작 화면입니다.</p>

                    <p>
                      새로운 학교 채널 생성 및 기존 학교 채널 입장이 가능합니다.
                    </p>

                    <p>
                      생성된 학교를 기반으로 재난 훈련을 진행할 수 있습니다.
                    </p>
                  </div>
                </div>

                <div className="bg-[#FAFAFA] rounded-2xl border p-6">
                  <img
                    src="/img/manual/main_home.png"
                    alt="메인"
                    className="w-full rounded-xl shadow-sm"
                  />
                </div>
              </div>

              {/* 학교 생성 */}
              <div className="grid xl:grid-cols-2 gap-12 items-center">
                <div className="order-2 xl:order-1 bg-[#FAFAFA] rounded-2xl border p-6">
                  <img
                    src="/img/manual/school_create.png"
                    alt="학교 생성"
                    className="w-full rounded-xl shadow-sm"
                  />
                </div>

                <div className="order-1 xl:order-2">
                  <h3 className="text-3xl font-bold text-[#2E7D32] mb-6">
                    🏫 학교 생성
                  </h3>

                  <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                    <p>
                      학교 이름과 층별 구조도를 등록하여 학교 채널을 생성합니다.
                    </p>

                    <p>
                      + 층 추가 버튼을 통해 여러 층 구조도를 등록할 수 있습니다.
                    </p>

                    <p>생성 완료 시 학생 입장용 학교 코드가 자동 생성됩니다.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= 학생용 앱 ================= */}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-[#DCE8D5]">
          <button
            onClick={() => toggleSection("student")}
            className="w-full px-8 py-6 flex items-center justify-between hover:bg-[#F1F8E9] transition"
          >
            <h2 className="text-3xl font-bold text-[#2E7D32]">
              📱 학생용 AR 앱
            </h2>

            <span className="text-4xl text-[#66BB6A]">
              {openSection === "student" ? "−" : "+"}
            </span>
          </button>

          {openSection === "student" && (
            <div className="border-t border-[#E5E5E5] p-8 space-y-16">
              {/* 로그인 */}
              <div className="grid xl:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-[#2E7D32] mb-6">
                    🔐 학생 로그인
                  </h3>

                  <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                    <p>
                      학생은 교사가 제공한 방 코드를 입력하여 훈련에 참여합니다.
                    </p>

                    <p>
                      이름 입력 후 입장하기 버튼을 클릭하면 훈련 방으로
                      이동합니다.
                    </p>
                  </div>
                </div>

                <div className={studentCardStyle}>
                  <img
                    src="/img/manual/student_login.png"
                    alt="학생 로그인"
                    className={studentImageStyle}
                  />
                </div>
              </div>

              {/* 역할 */}
              <div className="grid xl:grid-cols-2 gap-12 items-center">
                <div className="order-2 xl:order-1 bg-[#FAFAFA] rounded-2xl border p-5">
                  <img
                    src="/img/manual/role_select.png"
                    alt="역할"
                    className={studentImageStyle}
                  />
                </div>

                <div className="order-1 xl:order-2">
                  <h3 className="text-3xl font-bold text-[#2E7D32] mb-6">
                    👥 역할 배정
                  </h3>

                  <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                    <p>훈련 시작 시 역할이 자동 배정됩니다.</p>

                    <p>시민팀은 대피 미션을 수행합니다.</p>

                    <p>응급처치팀은 부상자 구조를 담당합니다.</p>

                    <p>소화팀은 화재 진압을 담당합니다.</p>
                  </div>
                </div>
              </div>

              {/* 미션 */}
              <div className="grid xl:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src="/img/manual/scroll_icon.png"
                      alt="미션"
                      className="w-14 h-14"
                    />

                    <h3 className="text-3xl font-bold text-[#2E7D32]">
                      📋 미션 시스템
                    </h3>
                  </div>

                  <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                    <p>역할 미션 및 개인 미션을 확인할 수 있습니다.</p>

                    <p>미션 완료 여부가 실시간으로 반영됩니다.</p>
                  </div>
                </div>

                <div className={studentCardStyle}>
                  <img
                    src="/img/manual/mission_panel.png"
                    alt="미션"
                    className={studentImageStyle}
                  />
                </div>
              </div>

              {/* 전화 신고 */}
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <img
                    src="/img/manual/phone_icon.png"
                    alt="전화"
                    className="w-14 h-14"
                  />

                  <div>
                    <h3 className="text-3xl font-bold text-[#2E7D32]">
                      📞 전화 신고 시스템
                    </h3>

                    <p className="text-lg text-gray-600 mt-2">
                      전화 아이콘 클릭 시 신고 미션을 진행할 수 있습니다.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
                  {[
                    ["/img/manual/phone_step1.png", "전화 선택"],
                    ["/img/manual/phone_step2.png", "119 입력"],
                    ["/img/manual/phone_step3.png", "신고 퀴즈"],
                    ["/img/manual/phone_step4.png", "신고 완료"],
                  ].map(([img, title], idx) => (
                    <div key={idx} className={studentCardStyle}>
                      <img
                        src={img}
                        alt={title}
                        className={studentImageStyle}
                      />

                      <h4 className="text-xl font-bold text-[#2E7D32] text-center mt-4">
                        {title}
                      </h4>
                    </div>
                  ))}
                </div>
              </div>

              {/* 랜덤 퀴즈 */}
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <img
                    src="/img/manual/quiz_icon.png"
                    alt="퀴즈"
                    className="w-14 h-14"
                  />

                  <div>
                    <h3 className="text-3xl font-bold text-[#2E7D32]">
                      ❗ 랜덤 퀴즈 시스템
                    </h3>

                    <p className="text-lg text-gray-600 mt-2">
                      느낌표 아이콘 등장 시 랜덤 퀴즈를 진행할 수 있습니다.
                    </p>
                  </div>
                </div>

                <div className="grid xl:grid-cols-2 gap-6">
                  <div className={studentCardStyle}>
                    <img
                      src="/img/manual/quiz_ox.png"
                      alt="OX 퀴즈"
                      className={studentImageStyle}
                    />

                    <h4 className="text-2xl font-bold text-[#2E7D32] text-center mt-4">
                      OX 퀴즈
                    </h4>
                  </div>

                  <div className={studentCardStyle}>
                    <img
                      src="/img/manual/quiz_multiple.png"
                      alt="4지선다"
                      className={studentImageStyle}
                    />

                    <h4 className="text-2xl font-bold text-[#2E7D32] text-center mt-4">
                      4지선다 퀴즈
                    </h4>
                  </div>
                </div>
              </div>

              {/* 카메라 */}
              <div className="grid xl:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src="/img/manual/camera_icon.png"
                      alt="카메라"
                      className="w-14 h-14"
                    />

                    <h3 className="text-3xl font-bold text-[#2E7D32]">
                      📷 소화기 탐지
                    </h3>
                  </div>

                  <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                    <p>카메라 버튼 클릭 시 탐지 모드가 시작됩니다.</p>

                    <p>실제 소화기를 인식하면 획득 가능합니다.</p>

                    <p>YOLO 객체 인식 기술을 사용합니다.</p>
                  </div>
                </div>

                <div className={studentCardStyle}>
                  <img
                    src="/img/manual/camera_detect.png"
                    alt="카메라 탐지"
                    className={studentImageStyle}
                  />
                </div>
              </div>

              {/* 아이템 */}
              <div className="grid xl:grid-cols-2 gap-12 items-center">
                <div className="order-2 xl:order-1 bg-[#FAFAFA] rounded-2xl border p-8">
                  <img
                    src="/img/manual/inventory_panel.png"
                    alt="아이템"
                    className="w-full max-w-[350px] mx-auto rounded-xl shadow-sm"
                  />
                </div>

                <div className="order-1 xl:order-2">
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src="/img/manual/box_icon.png"
                      alt="아이템"
                      className="w-14 h-14"
                    />

                    <h3 className="text-4xl font-bold text-[#2E7D32]">
                      🎒 아이템 박스
                    </h3>
                  </div>

                  <div className="space-y-5 text-2xl text-gray-700 leading-relaxed">
                    <p>현재 획득한 아이템을 확인할 수 있습니다.</p>

                    <p>소화기를 획득하면 아이템 박스에 등록됩니다.</p>

                    <p>획득한 아이템은 이후 미션 수행에 사용됩니다.</p>
                  </div>
                </div>
              </div>

              {/* 지도 */}
              <div className="grid xl:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src="/img/manual/map_icon.png"
                      alt="지도"
                      className="w-14 h-14"
                    />

                    <h3 className="text-4xl font-bold text-[#2E7D32]">
                      🗺 지도 시스템
                    </h3>
                  </div>

                  <div className="space-y-5 text-2xl text-gray-700 leading-relaxed">
                    <p>현재 구조도와 학생 위치를 확인할 수 있습니다.</p>

                    <p>위험 지역 및 안전 구역 위치를 확인할 수 있습니다.</p>

                    <p>
                      층 이동 버튼을 사용하여 여러 층 구조도를 확인할 수
                      있습니다.
                    </p>
                  </div>
                </div>

                <div className="bg-[#FAFAFA] rounded-2xl border p-8">
                  <img
                    src="/img/manual/map_panel.png"
                    alt="지도"
                    className="w-full max-w-[350px] mx-auto rounded-xl shadow-sm"
                  />
                </div>
              </div>

              {/* 챗봇 */}
              <div className="grid xl:grid-cols-2 gap-12 items-center">
                <div className="order-2 xl:order-1 bg-[#FAFAFA] rounded-2xl border p-8 flex justify-center">
                  <img
                    src="/img/manual/chatbot_icon.png"
                    alt="챗봇"
                    className="w-[220px] h-[220px] object-contain"
                  />
                </div>

                <div className="order-1 xl:order-2">
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src="/img/manual/chatbot_icon.png"
                      alt="챗봇"
                      className="w-14 h-14"
                    />

                    <h3 className="text-4xl font-bold text-[#2E7D32]">
                      🤖 챗봇 시스템
                    </h3>
                  </div>

                  <div className="space-y-5 text-2xl text-gray-700 leading-relaxed">
                    <p>재난 대응 관련 질문을 할 수 있습니다.</p>

                    <p>
                      훈련 진행 중 필요한 행동이나 대응 방법을 안내받을 수
                      있습니다.
                    </p>

                    <p>AI 기반 질의응답 기능이 제공됩니다.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= AR 소화기 사용 ================= */}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-[#DCE8D5]">
          <button
            onClick={() => toggleSection("fire")}
            className="w-full px-8 py-6 flex items-center justify-between hover:bg-[#F1F8E9] transition"
          >
            <h2 className="text-3xl font-bold text-[#2E7D32]">
              🧯 AR 소화기 사용 방법
            </h2>

            <span className="text-4xl text-[#66BB6A]">
              {openSection === "fire" ? "−" : "+"}
            </span>
          </button>

          {openSection === "fire" && (
            <div className="border-t border-[#E5E5E5] p-8 space-y-16">
              {/* PASS 퀴즈 */}
              <div className="grid xl:grid-cols-2 gap-12 items-center">
                <div className={studentCardStyle}>
                  <img
                    src="/img/manual/fire_quiz.png"
                    alt="PASS 퀴즈"
                    className={studentImageStyle}
                  />
                </div>

                <div>
                  <h3 className="text-3xl font-bold text-[#2E7D32] mb-6">
                    🚨 PASS 소화기 훈련
                  </h3>

                  <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                    <p>
                      소화기 사용 순서를 학습하기 위한 카드 퀴즈가 진행됩니다.
                    </p>

                    <p>사용자는 올바른 순서대로 카드를 선택해야 합니다.</p>

                    <p>
                      잘못된 순서를 선택하면 오답 처리 및 목숨이 감소할 수
                      있습니다.
                    </p>

                    <p>
                      PASS 원칙을 기반으로 실제 화재 대응 절차를 학습합니다.
                    </p>

                    <div className="pt-4 space-y-4">
                      <div>
                        <strong className="text-[#2E7D32]">P - Pull</strong>

                        <p>안전핀을 뽑습니다.</p>
                      </div>

                      <div>
                        <strong className="text-[#2E7D32]">A - Aim</strong>

                        <p>불의 밑부분을 조준합니다.</p>
                      </div>

                      <div>
                        <strong className="text-[#2E7D32]">S - Squeeze</strong>

                        <p>손잡이를 눌러 분사합니다.</p>
                      </div>

                      <div>
                        <strong className="text-[#2E7D32]">S - Sweep</strong>

                        <p>좌우로 쓸어가며 분사합니다.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 설명 카드 */}
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
                {[
                  ["1단계", "주변에서 소화기를 찾고 획득합니다."],
                  ["2단계", "AR 바닥 평면을 인식하여 화재를 배치합니다."],
                  ["3단계", "PASS 순서에 따라 소화 절차를 수행합니다."],
                  ["4단계", "불의 밑부분을 조준하여 좌우로 분사합니다."],
                ].map(([title, desc], idx) => (
                  <div
                    key={idx}
                    className="bg-[#FAFAFA] rounded-2xl border border-[#E5E5E5] p-6"
                  >
                    <h4 className="text-2xl font-bold text-[#2E7D32] mb-4">
                      {title}
                    </h4>

                    <p className="text-gray-700 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
