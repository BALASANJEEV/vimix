import React, { useState, useEffect } from "react";
import { Client } from "../types/types";
import { STAGES } from "../types/types";
import {
  Search,
  Filter,
  Eye,
  Edit,
  Plus,
  Calendar,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getClients, deleteClient } from "../services/apiClient";
import FormatCash from "./FormatCash";

const ClientList: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  // Fetch all clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await getClients();
        setClients(response.data);
      } catch (err: any) {
        console.error("Error fetching clients:", err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteClient(deleteId);
      // Remove from local list immediately
      setClients((prev) => prev.filter((p) => p.id !== deleteId));

      setDeleteId(null);
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter logic remains the same
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage = stageFilter === "all" || client.stage === stageFilter;

    let matchesDate = true;
    if (dateFilter !== "all" && client.stageHistory) {
      const currentDate = new Date();
      let targetDate: Date;

      switch (dateFilter) {
        case "last-3-months":
          targetDate = new Date();
          targetDate.setMonth(currentDate.getMonth() - 3);
          break;
        case "last-6-months":
          targetDate = new Date();
          targetDate.setMonth(currentDate.getMonth() - 6);
          break;
        case "last-year":
          targetDate = new Date();
          targetDate.setFullYear(currentDate.getFullYear() - 1);
          break;
        case "custom":
          if (dateRange.start && dateRange.end) {
            const startDate = new Date(dateRange.start);
            const endDate = new Date(dateRange.end);

            if (stageFilter !== "all") {
              const stageEntry = client.stageHistory.find(
                (h) => h.stage === stageFilter
              );
              matchesDate = stageEntry
                ? new Date(stageEntry.date) >= startDate &&
                  new Date(stageEntry.date) <= endDate
                : false;
            } else {
              matchesDate =
                new Date(client.createdAt) >= startDate &&
                new Date(client.createdAt) <= endDate;
            }
          }
          return matchesSearch && matchesStage && matchesDate;
        default:
          targetDate = new Date(0);
      }

      if (dateFilter !== "custom") {
        if (stageFilter !== "all") {
          const stageEntry = client.stageHistory.find(
            (h) => h.stage === stageFilter
          );
          matchesDate = stageEntry
            ? new Date(stageEntry.date) >= targetDate
            : false;
        } else {
          matchesDate = new Date(client.createdAt) >= targetDate;
        }
      }
    }

    return matchesSearch && matchesStage && matchesDate;
  });

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      enquiry: "bg-gray-100 text-gray-800",
      "sow-provided": "bg-blue-100 text-blue-800",
      "proposal-sent": "bg-yellow-100 text-yellow-800",
      negotiation: "bg-orange-100 text-orange-800",
      prototyping: "bg-purple-100 text-purple-800",
      "signed-agreement": "bg-green-100 text-green-800",
    };
    return colors[stage] || "bg-gray-100 text-gray-800";
  };

  if (loading) return <p className="text-center py-20">Loading clients...</p>;
  if (error) return <p className="text-center py-10 text-red-500">{error}</p>;
  
  return (
    <div className=" my-20 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-black mb-2">Clients</h2>
          <p className="text-gray-600">Manage your client pipeline</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/clients/add")}
            className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            <Plus size={18} />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none"
            />
          </div>
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none bg-white"
            >
              <option value="all">All Stages</option>
              {Object.entries(STAGES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Calendar
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none bg-white"
            >
              <option value="all">All Time</option>
              <option value="last-3-months">Last 3 Months</option>
              <option value="last-6-months">Last 6 Months</option>
              <option value="last-year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          {dateFilter === "custom" && (
            <div className="flex space-x-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none"
              />
            </div>
          )}
        </div>

        {/* Filter Summary */}
        {(stageFilter !== "all" || dateFilter !== "all") && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">
              Showing {filteredClients.length} clients
              {stageFilter !== "all" &&
                ` in ${STAGES[stageFilter as keyof typeof STAGES].label} stage`}
              {dateFilter !== "all" &&
                dateFilter !== "custom" &&
                ` from ${dateFilter.replace("-", " ")}`}
              {dateFilter === "custom" &&
                dateRange.start &&
                dateRange.end &&
                ` between ${new Date(
                  dateRange.start
                ).toLocaleDateString()} and ${new Date(
                  dateRange.end
                ).toLocaleDateString()}`}
            </p>
          </div>
        )}
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Payments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-black">
                        {client.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {client.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-black">{client.company}</div>
                    <div className="text-sm text-gray-600">{client.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStageColor(
                        client.stage
                      )}`}
                    >
                      {STAGES[client.stage].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                    ₹<FormatCash amount={client.totalPayments}/>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/clients/${client.id}`)}
                        className="text-black hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => navigate(`/clients/edit/${client.id}`)}
                        className="text-black hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                        title="Edit Client"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(client.id)}
                        className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                        title="Delete Project"
                      >
                        <Trash2 size={16} />
                      </button>
                      {deleteId && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black/10 z-50 !m-0">
                          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl transform transition-all">
                            {/* Header */}
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                              Delete Client
                            </h3>

                            {/* Message */}
                            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                              Are you sure you want to delete this project?{" "}
                              <br />
                              <span className="font-medium text-red-600">
                                This action cannot be undone.
                              </span>
                            </p>

                            {/* Actions */}
                            <div className="flex justify-end space-x-3">
                              <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition"
                              >
                                {isDeleting ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No clients found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientList;
