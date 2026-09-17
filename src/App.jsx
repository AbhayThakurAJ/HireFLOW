import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthLayout from './layout/AuthLayout';
import ProtectedLayout from './layout/ProtectedLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetails from './pages/LeadDetails';
import Companies from './pages/Companies';
import CompanyDetails from './pages/CompanyDetails';
import Contacts from './pages/Contacts';
import ContactDetails from './pages/ContactDetails';
import Tasks from './pages/Tasks';
import TaskForm from './pages/TaskForm';
import TaskDetails from './pages/TaskDetails';
import Deals from './pages/Deals';
import DealDetails from './pages/DealDetails';
import DealForm from './pages/DealForm';
import Pipeline from './pages/Pipeline';

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
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
