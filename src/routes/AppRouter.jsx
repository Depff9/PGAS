import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { ROLES } from '../mock/users';

import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Profile from '../pages/Profile';
import Directions from '../pages/Directions';
import Applications from '../pages/Applications';
import ApplicationWorkspace from '../pages/ApplicationWorkspace';
import Rating from '../pages/Rating';

import AdminDashboard from '../pages/AdminDashboard';
import Users from '../pages/Users';
import Faculties from '../pages/Faculties';
import Groups from '../pages/Groups';
import AdminDirections from '../pages/AdminDirections';
import Tooltips from '../pages/Tooltips';
import ScoringMatrix from '../pages/ScoringMatrix';
import ChangeHistory from '../pages/ChangeHistory';

import ComissionDashboard from '../pages/ComissionDashboard';
import Regulations from '../pages/Regulations';
import CommissionApplications from '../pages/CommissionApplications';
import SubmissionReview from '../pages/SubmissionReview';
import CommissionExport from '../pages/CommissionExport';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="/directions" element={<Directions />} />
      <Route
        path="/regulations"
        element={
          <ProtectedRoute>
            <Regulations readOnly />
          </ProtectedRoute>
        }
      />
      <Route
        path="/applications"
        element={
          <ProtectedRoute roles={[ROLES.STUDENT]}>
            <Applications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/application/workspace"
        element={
          <ProtectedRoute roles={[ROLES.STUDENT]}>
            <ApplicationWorkspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/application/new"
        element={<Navigate to="/application/workspace" replace />}
      />
      <Route
        path="/rating"
        element={
          <ProtectedRoute roles={[ROLES.STUDENT]}>
            <Rating />
          </ProtectedRoute>
        }
      />

      <Route
        path="/commission"
        element={
          <ProtectedRoute roles={[ROLES.COMMISSION]}>
            <ComissionDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/commission/applications"
        element={
          <ProtectedRoute roles={[ROLES.COMMISSION]}>
            <CommissionApplications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/commission/applications/:submissionId"
        element={
          <ProtectedRoute roles={[ROLES.COMMISSION]}>
            <SubmissionReview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/commission/regulations"
        element={
          <ProtectedRoute roles={[ROLES.COMMISSION]}>
            <Regulations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/commission/directions"
        element={
          <ProtectedRoute roles={[ROLES.COMMISSION]}>
            <AdminDirections />
          </ProtectedRoute>
        }
      />
      <Route
        path="/commission/scoring"
        element={
          <ProtectedRoute roles={[ROLES.COMMISSION]}>
            <ScoringMatrix />
          </ProtectedRoute>
        }
      />
      <Route
        path="/commission/export"
        element={
          <ProtectedRoute roles={[ROLES.COMMISSION]}>
            <CommissionExport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/commission/history"
        element={
          <ProtectedRoute roles={[ROLES.COMMISSION, ROLES.ADMIN]}>
            <ChangeHistory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/faculties"
        element={
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Faculties />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/groups"
        element={
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Groups />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tooltips"
        element={
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Tooltips />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/history"
        element={
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <ChangeHistory />
          </ProtectedRoute>
        }
      />

      <Route path="/admin/applications" element={<Navigate to="/admin" replace />} />
      <Route path="/admin/scoring" element={<Navigate to="/admin" replace />} />
      <Route path="/admin/directions" element={<Navigate to="/admin" replace />} />
      <Route path="/admin/regulations" element={<Navigate to="/admin" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
