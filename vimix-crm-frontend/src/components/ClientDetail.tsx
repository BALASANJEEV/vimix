// src/pages/ClientDetail.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Users,
  Activity,
  FileText,
  Calendar,
  Clock,
  Upload,
  Download,
  Eye,
  Trash2,
  Plus,
} from "lucide-react";
import { getClientDetails } from "../services/apiClient"; // <- your API util
import type {
  Client,
  Project,
  Payment,
  ActivityLogEntry,
  ProjectStage,
  DocumentFile,
  Meeting,
} from "../types/types";
import { STAGES, SERVICES } from "../types/types";

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "payments" | "documents" | "meetings" | "activity"
  >("overview");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // fetch client + related data
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const { data } = await getClientDetails(id);
        setClient(data.client);
        setProjects(data.projects || []);
        setPayments(data.payments || []);
        if (data.projects?.length) setSelectedProjectId(data.projects[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const projectPayments = payments.filter(
    (p) => p.projectId === selectedProjectId
  );

  if (loading) return <div className="p-6">Loading…</div>;
  if (!client)
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Client not found</p>
        <button
          onClick={() => navigate("/clients")}
          className="mt-4 text-blue-600 hover:underline"
        >
          Back to Clients
        </button>
      </div>
    );

  // small helpers
  const getStageColor = (stage: ProjectStage) =>
    ({
      enquiry: "bg-gray-500",
      "sow-provided": "bg-blue-500",
      "proposal-sent": "bg-yellow-500",
      negotiation: "bg-orange-500",
      prototyping: "bg-purple-500",
      "signed-agreement": "bg-green-500",
    }[stage] || "bg-gray-500");

  const getStageProgress = (stage: ProjectStage) =>
    (STAGES[stage].order / 6) * 100;

  const formatActivityTime = (ts: string) => {
    const d = new Date(ts);
    const diffH = Math.floor((Date.now() - d.getTime()) / 36e5);
    if (diffH < 1) return "Just now";
    if (diffH < 24) return `${diffH}h ago`;
    if (diffH < 168) return `${Math.floor(diffH / 24)}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className=" my-20 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/clients")}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-black">{client.name}</h2>
            <p className="text-gray-600">{client.company}</p>
          </div>
        </div>
        {projects.length > 0 && (
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white"
          >
            {projects.map((p,i) => (
              <option key={i} value={p.id}>
                {p.title} – {SERVICES[p.service].label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* No project */}
      {!selectedProject && (
        <div className="bg-white p-12 border rounded-lg text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold">No Projects Yet</h3>
        </div>
      )}

      {selectedProject && (
        <>
          {/* Stage Progress */}
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Project Stage</h3>
              <span
                className={`px-3 py-1 rounded-full text-white ${getStageColor(
                  selectedProject.stage
                )}`}
              >
                {STAGES[selectedProject.stage].label}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${getStageColor(
                  selectedProject.stage
                )}`}
                style={{ width: `${getStageProgress(selectedProject.stage)}%` }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b">
            {["overview", "payments", "documents", "meetings", "activity"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-2 px-3 border-b-2 text-sm ${
                    activeTab === tab
                      ? "border-black text-black"
                      : "border-transparent text-gray-500"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              )
            )}
          </div>

          {/* Overview */}
          {activeTab === "overview" && (
            <div className="bg-white p-6 rounded-lg border space-y-2">
              <p>
                <strong>Project Title:</strong> {selectedProject.title}
              </p>
              {selectedProject.budget && (
                <p>
                  <strong>Budget:</strong>  ₹{selectedProject.budget}
                </p>
              )}
              {selectedProject.description && (
                <p className="pt-2 text-gray-700">
                  {selectedProject.description}
                </p>
              )}
            </div>
          )}

          {/* Payments */}
          {activeTab === "payments" && (
            <div className="bg-white rounded-lg border">
              {projectPayments.length ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Description</th>
                      <th className="p-3 text-left">Amount</th>
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectPayments.map((pay,i) => (
                      <tr key={i} className="border-t">
                        <td className="p-3">
                          {new Date(pay.date).toLocaleDateString()}
                        </td>
                        <td className="p-3">{pay.description}</td>
                        <td className="p-3">${pay.amount}</td>
                        <td className="p-3 capitalize">{pay.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-gray-500">No payments yet.</div>
              )}
            </div>
          )}

          {/* Documents */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              {Object.entries(selectedProject.documents || {}).map(
                ([key, doc]: [string, DocumentFile]) => (
                  <div
                    key={key}
                    className="bg-white p-4 border rounded flex justify-between"
                  >
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => window.open(doc.url, "_blank")}>
                        <Eye size={16} />
                      </button>
                      <button onClick={() => window.open(doc.url, "_blank")}>
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Meetings */}
          {activeTab === "meetings" && (
            <div className="bg-white p-6 rounded-lg border space-y-3">
              {(selectedProject.meetings || []).length === 0 && (
                <p className="text-gray-500">No meetings recorded.</p>
              )}
              {(selectedProject.meetings || []).map((m: Meeting,i) => (
                <div key={i} className="border-b pb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} />
                    <span>{new Date(m.date).toLocaleDateString()}</span>
                    <Clock size={16} />
                    <span>{m.time}</span>
                  </div>
                  <p className="font-medium">{m.title}</p>
                  {m.notes && (
                    <p className="text-sm text-gray-600">{m.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Activity */}
          {activeTab === "activity" && (
            <div className="bg-white rounded-lg border divide-y">
              {(selectedProject.activityLog || []).length === 0 && (
                <div className="p-6 text-gray-500">No activity recorded.</div>
              )}
              {(selectedProject.activityLog || []).map(
                (a: ActivityLogEntry,i) => (
                  <div key={i} className="p-4 flex justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity size={16} />
                      <span>{a.description}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatActivityTime(a.timestamp)}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClientDetail;
