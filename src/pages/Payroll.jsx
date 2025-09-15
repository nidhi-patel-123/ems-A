import React, { useState, useEffect } from "react";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaTimes,
  FaEye,
  FaDownload,
  FaFilter,
  FaSearch,
  FaSort,
  FaMoneyBillWave,
  FaUsers,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle
} from 'react-icons/fa';
import { MdDashboard, MdPersonAdd, MdPayment } from 'react-icons/md';
import axios from "axios";

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  // Form states
  const [form, setForm] = useState({
    employee: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: "",
    allowances: { houseRent: 0, medical: 0, transport: 0, food: 0, other: 0 },
    deductions: { tax: 0, insurance: 0, loan: 0, other: 0 },
    overtime: { hours: 0, rate: 0 },
    bonus: 0,
    notes: ""
  });

  // Filter and pagination
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ month: "", year: "", status: "" });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
    fetchStats();
  }, [page, filters, sortBy, sortOrder]);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const params = new URLSearchParams({
        page,
        limit: perPage,
        sortBy,
        sortOrder,
        ...filters
      });

      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/admin/payrolls?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPayrolls(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch payrolls");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/admin/employees`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmployees(response.data);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const params = new URLSearchParams(filters);
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/admin/payrolls/stats?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data.data.summary);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employee || !form.basicSalary) {
      setError("Employee and basic salary are required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = sessionStorage.getItem("token");
      let response;

      if (selectedPayroll) {
        response = await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/admin/payrolls/${selectedPayroll._id}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess("Payroll updated successfully!");
      } else {
        response = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/admin/payrolls`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess("Payroll created successfully!");
      }

      fetchPayrolls();
      fetchStats();
      setShowModal(false);
      resetForm();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payroll?")) return;

    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/admin/payrolls/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Payroll deleted successfully!");
      fetchPayrolls();
      fetchStats();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (paymentData) => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      await axios.patch(
        `${process.env.REACT_APP_BACKEND_URL}/admin/payrolls/${selectedPayroll._id}/payment`,
        paymentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Payment processed successfully!");
      fetchPayrolls();
      fetchStats();
      setShowPaymentModal(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Payment processing failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      employee: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basicSalary: "",
      allowances: { houseRent: 0, medical: 0, transport: 0, food: 0, other: 0 },
      deductions: { tax: 0, insurance: 0, loan: 0, other: 0 },
      overtime: { hours: 0, rate: 0 },
      bonus: 0,
      notes: ""
    });
    setSelectedPayroll(null);
  };

  const openEditModal = (payroll) => {
    setSelectedPayroll(payroll);
    setForm({
      employee: payroll.employee._id,
      month: payroll.month,
      year: payroll.year,
      basicSalary: payroll.basicSalary,
      allowances: { ...payroll.allowances },
      deductions: { ...payroll.deductions },
      overtime: { ...payroll.overtime },
      bonus: payroll.bonus,
      notes: payroll.notes || ""
    });
    setShowModal(true);
  };

  const openPaymentModal = (payroll) => {
    setSelectedPayroll(payroll);
    setShowPaymentModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || colors['pending'];
  };

  const getMonthName = (month) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1];
  };

  const filteredPayrolls = payrolls.docs || [];
  const totalPages = payrolls.totalPages || 1;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-[#113a69]">Payroll Management</h1>
        </div>
        <p className="text-gray-600">Manage employee salaries, allowances, and payments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payrolls</p>
              <p className="text-3xl font-bold text-[#113a69]">{stats.totalPayrolls || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaMoneyBillWave className="text-[#113a69] text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Net Salary</p>
              <p className="text-3xl font-bold text-pink-800">₹{(stats.totalNetSalary || 0).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-pink-100 rounded-lg">
              <MdPayment className="text-pink-800 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingPayments || 0}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FaClock className="text-yellow-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid Payments</p>
              <p className="text-3xl font-bold text-green-600">{stats.paidPayments || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FaCheckCircle className="text-green-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search payrolls..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#113a69] focus:border-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div> */}

            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <select
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#113a69]"
              >
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                ))}
              </select>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#113a69]"
              >
                <option value="">All Years</option>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#113a69]"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              onClick={() => setShowBulkModal(true)}
            >
              <FaPlus className="text-sm" />
              Bulk Create
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-[#113a69] text-white rounded-lg hover:bg-[#1b5393] transition-colors font-medium"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              <FaPlus className="text-sm" />
              Add Payroll
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Payroll Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Basic Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allowances
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                  </tr>
                ))
              ) : filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <FaMoneyBillWave className="text-6xl mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No payrolls found</h3>
                    <p className="text-gray-600">Get started by creating your first payroll</p>
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((payroll) => (
                  <tr key={payroll._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-[#113a69] font-medium">
                            {payroll.employee?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {payroll.employee?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payroll.employee?.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getMonthName(payroll.month)} {payroll.year}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{payroll.basicSalary?.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{payroll.totalAllowances?.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{payroll.totalDeductions?.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-[#113a69]">
                        ₹{payroll.netSalary?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payroll.paymentStatus)}`}>
                        {payroll.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(payroll)}
                          className="text-[#113a69] hover:text-blue-900 p-1"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => openPaymentModal(payroll)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Process Payment"
                        >
                          <MdPayment />
                        </button>
                        <button
                          onClick={() => handleDelete(payroll._id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-2 rounded-lg transition-colors ${page === pageNum
                    ? "bg-[#113a69] text-white"
                    : "border border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Add/Edit Payroll Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedPayroll ? "Edit Payroll" : "Add New Payroll"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee *
                  </label>
                  <select
                    value={form.employee}
                    onChange={(e) => {
                      const selectedEmployeeId = e.target.value;
                      const selectedEmployee = employees.find(emp => emp._id === selectedEmployeeId);
                      setForm({
                        ...form,
                        employee: selectedEmployeeId,
                        basicSalary: selectedEmployee ? selectedEmployee.basicSalary || '' : ''
                      });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#113a69] focus:border-transparent"
                    required
                    disabled={loading}
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} - {emp.role} (₹{emp.basicSalary?.toLocaleString() || '0'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Basic Salary *
                  </label>
                  <input
                    type="number"
                    placeholder="Enter basic salary"
                    value={form.basicSalary}
                    onChange={(e) => setForm({ ...form, basicSalary: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#113a69] focus:border-transparent"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Month
                  </label>
                  <select
                    value={form.month}
                    onChange={(e) => setForm({ ...form, month: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#113a69] focus:border-transparent"
                    disabled={loading}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#113a69] focus:border-transparent"
                    disabled={loading}
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Allowances Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Allowances</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(form.allowances).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={value}
                        onChange={(e) => setForm({
                          ...form,
                          allowances: { ...form.allowances, [key]: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#113a69] focus:border-transparent"
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Deductions Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Deductions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(form.deductions).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={value}
                        onChange={(e) => setForm({
                          ...form,
                          deductions: { ...form.deductions, [key]: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#113a69] focus:border-transparent"
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Overtime and Bonus */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overtime Hours
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.overtime.hours}
                    onChange={(e) => setForm({
                      ...form,
                      overtime: { ...form.overtime, hours: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#113a69] focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overtime Rate
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.overtime.rate}
                    onChange={(e) => setForm({
                      ...form,
                      overtime: { ...form.overtime, rate: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#113a69] focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bonus
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.bonus}
                    onChange={(e) => setForm({ ...form, bonus: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#113a69] focus:border-transparent"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  placeholder="Additional notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#113a69] focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-[#113a69] text-white rounded-lg hover:bg-[#1b5393] transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? "Saving..." : (selectedPayroll ? "Update Payroll" : "Create Payroll")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Processing Modal */}
      {showPaymentModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Process Payment</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Payment Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Employee:</span>
                    <span className="font-medium">{selectedPayroll.employee?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Salary:</span>
                    <span className="font-medium text-green-600">₹{selectedPayroll.netSalary?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Period:</span>
                    <span className="font-medium">{getMonthName(selectedPayroll.month)} {selectedPayroll.year}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  id="paymentStatus"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  id="paymentMethod"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const paymentData = {
                      paymentStatus: document.getElementById('paymentStatus').value,
                      paymentMethod: document.getElementById('paymentMethod').value,
                      paymentDate: new Date()
                    };
                    handlePayment(paymentData);
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Process Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Bulk Create Payrolls</h2>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  This will create payrolls for all active employees for the specified month and year.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Month
                  </label>
                  <select
                    id="bulkMonth"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    id="bulkYear"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const token = sessionStorage.getItem("token");
                      const month = parseInt(document.getElementById('bulkMonth').value);
                      const year = parseInt(document.getElementById('bulkYear').value);

                      await axios.post(
                        `${process.env.REACT_APP_BACKEND_URL}/admin/payrolls/bulk`,
                        { month, year },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );

                      setSuccess("Bulk payrolls created successfully!");
                      setShowBulkModal(false);
                      fetchPayrolls();
                      fetchStats();
                      setTimeout(() => setSuccess(""), 3000);
                    } catch (err) {
                      setError(err.response?.data?.message || "Bulk creation failed");
                    }
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Create Payrolls
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
