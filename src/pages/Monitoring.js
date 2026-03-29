import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

function Monitoring() {
  const [students, setStudents] = useState([]);
  const [backgroundImage, setBackgroundImage] = useState(null);

  // 예시 데이터
  useEffect(() => {
    const exampleStudents = [
      { id: 1, name: "학생A", x: 50, y: 80, status: "대피 중" },
      { id: 2, name: "학생B", x: 200, y: 120, status: "제한 구역 진입" },
      { id: 3, name: "학생C", x: 150, y: 200, status: "화재 구역 진입" },
    ];
    setStudents(exampleStudents);
  }, []);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setBackgroundImage(reader.result);
    reader.readAsDataURL(file);
  };

  const getStatusClassName = (status) => {
    if (status === "대피 중") {
      return "bg-green-200 text-green-800";
    }
    if (status === "제한 구역 진입") {
      return "bg-yellow-200 text-yellow-800";
    }
    return "bg-red-200 text-red-800";
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Navbar />

      <div className="p-8 flex flex-col space-y-6">
        <h2 className="text-3xl font-bold text-[#2E7D32] mb-2">
          실시간 모니터링
        </h2>
        <p className="text-gray-600">
          대피도 기반 실시간 위치 모니터링과 메타버스 공간 화면을 함께 확인할 수
          있습니다.
        </p>

        {/* 대피도 업로드 */}
        <div className="bg-white border rounded shadow p-4">
          <label className="block font-medium mb-2">대피도 업로드</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="border px-3 py-2 rounded"
          />
        </div>

        {/* 메인 영역 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* 왼쪽: 2D 모니터링 */}
          <div className="bg-white border rounded shadow p-4 flex flex-col">
            <h3 className="text-xl font-semibold text-[#2E7D32] mb-4">
              2D 모니터링 화면
            </h3>

            <div className="relative w-full h-[600px] bg-gray-100 border rounded overflow-hidden">
              {backgroundImage ? (
                <img
                  src={backgroundImage}
                  alt="대피도"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  대피도를 업로드 해주세요.
                </div>
              )}

              {/* 학생 위치 표시 */}
              {backgroundImage &&
                students.map((student) => (
                  <div
                    key={student.id}
                    style={{
                      position: "absolute",
                      left: `${student.x}px`,
                      top: `${student.y}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                    className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow"
                    title={`${student.name} - ${student.status}`}
                  />
                ))}
            </div>
          </div>

          {/* 오른쪽: Unity WebGL */}
          <div className="bg-white border rounded shadow p-4 flex flex-col">
            <h3 className="text-xl font-semibold text-[#2E7D32] mb-4">
              3D 메타버스 화면
            </h3>

            <div className="w-full h-[600px] border rounded overflow-hidden bg-black">
              <iframe
                src="/WebGL/index.html"
                width="100%"
                height="100%"
                style={{ border: "none" }}
                title="Unity WebGL"
              />
            </div>
          </div>
        </div>

        {/* 하단 현재 현황 */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-xl font-semibold text-[#2E7D32] mb-4">
            현재 현황
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {students.map((student) => (
              <div
                key={student.id}
                className="border rounded p-4 flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{student.name}</span>
                  <span className="text-sm text-gray-500">
                    위치: ({student.x}, {student.y})
                  </span>
                </div>

                <span
                  className={`px-2 py-1 rounded text-xs ${getStatusClassName(
                    student.status,
                  )}`}
                >
                  {student.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Monitoring;
