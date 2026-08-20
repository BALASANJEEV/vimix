import React, { useState, useEffect } from "react";
import { Payment } from "../types/types";
import {
  Search,
  Filter,
  DollarSign,
  Plus,
  Calendar,
  Eye,
  Edit,
  Trash2,
  IndianRupee,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { deletePayment, getPayments } from "../services/apiClient";
import FormatCash from "./FormatCash";

const PaymentList: React.FC = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 🔑 Fetch payments from API on mount
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await getPayments();
        setPayments(res.data); // API returns [{...}]
      } catch (err) {
        console.error("Failed to fetch payments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const filteredPayments = payments
    .filter((payment) => {
      const matchesSearch =
        payment.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return b.amount - a.amount;
    });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      overdue: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = payments
    .filter((p) => p.status === "overdue")
    .reduce((sum, p) => sum + p.amount, 0);

  const handleViewClient = (clientId: string) => {
    if (clientId) navigate(`/clients/${clientId}`);
  };

  const handleViewProject = (projectId: string) => {
    if (projectId) navigate(`/projects/${projectId}`);
  };

  if (loading) {
    return <p className="p-6">Loading payments...</p>;
  }

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deletePayment(deleteId);
      // Remove from local list immediately
      setPayments((prev) => prev.filter((p) => p.id !== deleteId));

      setDeleteId(null);
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className=" my-20 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-black mb-2">Payments</h2>
          <p className="text-gray-600">Monitor and track all client payments</p>
        </div>
        <button
          onClick={() => navigate("/payments/add")}
          className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          <Plus size={18} />
          <span>Add Payment</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <IndianRupee className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">
                <FormatCash amount={totalPaid}/>
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                ₹{totalPending.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                ₹{totalOverdue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <IndianRupee className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-black">
                <FormatCash amount={(totalPaid + totalPending + totalOverdue)}/>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search payments by client or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black bg-white"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "amount")}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black bg-white"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">{payment.clientName}</td>
                  <td className="px-6 py-4 text-sm">
                    {payment.projectTitle || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm truncate max-w-xs">
                    {payment.description}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">
                    ₹<FormatCash amount={payment.amount}/>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                        payment.status
                      )}`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/payments/edit/${payment.id}`)}
                        className="text-black hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                        title="Edit Project"
                      >
                        <Edit size={16} />
                      </button>
                      {payment.clientId && (
                        <button
                          onClick={() => handleViewClient(payment.clientId!)}
                          className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
                          title="View Client"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      {payment.projectId && (
                        <button
                          onClick={() => handleViewProject(payment.projectId!)}
                          className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded"
                          title="View Project"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteId(payment.id)}
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
                              Delete Payment
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

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <IndianRupee size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {payments.length === 0
                ? "No payments recorded yet. Add your first payment to get started."
                : "No payments found matching your criteria."}
            </p>
            {payments.length === 0 && (
              <button
                onClick={() => navigate("/payments/add")}
                className="mt-4 flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 mx-auto"
              >
                <Plus size={16} />
                <span>Add First Payment</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentList;
