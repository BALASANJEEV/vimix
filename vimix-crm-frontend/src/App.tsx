import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Login from "./components/Login";
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

  const handleSaveClient = (client: Client) => {
    if (clients.some(c => c.id === client.id)) {
      // Update existing client
      setClients(clients.map(c => c.id === client.id ? client : c));
    } else {
      // Add new client
      setClients([...clients, client]);
    }
  };

  const handleSaveProject = (project: Project) => {
    if (projects.some(p => p.id === project.id)) {
      // Update existing project
      setProjects(projects.map(p => p.id === project.id ? project : p));
    } else {
      // Add new project
      setProjects([...projects, project]);
    }
  };

  const handleSavePayment = (payment: Payment) => {
    if (payments.some(p => p.id === payment.id)) {
      // Update existing payment
      setPayments(payments.map(p => p.id === payment.id ? payment : p));
    } else {
      // Add new payment
      setPayments([...payments, payment]);
      
      // Update project total payments if payment has a projectId
      if (payment.projectId) {
        const project = projects.find(p => p.id === payment.projectId);
        if (project) {
          const updatedProject = {
            ...project,
            totalPayments: project.totalPayments + payment.amount
          };
          handleSaveProject(updatedProject);
        }
      }
      
      // Update client total payments
      if (payment.clientId) {
        const client = clients.find(c => c.id === payment.clientId);
        if (client) {
          const updatedClient = {
            ...client,
            totalPayments: client.totalPayments + payment.amount
          };
          handleSaveClient(updatedClient);
        }
      }
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLoginSuccess} />;
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <Navigation onLogout={handleLogout} />
        <main className="max-w-7xl mx-auto p-4">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

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
            <Route
              path="/payments/add"
              element={
                <AddPayment
                  payments={payments}
                  clients={clients}
                  onSave={handleSavePayment}
                />
              }
            />
            <Route
              path="/payments/edit/:id"
              element={
                <AddPayment
                  payments={payments}
                  clients={clients}
                  onSave={handleSavePayment}
                />
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
  );
}

export default App;