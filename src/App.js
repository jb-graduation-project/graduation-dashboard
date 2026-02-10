import React from "react";
import "./index.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Main from "./pages/Main";
import CreateChannel from "./pages/CreateChannel";
import JoinChannel from "./pages/JoinChannel";
import SchoolChannel from "./pages/SchoolChannel";
import SchoolSetting from "./pages/SchoolSetting";
import ScenarioManagement from "./pages/ScenarioManagement";
import Monitoring from "./pages/Monitoring";
import AnalysisResult from "./pages/AnalysisResult";
import RoomList from "./pages/RoomList";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/main" element={<Main />} />
        <Route path="/create-channel" element={<CreateChannel />} />
        <Route path="/join-channel" element={<JoinChannel />} />
        <Route path="/school-channel" element={<SchoolChannel />} />
        <Route path="/school-setting" element={<SchoolSetting />} />
        <Route path="/scenario" element={<ScenarioManagement />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="/analysis" element={<AnalysisResult />} />
        <Route path="/room-list" element={<RoomList />} />
      </Routes>
    </Router>
  );
}

export default App;
