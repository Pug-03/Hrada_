import { AnimatePresence } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { Layout } from '@/components/Layout'
import { RequireAccess } from '@/components/RequireAccess'
import Dashboard from '@/pages/Dashboard'
import EmployeeList from '@/pages/EmployeeList'
import EmployeeProfile from '@/pages/EmployeeProfile'
import Entry from '@/pages/Entry'
import Insights from '@/pages/Insights'
import Learning from '@/pages/Learning'
import NotAuthorized from '@/pages/NotAuthorized'
import Recruit from '@/pages/Recruit'
import TeamMatching from '@/pages/TeamMatching'
import Tracking from '@/pages/Tracking'

/**
 * Real routes rather than tab state (§2), so role permissions can be enforced
 * at navigation time (§8) and the browser's own back button works.
 */
export default function App() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          <Route path="/" element={<Entry />} />
          <Route path="/not-authorized" element={<NotAuthorized />} />

          <Route
            path="/dashboard"
            element={
              <RequireAccess screen="dashboard">
                <Dashboard />
              </RequireAccess>
            }
          />
          <Route
            path="/employees"
            element={
              <RequireAccess screen="employees">
                <EmployeeList />
              </RequireAccess>
            }
          />
          <Route
            path="/employees/:id"
            element={
              <RequireAccess screen="employees">
                <EmployeeProfile />
              </RequireAccess>
            }
          />
          <Route
            path="/recruit"
            element={
              <RequireAccess screen="recruit">
                <Recruit />
              </RequireAccess>
            }
          />
          <Route
            path="/team-matching"
            element={
              <RequireAccess screen="team-matching">
                <TeamMatching />
              </RequireAccess>
            }
          />
          <Route
            path="/learning"
            element={
              <RequireAccess screen="learning">
                <Learning />
              </RequireAccess>
            }
          />
          <Route
            path="/tracking"
            element={
              <RequireAccess screen="tracking">
                <Tracking />
              </RequireAccess>
            }
          />
          <Route
            path="/insights"
            element={
              <RequireAccess screen="insights">
                <Insights />
              </RequireAccess>
            }
          />

          <Route path="*" element={<Navigate to="/not-authorized" replace />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}
