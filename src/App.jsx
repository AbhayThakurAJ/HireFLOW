import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthLayout from './layout/AuthLayout';
import ProtectedLayout from './layout/ProtectedLayout';

const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Leads = React.lazy(() => import('./pages/Leads'));
const LeadDetails = React.lazy(() => import('./pages/LeadDetails'));
const LeadForm = React.lazy(() => import('./pages/LeadForm'));
const Companies = React.lazy(() => import('./pages/Companies'));
const CompanyDetails = React.lazy(() => import('./pages/CompanyDetails'));
const Contacts = React.lazy(() => import('./pages/Contacts'));
const ContactDetails = React.lazy(() => import('./pages/ContactDetails'));
const Tasks = React.lazy(() => import('./pages/Tasks'));
const TaskForm = React.lazy(() => import('./pages/TaskForm'));
const TaskDetails = React.lazy(() => import('./pages/TaskDetails'));
const Deals = React.lazy(() => import('./pages/Deals'));
const DealDetails = React.lazy(() => import('./pages/DealDetails'));
const DealForm = React.lazy(() => import('./pages/DealForm'));
const Pipeline = React.lazy(() => import('./pages/Pipeline'));
const AuditLogs = React.lazy(() => import('./pages/AuditLogs'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
          <Routes>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/leads/new" element={<LeadForm />} />
              <Route path="/leads/:id/edit" element={<LeadForm />} />
              <Route path="/leads/:id" element={<LeadDetails />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/companies/:id" element={<CompanyDetails />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/contacts/:id" element={<ContactDetails />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/tasks/new" element={<TaskForm />} />
              <Route path="/tasks/:id" element={<TaskDetails />} />
              <Route path="/tasks/:id/edit" element={<TaskForm />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/deals/new" element={<DealForm />} />
              <Route path="/deals/:id" element={<DealDetails />} />
              <Route path="/deals/:id/edit" element={<DealForm />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
