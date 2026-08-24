import React, { useEffect, useState } from "react";
import { Project, Payment } from "../types/types";
import {
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Calendar,
  AlertCircle,
  IndianRupee,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getProjects, getPayments } from "../services/apiClient";
import FormatCash from "./FormatCash";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, paymentsRes] = await Promise.all([
          getProjects(),
          getPayments(),
        ]);
        setProjects(projectsRes.data);
        setPayments(paymentsRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  

  if (loading) return <div className="py-20 text-center">Loading dashboard…</div>;

  // Metrics calculations
  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (p) => p.stage !== "closed" && p.stage !== "cancelled"
  ).length;

  const totalRevenue = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const projectsByStage = {
    enquiry: projects.filter((p) => p.stage === "enquiry").length,
    "sow-provided": projects.filter((p) => p.stage === "sow-provided").length,
    "proposal-sent": projects.filter((p) => p.stage === "proposal-sent").length,
    negotiation: projects.filter((p) => p.stage === "negotiation").length,
    prototyping: projects.filter((p) => p.stage === "prototyping").length,
    "signed-agreement": projects.filter((p) => p.stage === "signed-agreement").length,
    closed: projects.filter((p) => p.stage === "closed").length,
    cancelled: projects.filter((p) => p.stage === "cancelled").length,
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      enquiry: "bg-blue-100 text-blue-800",
      "sow-provided": "bg-indigo-100 text-indigo-800",
      "proposal-sent": "bg-yellow-100 text-yellow-800",
      negotiation: "bg-orange-100 text-orange-800",
      prototyping: "bg-purple-100 text-purple-800",
      "signed-agreement": "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[stage] || "bg-gray-100 text-gray-800";
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "INR" }).format(amount);

  const handleViewProjects = () => navigate("/projects");
  const handleCreateProject = () => navigate("/projects/add");

  return (
    <div className="my-20 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's
          </p>
        </div>
        {/* Additional header controls could be placed here */}
      </div>

      {/* Existing dashboard content (metrics, tables, etc.) */}
      {/* ... */}

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-500 text-sm">
        © 2026 Vimix CRM • Version 1.0.0 • All rights reserved.
      </footer>
    </div>
  );
};

export default Dashboard;
