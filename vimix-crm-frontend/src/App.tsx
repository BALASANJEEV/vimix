import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Navigation from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import ProjectList from "./components/ProjectList";
import ClientList from "./components/ClientList";
import ProjectDetail from "./components/ProjectDetail";
import PaymentList from "./components/PaymentList";
import AddEditProject from "./components/AddEditProject";
import AddPayment from "./components/AddPayment";
import ClientDetail from "./components/ClientDetail";
import AddEditClient from "./components/AddEditClient";
import PartnerList from "./components/PartnerList";
import AddEditPartner from "./components/AddEditPartner";
import Settings from "./components/Settings";
import { Client, Project, Payment } from "./types/types";
import apiClient from "./services/apiClient";
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const navigate = useNavigate();

  // Check for existing token on component mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const handleApiError = (error: any) => {
    if (error.response && error.response.status === 401) {
      handleLogout();
    }
  };

  const fetchClients = async () => {
    try {
      const response = await apiClient.get('/clients');
      setClients(response.data);
    } catch (error) {
      handleApiError(error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await apiClient.get('/projects');
      setProjects(response.data);
    } catch (error) {
      handleApiError(error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await apiClient.get('/payments');
      setPayments(response.data);
    } catch (error) {
      handleApiError(error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchClients();
      fetchProjects();
      fetchPayments();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/signup" element={<Signup onLogin={handleLoginSuccess} />} />
        <Route path="*" element={<Login onLogin={handleLoginSuccess} />} />
      </Routes>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <Navigation onLogout={handleLogout} />
        <main className="max-w-7xl mx-auto p-4">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="/dashboard"
              element={<Dashboard projects={projects} payments={payments} />}
            />
            <Route
              path="/projects"
              element={
                <ProjectList 
                  projects={projects} 
                  clients={clients} 
                  onUpdateProject={handleSaveProject}
                />
              }
            />
            <Route
              path="/projects/add"
              element={
                <AddEditProject
                  projects={projects}
                  clients={clients}
                  onSave={handleSaveProject}
                />
              }
            />
            <Route
              path="/projects/edit/:id"
              element={
                <AddEditProject
                  projects={projects}
                  clients={clients}
                  onSave={handleSaveProject}
                />
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProjectDetail
                  projects={projects}
                  clients={clients}
                  payments={payments}
                  onUpdateProject={handleSaveProject}
                />
              }
            />
            {/* Clients */}
            <Route
              path="/clients"
              element={
                <ClientList 
                  clients={clients} 
                  projects={projects} 
                  onUpdateClient={handleSaveClient}
                />
              }
            />
            <Route
              path="/clients/add"
              element={
                <AddEditClient
                  clients={clients}
                  onSave={handleSaveClient}
                />
              }
            />
            <Route
              path="/clients/edit/:id"
              element={
                <AddEditClient
                  clients={clients}
                  onSave={handleSaveClient}
                />
              }
            />
            <Route
              path="/clients/:id"
              element={
                <ClientDetail
                  clients={clients}
                  projects={projects}
                  payments={payments}
                  onUpdateClient={handleSaveClient}
                  onUpdateProject={handleSaveProject}
                />
              }
            />
            {/* Partners */}
            <Route
              path="/partners"
              element={<PartnerList />}
            />
            <Route
              path="/partners/add"
              element={<AddEditPartner />}
            />
            <Route
              path="/partners/edit/:id"
              element={<AddEditPartner />}
            />
            {/* Payments */}
            <Route
              path="/payments"
              element={<PaymentList payments={payments} />}
            />
          </Routes>
        </main>
      </div>
  );
}

export default App;