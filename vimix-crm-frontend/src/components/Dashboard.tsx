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
    <div className=" my-20 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's your business overview.
          </p>
        </div>
        <button
          onClick={handleViewProjects}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          View All Projects
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalProjects}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{activeProjects}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-lg">
              <IndianRupee className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(pendingPayments)}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Project Pipeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {Object.entries(projectsByStage).map(([stage, count]) => (
            <div key={stage} className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStageColor(stage)}`}>
                {count}
              </div>
              <p className="text-xs text-gray-600 mt-2 capitalize">{stage.replace('-', ' ')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Projects */}
      {/* Recent Projects */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-semibold text-gray-900">Recent Projects</h2>
    <button
      onClick={handleViewProjects}
      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
    >
      View All
    </button>
  </div>

  {recentProjects.length === 0 ? (
    <div className="text-center py-8">
      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500">No projects yet</p>
      <button
        onClick={handleCreateProject}
        className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
      >
        Create your first project
      </button>
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-gray-700">Details</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700">Paid</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700">Pending</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700">Stage</th>
            <th className="px-4 py-2 text-right font-semibold text-gray-700">Budget</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {recentProjects.map((project, i) => {
            const projectPayments = payments.filter(p => p.projectId === project.id);
            const paid = projectPayments
              .filter(p => p.status === "paid")
              .reduce((sum, p) => sum + p.amount, 0);
            const pending = projectPayments
              .filter(p => p.status === "pending")
              .reduce((sum, p) => sum + p.amount, 0);

            return (
              <tr
                key={i}
                className="hover:bg-gray-50 transition cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{project.title}</p>
                    <p className="text-xs text-gray-500">
                      {project.service} • {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 text-green-700 font-bold">
                  ₹<FormatCash amount={paid} />
                </td>
                <td className="px-4 py-3 text-red-700 font-bold">
                  ₹<FormatCash amount={pending} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(
                      project.stage
                    )}`}
                  >
                    {project.stage.replace("-", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-900  font-bold">
                  ₹<FormatCash amount={project.budget || 0} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )}
</div>

    </div>
  );
};

export default Dashboard;