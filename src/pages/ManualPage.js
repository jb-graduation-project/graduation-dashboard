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
    <div className="bg-[#F9FBE7] min-h-screen">
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
            className="w-full px-8 py-6 flex items-center justify-between hover:bg-[#F8FBF2] transition"
          >
            <div className="flex items-center gap-5">
              <span className="text-sm font-bold text-[#66BB6A] tracking-widest">
                01
              </span>

              <div className="h-8 w-px bg-[#DCE8D5]" />

              <h2 className="text-3xl font-bold text-[#2E7D32]">
                교사용 웹 시스템
              </h2>
            </div>

            <span className="text-3xl font-light text-[#66BB6A]">
              {openSection === "web" ? "−" : "+"}
            </span>
          </button>

          {openSection === "web" && (
            <div className="border-t border-[#E5E5E5] p-8 space-y-20">
              {/* 메인 화면 */}
              <div className="grid xl:grid-cols-2 gap-16 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-[#2E7D32] mb-6">
                    🏫 메인 화면
                  </h3>

                  <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                    <p>
                      교사용 웹 시스템의 시작 화면입니다. 교사는 이 화면에서
                      새로운 학교 채널을 만들거나 기존 채널에 다시 입장할 수
                      있습니다.
                    </p>

                    <p>
                      <strong>채널 생성하기</strong> 버튼은 처음 시스템을 사용할
                      때 새로운 학교와 훈련 환경을 만드는 기능입니다.
                    </p>

                    <p>
                      <strong>채널 들어가기</strong> 버튼은 이미 생성된 학교
                      코드로 기존 학교 채널에 접속할 때 사용합니다.
                    </p>
                  </div>
                </div>

                <div className="bg-[#FAFAFA] rounded-2xl border p-6">
                  <img
                    src="/img/manual/main_home.png"
                    alt="메인 화면"
                    className="w-full rounded-xl shadow-sm"
                  />
                </div>
              </div>

              {/* 학교 생성 */}
              <div className="grid xl:grid-cols-2 gap-16 items-center">
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
                      학교 이름을 입력하고 층별 구조도를 등록하여 하나의 학교
                      채널을 생성합니다.
                    </p>

                    <p>
                      <strong>+ 층 추가</strong> 버튼을 누르면 1층, 2층, 3층처럼
                      여러 층의 구조도를 추가할 수 있습니다.
                    </p>

                    <p>
                      각 층마다 구조도 이미지를 업로드할 수 있으며, 업로드한
                      이미지는 미리보기로 확인할 수 있습니다.
                    </p>

                    <p>
                      <strong>채널 생성하기</strong> 버튼을 누르면 학교 정보와
                      구조도가 저장되고, 학생 입장에 사용할 학교 코드가
                      생성됩니다.
                    </p>

                    <p>
                      학교 이름을 입력하지 않았거나 구조도를 업로드하지 않은
                      경우, 또는 중복된 학교 이름을 사용하는 경우 생성이 실패할
                      수 있습니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 학교 코드 입력 */}
              <div className="grid xl:grid-cols-2 gap-16 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-[#2E7D32] mb-6">
                    🔐 학교 코드 입력
                  </h3>

                  <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                    <p>
                      기존 학교 채널에 다시 접속할 때 학교 코드를 입력합니다.
                    </p>

                    <p>
                      올바른 코드를 입력하고 <strong>입장하기</strong> 버튼을
                      누르면 해당 학교의 방 목록 화면으로 이동합니다.
                    </p>

                    <p>
                      잘못된 코드이거나 존재하지 않는 학교 코드인 경우 입장이
                      제한되고 오류 메시지가 표시됩니다.
                    </p>
                  </div>
                </div>

                <div className="bg-[#FAFAFA] rounded-2xl border p-6">
                  <img
                    src="/img/manual/school_code_input.png"
                    alt="학교 코드 입력"
                    className="w-full rounded-xl shadow-sm"
                  />
                </div>
              </div>

              {/* 방 목록 */}
              <div className="grid xl:grid-cols-2 gap-16 items-center">
                <div className="order-2 xl:order-1 bg-[#FAFAFA] rounded-2xl border p-6">
                  <img
                    src="/img/manual/classroom_list.png"
                    alt="방 목록"
                    className="w-full rounded-xl shadow-sm"
                  />
                </div>

                <div className="order-1 xl:order-2">
                  <h3 className="text-3xl font-bold text-[#2E7D32] mb-6">
                    📚 방 목록
                  </h3>

                  <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                    <p>
                      학교 안에서 학급별 또는 그룹별로 훈련 방을 나누어 관리할
                      수 있는 화면입니다.
                    </p>

                    <p>
                      우측 상단의 <strong>+</strong> 버튼을 누르면 새로운 훈련
                      방을 생성할 수 있습니다.
                    </p>

                    <p>
                      방 생성 시 반 이름이나 학생 수를 설정할 수 있으며, 생성된
                      방은 목록에 추가됩니다.
                    </p>

                    <p>
                      각 방 카드에서는 학생 수와 현재 훈련 상태를 확인할 수
                      있습니다. 예를 들어 WAITING은 훈련 대기 상태를 의미합니다.
                    </p>

                    <p>
                      <strong>관리</strong> 버튼을 누르면 해당 방의 상세 관리
                      화면으로 이동합니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 방 관리 */}
              <div className="grid xl:grid-cols-2 gap-16 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-[#2E7D32] mb-6">
                    ⚙ 방 메인 관리 화면
                  </h3>

                  <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                    <p>
                      교사가 실제 훈련을 운영하는 핵심 화면입니다. 학생 목록
                      확인, 입장 코드 관리, 시나리오 설정, 훈련 시작 등을 진행할
                      수 있습니다.
                    </p>

                    <p>
                      학생 목록에서는 현재 접속한 학생의 이름과 상태를 확인할 수
                      있습니다.
                    </p>

                    <p>
                      잘못 입장한 학생이 있으면 강퇴 기능을 사용할 수 있고, 기존
                      입장 코드가 노출된 경우 코드 재발급도 가능합니다.
                    </p>

                    <p>
                      상단 메뉴를 통해 학교 환경 설정, 시나리오 관리, 실시간
                      모니터링, 분석 결과 페이지로 이동할 수 있습니다.
                    </p>
                  </div>
                </div>

                <div className="bg-[#FAFAFA] rounded-2xl border p-6">
                  <img
                    src="/img/manual/room_manage.png"
                    alt="방 관리"
                    className="w-full rounded-xl shadow-sm"
                  />
                </div>
              </div>

              {/* 시나리오 관리 */}
              <div className="grid xl:grid-cols-2 gap-16 items-center">
                <div className="order-2 xl:order-1 bg-[#FAFAFA] rounded-2xl border p-6">
                  <img
                    src="/img/manual/scenario_manage.png"
                    alt="시나리오 관리"
                    className="w-full rounded-xl shadow-sm"
                  />
                </div>

                <div className="order-1 xl:order-2">
                  <h3 className="text-3xl font-bold text-[#2E7D32] mb-6">
                    🎬 시나리오 관리
                  </h3>

                  <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                    <p>훈련에서 사용할 재난 상황을 설정하는 화면입니다.</p>

                    <p>
                      시나리오 이름을 입력하고, 화재 또는 지진과 같은 재난
                      유형을 선택합니다.
                    </p>

                    <p>
                      재난 발생 위치와 훈련 시간을 설정할 수 있으며, 훈련 시간은
                      30분에서 90분 정도가 적당합니다.
                    </p>

                    <p>
                      팀 설정은 자동 또는 수동으로 선택할 수 있습니다. 자동 설정
                      시 학생 수를 기준으로 역할이 배정됩니다.
                    </p>

                    <p>
                      NPC 설정에서는 가상 인원의 위치와 상태를 설정할 수
                      있습니다.
                    </p>

                    <p>
                      <strong>시나리오 저장</strong> 버튼을 누르면 설정한 내용이
                      저장되고, 이후 훈련 시작 시 활성 시나리오로 사용할 수
                      있습니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 훈련 시작 */}
              <div className="bg-[#FFF8E1] rounded-2xl border-l-4 border-[#FFB300] p-8">
                <h3 className="text-3xl font-bold text-[#F57C00] mb-8">
                  🚨 훈련 시작 방법
                </h3>

                <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                  <div>
                    <strong className="text-[#F57C00]">
                      1. 학교 생성 및 구조도 등록
                    </strong>
                    <p className="mt-2">
                      학교 채널을 생성하고 층별 구조도를 업로드합니다. 구조도
                      세부 설정은 학교 환경 설정 페이지에서 진행합니다.
                    </p>
                  </div>

                  <div>
                    <strong className="text-[#F57C00]">2. 훈련 방 생성</strong>
                    <p className="mt-2">
                      방 목록 화면에서 + 버튼을 눌러 실제 훈련을 진행할 반 또는
                      그룹을 생성합니다.
                    </p>
                  </div>

                  <div>
                    <strong className="text-[#F57C00]">
                      3. 시나리오 생성 및 저장
                    </strong>
                    <p className="mt-2">
                      시나리오 관리 페이지에서 재난 유형, 발생 위치, 훈련 시간,
                      팀 설정 등을 입력하고 저장합니다.
                    </p>
                  </div>

                  <div>
                    <strong className="text-[#F57C00]">
                      4. 학생 입장 확인
                    </strong>
                    <p className="mt-2">
                      학생들이 앱에서 학교 코드와 이름을 입력해 방에 입장했는지
                      확인합니다.
                    </p>
                  </div>

                  <div>
                    <strong className="text-[#F57C00]">
                      5. 훈련 시작 버튼 클릭
                    </strong>
                    <p className="mt-2">
                      방 관리 화면에서 훈련 시작 버튼을 누르면 시스템이 훈련
                      시작 조건을 확인합니다.
                    </p>

                    <ul className="list-disc ml-8 mt-3 space-y-2">
                      <li>학생이 입장했는지 확인</li>
                      <li>시나리오가 저장되어 있는지 확인</li>
                      <li>활성 시나리오가 존재하는지 확인</li>
                      <li>구조도 설정이 존재하는지 확인</li>
                      <li>학생 역할 자동 배정</li>
                      <li>역할별 미션 자동 생성</li>
                      <li>학생용 Unity 앱 훈련 시작</li>
                    </ul>
                  </div>

                  <div>
                    <strong className="text-[#F57C00]">
                      6. 실시간 모니터링 및 결과 확인
                    </strong>
                    <p className="mt-2">
                      훈련이 시작되면 교사는 실시간 모니터링 화면에서 학생
                      위치와 미션 진행 상태를 확인하고, 종료 후 분석 결과를
                      확인합니다.
                    </p>
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
            className="w-full px-8 py-6 flex items-center justify-between hover:bg-[#F8FBF2] transition"
          >
            <div className="flex items-center gap-5">
              <span className="text-sm font-bold text-[#66BB6A] tracking-widest">
                02
              </span>

              <div className="h-8 w-px bg-[#DCE8D5]" />

              <h2 className="text-3xl font-bold text-[#2E7D32]">
                학생용 AR 앱
              </h2>
            </div>

            <span className="text-3xl font-light text-[#66BB6A]">
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

        {/* ================= AR 소화기 사용 ================= */}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-[#DCE8D5]">
          <button
            onClick={() => toggleSection("fire")}
            className="w-full px-8 py-6 flex items-center justify-between hover:bg-[#F8FBF2] transition"
          >
            <div className="flex items-center gap-5">
              <span className="text-sm font-bold text-[#66BB6A] tracking-widest">
                03
              </span>

              <div className="h-8 w-px bg-[#DCE8D5]" />

              <h2 className="text-3xl font-bold text-[#2E7D32]">
                AR 소화기 사용 방법
              </h2>
            </div>

            <span className="text-3xl font-light text-[#66BB6A]">
              {openSection === "fire" ? "−" : "+"}
            </span>
          </button>

          {openSection === "fire" && (
            <div className="border-t border-[#E5E5E5] p-8 space-y-16">
              {/* 준비 사항 */}
              <div className="bg-[#FFF8E1] rounded-2xl border-l-4 border-[#FFB300] p-7">
                <h3 className="text-3xl font-bold text-[#F57C00] mb-6">
                  시작 전 준비 사항
                </h3>

                <div className="grid md:grid-cols-2 gap-6 text-lg text-gray-700 leading-relaxed">
                  <div className="bg-white rounded-xl border border-[#FFE0B2] p-5">
                    <h4 className="text-xl font-bold text-[#F57C00] mb-3">
                      기기 준비
                    </h4>

                    <ul className="list-disc ml-6 space-y-2">
                      <li>
                        AR 기능을 지원하는 스마트폰 또는 태블릿을 사용합니다.
                      </li>
                      <li>
                        카메라 권한을 허용해야 AR 화면과 소화기 탐지가
                        동작합니다.
                      </li>
                      <li>배터리와 네트워크 상태를 미리 확인합니다.</li>
                      <li>
                        네트워크가 불안정하면 퀴즈 제출이나 미션 동기화가 지연될
                        수 있습니다.
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-xl border border-[#FFE0B2] p-5">
                    <h4 className="text-xl font-bold text-[#F57C00] mb-3">
                      공간 준비
                    </h4>

                    <ul className="list-disc ml-6 space-y-2">
                      <li>주변 이동이 가능한 2m 이상 공간을 확보합니다.</li>
                      <li>장애물이 적고 평평한 바닥에서 진행합니다.</li>
                      <li>유리, 거울, 반사면이 많은 장소는 피합니다.</li>
                      <li>
                        계단, 문 앞, 좁은 복도, 실제 위험물 근처에서는
                        플레이하지 않습니다.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 핵심 용어 */}
              <div>
                <h3 className="text-3xl font-bold text-[#2E7D32] mb-6">
                  주요 화면 및 용어
                </h3>

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[
                    [
                      "AR 평면",
                      "카메라가 바닥을 인식한 영역입니다. 사용자는 인식된 바닥을 터치해 가상의 화재를 배치합니다.",
                    ],
                    [
                      "화재 오브젝트",
                      "AR 화면에 나타나는 가상의 불입니다. 가까이 접근하면 소화기 사용 퀴즈가 시작됩니다.",
                    ],
                    [
                      "카드 퀴즈",
                      "소화기 사용 순서를 카드로 선택하는 단계입니다. 선택한 카드는 다시 눌러 취소할 수 있습니다.",
                    ],
                    [
                      "도넛 게이지",
                      "소화기를 사용할 준비 상태를 만드는 게이지입니다. 연속 터치 또는 길게 누르기로 채웁니다.",
                    ],
                    [
                      "소화 진행률",
                      "분사 실습 단계에서 표시되는 진행률입니다. 밑부분 조준과 좌우 분사를 잘 수행하면 올라갑니다.",
                    ],
                    [
                      "목숨",
                      "퀴즈에서 실수했을 때 줄어드는 기회 수입니다. 기본 목숨은 3개입니다.",
                    ],
                  ].map(([title, desc], idx) => (
                    <div
                      key={idx}
                      className="bg-[#FAFAFA] rounded-2xl border border-[#E5E5E5] p-6"
                    >
                      <h4 className="text-xl font-bold text-[#2E7D32] mb-3">
                        {title}
                      </h4>

                      <p className="text-gray-700 leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 소화기 찾기 */}
              <div className="grid xl:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-[#2E7D32] mb-6">
                    1단계. 소화기 찾기
                  </h3>

                  <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                    <p>
                      게임이 시작되면 주변을 천천히 둘러보며 소화기를 찾습니다.
                      실제 교육 환경에서는 벽면, 복도, 출입구 근처처럼 소화기가
                      설치될 가능성이 높은 위치를 확인하도록 안내합니다.
                    </p>

                    <div>
                      <strong className="text-[#2E7D32]">사용 방법</strong>
                      <ul className="list-disc ml-6 mt-2 space-y-2">
                        <li>스마트폰을 두 손으로 잡습니다.</li>
                        <li>주변을 빠르게 흔들지 말고 천천히 비춥니다.</li>
                        <li>
                          소화기가 화면에 들어오도록 카메라 방향을 맞춥니다.
                        </li>
                        <li>
                          인식 또는 미션 확인이 완료되면 다음 단계로 이동합니다.
                        </li>
                      </ul>
                    </div>

                    <div>
                      <strong className="text-[#2E7D32]">교육 포인트</strong>
                      <ul className="list-disc ml-6 mt-2 space-y-2">
                        <li>소화기는 평소 위치를 알아두는 것이 중요합니다.</li>
                        <li>
                          실제 화재 시 소화기를 찾느라 대피가 늦어져서는 안
                          됩니다.
                        </li>
                        <li>작은 초기 화재인지 먼저 판단해야 합니다.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className={studentCardStyle}>
                  <img
                    src="/img/manual/camera_detect.png"
                    alt="소화기 탐지"
                    className={studentImageStyle}
                  />
                </div>
              </div>

              {/* 화재 배치 */}
              <div className="grid xl:grid-cols-2 gap-12 items-center">
                <div className="order-2 xl:order-1 bg-[#FAFAFA] rounded-2xl border p-4 flex items-center justify-center">
                  <img
                    src="/img/manual/fire_place.png"
                    alt="화재 배치"
                    className={studentImageStyle}
                  />
                </div>

                <div className="order-1 xl:order-2">
                  <h3 className="text-3xl font-bold text-[#2E7D32] mb-6">
                    2단계. AR 화재 위치 지정
                  </h3>

                  <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                    <p>
                      소화기 찾기가 완료되면 카메라로 바닥을 비추고, 인식된 바닥
                      지점을 터치해 가상의 화재를 배치합니다.
                    </p>

                    <div>
                      <strong className="text-[#2E7D32]">사용 방법</strong>
                      <ul className="list-disc ml-6 mt-2 space-y-2">
                        <li>카메라가 바닥을 향하도록 합니다.</li>
                        <li>
                          바닥을 천천히 비추며 AR 평면이 잡힐 때까지 기다립니다.
                        </li>
                        <li>사람과 장애물이 없는 위치를 선택합니다.</li>
                        <li>화면의 바닥 지점을 한 번 터치합니다.</li>
                      </ul>
                    </div>

                    <div>
                      <strong className="text-[#2E7D32]">주의 사항</strong>
                      <ul className="list-disc ml-6 mt-2 space-y-2">
                        <li>너무 가까운 발밑에 화재를 배치하지 않습니다.</li>
                        <li>다른 사람의 이동 경로 위에 배치하지 않습니다.</li>
                        <li>
                          평면 인식이 안 되면 더 밝거나 무늬가 있는 바닥을
                          비춥니다.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 화재 접근 */}
              <div className="bg-[#F8FBF2] rounded-2xl border border-[#DCE8D5] p-7">
                <h3 className="text-3xl font-bold text-[#2E7D32] mb-5">
                  3단계. 화재 가까이 접근
                </h3>

                <div className="grid md:grid-cols-2 gap-6 text-lg text-gray-700 leading-relaxed">
                  <div>
                    <p>
                      화재를 배치한 뒤 가상의 불 쪽으로 천천히 접근합니다. 일정
                      거리 안에 들어오면 소화기 사용 순서 카드 퀴즈가
                      시작됩니다.
                    </p>
                  </div>

                  <div>
                    <ul className="list-disc ml-6 space-y-2">
                      <li>화면 속 화재가 중앙에 보이도록 합니다.</li>
                      <li>천천히 앞으로 이동합니다.</li>
                      <li>뛰거나 방향을 급하게 바꾸지 않습니다.</li>
                      <li>
                        실제 상황에서는 무리한 접근보다 대피와 신고가
                        우선입니다.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

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
                    4단계. 소화기 사용 순서 카드 퀴즈
                  </h3>

                  <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                    <p>
                      카드 퀴즈는 소화기 사용 전 절차를 순서대로 익히는
                      단계입니다. 화면에 보이는 카드는 섞여 있을 수 있으며,
                      올바른 순서대로 선택해야 합니다.
                    </p>

                    <div>
                      <strong className="text-[#2E7D32]">기본 조작</strong>
                      <ul className="list-disc ml-6 mt-2 space-y-2">
                        <li>첫 번째로 수행할 행동 카드를 누릅니다.</li>
                        <li>
                          선택한 카드에 순서 번호가 표시되는지 확인합니다.
                        </li>
                        <li>다음 행동 카드를 순서대로 누릅니다.</li>
                        <li>잘못 선택한 카드는 다시 눌러 선택을 취소합니다.</li>
                        <li>모든 카드를 선택한 뒤 제출합니다.</li>
                      </ul>
                    </div>

                    <div className="bg-[#F8FBF2] rounded-xl border border-[#DCE8D5] p-5">
                      <strong className="text-[#2E7D32]">교육 기준 순서</strong>
                      <ol className="list-decimal ml-6 mt-2 space-y-2">
                        <li>소화기를 잡고 안전하게 듭니다.</li>
                        <li>안전핀을 뽑습니다.</li>
                        <li>노즐을 불의 밑부분으로 향하게 합니다.</li>
                        <li>손잡이를 눌러 분사를 시작합니다.</li>
                      </ol>
                    </div>

                    <p>
                      오답을 제출하면 남은 목숨이 줄어듭니다. 기본 목숨은
                      3개이며, 모두 소진하면 재시도가 필요할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 도넛 게이지 */}
              <div className="grid xl:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-[#2E7D32] mb-6">
                    5단계. 도넛 게이지 채우기
                  </h3>

                  <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                    <p>
                      카드 퀴즈를 맞히면 도넛 게이지가 나타납니다. 이 단계는
                      실제 분사 전 소화기를 사용할 준비를 하는 과정입니다.
                    </p>

                    <div>
                      <strong className="text-[#2E7D32]">사용 방법</strong>
                      <ul className="list-disc ml-6 mt-2 space-y-2">
                        <li>화면 안내를 확인합니다.</li>
                        <li>화면을 연속으로 터치하거나 길게 누릅니다.</li>
                        <li>게이지가 줄어들지 않도록 입력을 유지합니다.</li>
                        <li>게이지가 가득 차면 실제 분사 단계로 넘어갑니다.</li>
                      </ul>
                    </div>

                    <div>
                      <strong className="text-[#2E7D32]">조작 팁</strong>
                      <ul className="list-disc ml-6 mt-2 space-y-2">
                        <li>짧게 여러 번 터치하면 빠르게 채울 수 있습니다.</li>
                        <li>길게 눌러도 게이지가 올라갑니다.</li>
                        <li>
                          일정 시간 입력하지 않으면 게이지가 감소할 수 있습니다.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className={studentCardStyle}>
                  <img
                    src="/img/manual/donut_gauge.png"
                    alt="도넛 게이지"
                    className={studentImageStyle}
                  />
                </div>
              </div>

              {/* PASS 원칙 */}
              <div className="bg-[#FFF8E1] rounded-2xl border-l-4 border-[#FFB300] p-7">
                <h3 className="text-3xl font-bold text-[#F57C00] mb-6">
                  PASS 원칙과 게임 동작
                </h3>

                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
                  {[
                    [
                      "P: Pull",
                      "안전핀 뽑기",
                      "카드 퀴즈에서 안전핀 단계를 선택합니다.",
                    ],
                    [
                      "A: Aim",
                      "밑부분 조준",
                      "카메라 중앙을 불 아래쪽에 맞춥니다.",
                    ],
                    [
                      "S: Squeeze",
                      "손잡이 누르기",
                      "화면을 길게 눌러 분사를 유지합니다.",
                    ],
                    [
                      "S: Sweep",
                      "좌우로 쓸기",
                      "카메라를 좌우로 움직이며 분사합니다.",
                    ],
                  ].map(([step, meaning, action], idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl border border-[#FFE0B2] p-5"
                    >
                      <h4 className="text-xl font-bold text-[#F57C00] mb-2">
                        {step}
                      </h4>

                      <p className="font-semibold text-gray-800 mb-2">
                        {meaning}
                      </p>

                      <p className="text-gray-700 leading-relaxed">{action}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 화재 진압 */}
              <div className="grid xl:grid-cols-2 gap-12 items-center">
                <div className={studentCardStyle}>
                  <img
                    src="/img/manual/fire_extinguish.png"
                    alt="화재 진압"
                    className={studentImageStyle}
                  />
                </div>

                <div>
                  <h3 className="text-3xl font-bold text-[#2E7D32] mb-6">
                    6단계. PASS 원칙에 따른 소화 실습
                  </h3>

                  <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                    <p>
                      도넛 게이지가 가득 차면 분사 실습이 시작됩니다. 화면을
                      길게 눌러 손잡이를 작동하고, 카메라 방향을 조정해 불의
                      밑부분을 조준합니다.
                    </p>

                    <div>
                      <strong className="text-[#2E7D32]">사용 방법</strong>
                      <ul className="list-disc ml-6 mt-2 space-y-2">
                        <li>화면을 계속 길게 눌러 소화기를 분사합니다.</li>
                        <li>
                          카메라 중앙을 불꽃 위쪽이 아니라 불의 밑부분에
                          맞춥니다.
                        </li>
                        <li>
                          유효 거리 안에서 조준합니다. 현재 기준은 약 3m
                          이내입니다.
                        </li>
                        <li>
                          화면을 누른 상태로 기기를 좌우로 천천히 움직입니다.
                        </li>
                        <li>소화 진행률이 올라가는지 확인합니다.</li>
                        <li>
                          진행률이 100%가 될 때까지 조준과 좌우 분사를
                          유지합니다.
                        </li>
                      </ul>
                    </div>

                    <div>
                      <strong className="text-[#2E7D32]">좋은 조작 기준</strong>
                      <ul className="list-disc ml-6 mt-2 space-y-2">
                        <li>불꽃의 위쪽이 아니라 아래쪽을 맞춥니다.</li>
                        <li>한 점에만 고정하지 않고 좌우로 쓸어 줍니다.</li>
                        <li>너무 멀리서 분사하지 않습니다.</li>
                        <li>화면 터치를 중간에 놓치지 않습니다.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 완료 */}
              <div className="grid xl:grid-cols-2 gap-12 items-center">
                <div className="order-2 xl:order-1 bg-[#FAFAFA] rounded-2xl border p-4 flex items-center justify-center">
                  <img
                    src="/img/manual/fire_complete.png"
                    alt="소화 완료"
                    className={studentImageStyle}
                  />
                </div>

                <div className="order-1 xl:order-2">
                  <h3 className="text-3xl font-bold text-[#2E7D32] mb-6">
                    7단계. 소화 완료
                  </h3>

                  <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                    <p>
                      소화 진행률이 100%에 도달하면 화재 오브젝트가 사라지고
                      소화 완료 메시지가 표시됩니다.
                    </p>

                    <div>
                      <strong className="text-[#2E7D32]">완료 의미</strong>
                      <ul className="list-disc ml-6 mt-2 space-y-2">
                        <li>불의 밑부분을 조준했습니다.</li>
                        <li>화면을 눌러 분사 상태를 유지했습니다.</li>
                        <li>좌우로 쓸어 분사하는 동작을 수행했습니다.</li>
                        <li>PASS 원칙을 실습 단계까지 연결했습니다.</li>
                      </ul>
                    </div>

                    <div className="bg-[#F8FBF2] rounded-xl border border-[#DCE8D5] p-5">
                      <strong className="text-[#2E7D32]">
                        활동 후 질문 예시
                      </strong>
                      <ul className="list-disc ml-6 mt-2 space-y-2">
                        <li>왜 불꽃 위쪽이 아니라 아래쪽을 조준해야 할까?</li>
                        <li>
                          실제 화재에서 내가 소화기를 사용해도 되는 상황은
                          언제일까?
                        </li>
                        <li>
                          소화가 어렵다고 느끼면 가장 먼저 무엇을 해야 할까?
                        </li>
                        <li>
                          우리 학교에서 가장 가까운 소화기는 어디에 있을까?
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 성공 실패 조건 */}
              <div>
                <h3 className="text-3xl font-bold text-[#2E7D32] mb-6">
                  성공 조건과 재시도 조건
                </h3>

                <div className="grid md:grid-cols-2 gap-6 text-lg text-gray-700 leading-relaxed">
                  <div className="bg-[#FAFAFA] rounded-2xl border p-6">
                    <h4 className="text-2xl font-bold text-[#2E7D32] mb-4">
                      성공 조건
                    </h4>

                    <ul className="list-disc ml-6 space-y-2">
                      <li>소화기 찾기 또는 획득 완료</li>
                      <li>AR 화재 배치 완료</li>
                      <li>카드 퀴즈 정답 제출</li>
                      <li>도넛 게이지 충전 완료</li>
                      <li>불의 밑부분 조준</li>
                      <li>화면 길게 누르기 유지</li>
                      <li>좌우 쓸기 분사 수행</li>
                      <li>소화 진행률 100% 달성</li>
                    </ul>
                  </div>

                  <div className="bg-[#FAFAFA] rounded-2xl border p-6">
                    <h4 className="text-2xl font-bold text-[#2E7D32] mb-4">
                      재시도 또는 지연 조건
                    </h4>

                    <ul className="list-disc ml-6 space-y-2">
                      <li>카드 퀴즈를 반복해서 틀림</li>
                      <li>화면을 누르지 않아 분사가 시작되지 않음</li>
                      <li>불의 윗부분만 조준함</li>
                      <li>유효 거리 밖에서 분사함</li>
                      <li>AR 평면 인식이 불안정함</li>
                      <li>화재가 카메라 화면 밖으로 벗어남</li>
                      <li>주변 이동 중 안전 문제가 발생함</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 안전 수칙 */}
              <div className="bg-[#FFF3E0] rounded-2xl border-l-4 border-[#FB8C00] p-7">
                <h3 className="text-3xl font-bold text-[#E65100] mb-6">
                  실제 안전 수칙
                </h3>

                <ul className="grid md:grid-cols-2 gap-x-8 gap-y-3 list-disc ml-6 text-lg text-gray-700 leading-relaxed">
                  <li>플레이 중 뛰지 않습니다.</li>
                  <li>화면만 보지 말고 실제 주변을 함께 확인합니다.</li>
                  <li>다른 사람과 충분한 거리를 둡니다.</li>
                  <li>계단, 문 앞, 좁은 복도에서는 플레이하지 않습니다.</li>
                  <li>실제 화재가 발생하면 게임을 즉시 중단합니다.</li>
                  <li>실제 화재 상황에서는 대피와 신고가 우선입니다.</li>
                  <li>소화기는 작은 초기 화재에서만 사용합니다.</li>
                  <li>피난로가 확보된 경우에만 소화기를 사용합니다.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
