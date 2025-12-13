// SubscriptionsPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, Download, RefreshCw, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";

const API = import.meta.env.VITE_BACKEND_URL;

export default function SubscriptionsPage() {
  const token = localStorage.getItem("token");
  const [summary, setSummary] = useState({});
  const [lists, setLists] = useState({ subscribed: [], unsubscribed: [] });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination states
  const [subscribedPage, setSubscribedPage] = useState(1);
  const [unsubscribedPage, setUnsubscribedPage] = useState(1);
  const itemsPerPage = 6;

  const loadSummary = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/subscriptions/summary`, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(res.data);
    } catch (err) { 
      console.error(err); 
    }
  };

  const loadLists = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/subscriptions/users`, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      setLists(res.data);
      
      // Generate chart data from subscriptions
      generateChartData(res.data.subscribed);
    } catch (err) { 
      console.error(err); 
    }
  };

  const generateChartData = (subscriptions) => {
    // Get last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: 0,
        count: 0
      });
    }

    // Aggregate subscriptions by day
    subscriptions.forEach(sub => {
      const subDate = new Date(sub.createdAt).toISOString().split('T')[0];
      const dayData = days.find(d => d.date === subDate);
      if (dayData) {
        dayData.revenue += sub.amount || 0;
        dayData.count += 1;
      }
    });

    setChartData(days);
  };

  useEffect(() => { 
    loadSummary(); 
    loadLists(); 
  }, []);

  const exportCsv = (period = 'all') => {
    const now = new Date();
    let filtered = lists.subscribed;

    // Filter by period
    if (period === 'daily') {
      const yesterday = new Date(now - 24 * 60 * 60 * 1000);
      filtered = lists.subscribed.filter(s => new Date(s.createdAt) >= yesterday);
    } else if (period === 'weekly') {
      const lastWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);
      filtered = lists.subscribed.filter(s => new Date(s.createdAt) >= lastWeek);
    } else if (period === 'monthly') {
      const lastMonth = new Date(now - 30 * 24 * 60 * 60 * 1000);
      filtered = lists.subscribed.filter(s => new Date(s.createdAt) >= lastMonth);
    } else if (period === 'yearly') {
      const lastYear = new Date(now - 365 * 24 * 60 * 60 * 1000);
      filtered = lists.subscribed.filter(s => new Date(s.createdAt) >= lastYear);
    }

    // Calculate totals
    const totalRevenue = filtered.reduce((sum, s) => sum + (s.amount || 0), 0);
    const totalSubscribers = filtered.length;

    // Build CSV
    const rows = [
      ["Finance Report - " + period.toUpperCase()],
      ["Generated:", new Date().toLocaleString()],
      ["Total Subscribers:", totalSubscribers],
      ["Total Revenue:", "₦" + totalRevenue.toLocaleString()],
      [""],
      ["Username", "Email", "Amount (₦)", "Subscribed At", "Status"]
    ];

    filtered.forEach(s => {
      const user = s.user || s;
      const amount = s.amount ?? 0;
      const at = s.createdAt ? new Date(s.createdAt).toLocaleString() : "";
      rows.push([
        user.username || "N/A", 
        user.email || "N/A", 
        amount, 
        at,
        "Active"
      ]);
    });

    // Add summary footer
    rows.push([]);
    rows.push(["SUMMARY"]);
    rows.push(["Total Subscribers:", totalSubscribers]);
    rows.push(["Total Revenue:", "₦" + totalRevenue.toLocaleString()]);

    const csv = rows.map(r => r.map(cell => `"${String(cell || "").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance_report_${period}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const refreshAll = async () => {
    setLoading(true);
    await loadSummary();
    await loadLists();
    setLoading(false);
  };

  const subscribedCount = lists.subscribed.length;
  const unsubscribedCount = lists.unsubscribed.length;
  const totalUsers = subscribedCount + unsubscribedCount;
  const subscriptionRate = totalUsers > 0 ? ((subscribedCount / totalUsers) * 100).toFixed(1) : 0;

  const pieData = [
    { name: 'Subscribed', value: subscribedCount, color: '#10b981' },
    { name: 'Not Subscribed', value: unsubscribedCount, color: '#ef4444' }
  ];

  // Pagination logic
  const paginateData = (data, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data) => {
    return Math.ceil(data.length / itemsPerPage);
  };

  const generatePageNumbers = (currentPage, totalPages) => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Paginated data
  const paginatedSubscribed = paginateData(lists.subscribed, subscribedPage);
  const paginatedUnsubscribed = paginateData(lists.unsubscribed, unsubscribedPage);
  
  const subscribedTotalPages = getTotalPages(lists.subscribed);
  const unsubscribedTotalPages = getTotalPages(lists.unsubscribed);

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pageNumbers = generatePageNumbers(currentPage, totalPages);
    
    return (
      <div className="flex items-center justify-between mt-4 px-4">
        <div className="text-sm text-gray-600">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalPages * itemsPerPage)} to {Math.min(currentPage * itemsPerPage, totalPages * itemsPerPage)} of {totalPages * itemsPerPage} entries
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          
          {pageNumbers.map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2">...</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-1 border rounded ${
                  currentPage === page 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            )
          ))}
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Subscriptions Dashboard</h2>
        <button 
          onClick={refreshAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium opacity-90">Daily Revenue</div>
            <DollarSign className="w-5 h-5 opacity-75" />
          </div>
          <div className="text-3xl font-bold">₦{(summary.daily ?? 0).toLocaleString()}</div>
          <div className="text-xs opacity-75 mt-1">Last 24 hours</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium opacity-90">Weekly Revenue</div>
            <TrendingUp className="w-5 h-5 opacity-75" />
          </div>
          <div className="text-3xl font-bold">₦{(summary.weekly ?? 0).toLocaleString()}</div>
          <div className="text-xs opacity-75 mt-1">Last 7 days</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium opacity-90">Monthly Revenue</div>
            <DollarSign className="w-5 h-5 opacity-75" />
          </div>
          <div className="text-3xl font-bold">₦{(summary.monthly ?? 0).toLocaleString()}</div>
          <div className="text-xs opacity-75 mt-1">Last 30 days</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium opacity-90">Total Subscribers</div>
            <Users className="w-5 h-5 opacity-75" />
          </div>
          <div className="text-3xl font-bold">{subscribedCount}</div>
          <div className="text-xs opacity-75 mt-1">{subscriptionRate}% of users</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip 
                formatter={(value) => `₦${value.toLocaleString()}`}
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Revenue (₦)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription Count Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">New Subscribers (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip labelStyle={{ color: '#000' }} />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="New Subscribers" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">User Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Quick Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Total Users</span>
              <span className="font-bold text-xl">{totalUsers}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <span className="text-gray-600">Active Subscribers</span>
              <span className="font-bold text-xl text-green-600">{subscribedCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded">
              <span className="text-gray-600">Not Subscribed</span>
              <span className="font-bold text-xl text-red-600">{unsubscribedCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
              <span className="text-gray-600">Conversion Rate</span>
              <span className="font-bold text-xl text-blue-600">{subscriptionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Export Finance Reports</h3>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => exportCsv('daily')} 
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Daily Report
          </button>
          <button 
            onClick={() => exportCsv('weekly')} 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Weekly Report
          </button>
          <button 
            onClick={() => exportCsv('monthly')} 
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            <Download className="w-4 h-4" />
            Monthly Report
          </button>
          <button 
            onClick={() => exportCsv('yearly')} 
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            <Download className="w-4 h-4" />
            Yearly Report
          </button>
          <button 
            onClick={() => exportCsv('all')} 
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            <Download className="w-4 h-4" />
            All Time Report
          </button>
        </div>
      </div>

      {/* Subscribed Users Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Subscribed Users ({subscribedCount})
        </h3>
        {lists.subscribed.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No subscribers yet</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold">Username</th>
                    <th className="text-left p-3 font-semibold">Email</th>
                    <th className="text-left p-3 font-semibold">Amount</th>
                    <th className="text-left p-3 font-semibold">Subscribed At</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSubscribed.map(s => (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{s.user?.username || s.username}</td>
                      <td className="p-3 text-gray-600">{s.user?.email || s.email}</td>
                      <td className="p-3 font-semibold text-green-600">
                        ₦{(s.amount ?? 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-gray-500 text-sm">
                        {new Date(s.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {subscribedTotalPages > 1 && (
              <Pagination 
                currentPage={subscribedPage}
                totalPages={subscribedTotalPages}
                onPageChange={setSubscribedPage}
              />
            )}
          </>
        )}
      </div>

      {/* Not Subscribed Users */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Not Subscribed Users ({unsubscribedCount})
        </h3>
        {lists.unsubscribed.length === 0 ? (
          <div className="text-gray-500 text-center py-8">All users are subscribed! 🎉</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold">Username</th>
                    <th className="text-left p-3 font-semibold">Email</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUnsubscribed.map(u => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{u.username}</td>
                      <td className="p-3 text-gray-600">{u.email}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                          Inactive
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {unsubscribedTotalPages > 1 && (
              <Pagination 
                currentPage={unsubscribedPage}
                totalPages={unsubscribedTotalPages}
                onPageChange={setUnsubscribedPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}