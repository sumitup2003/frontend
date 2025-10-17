import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, Calendar, AlertCircle } from 'lucide-react';
import Button from '../common/Button';

const VerificationPanel = ({ onBack }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/verification/admin/requests?status=${filter}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
        credentials: 'include'
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      const contentType = response.headers.get("content-type");
       if (!contentType || !contentType.includes("application/json")) {
         const text = await response.text();
         console.error("❌ Non-JSON response:", text);
         throw new Error(
           "Server returned non-JSON response. Check server logs."
         );
       }

      const data = await response.json();

      console.log('📥 API Response:', data); // DEBUG

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch requests');
      }

      // Handle both data.data and direct data array
      const requestsData = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      console.log('📋 Processed Requests:', requestsData); // DEBUG
      
      setRequests(requestsData);
    } catch (err) {
      console.error('❌ Error fetching requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this verification request?`)) {
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/verification/admin/review/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process request');
      }

      // Refresh the list
      await fetchRequests();
      setSelectedRequest(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };

    const icons = {
      pending: <Clock size={14} />,
      approved: <CheckCircle size={14} />,
      rejected: <XCircle size={14} />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedRequest) {
    const request = selectedRequest.verificationRequest || {};
    const userName = selectedRequest.name || selectedRequest.user?.name || 'Unknown User';
    const userUsername = selectedRequest.username || selectedRequest.user?.username || 'unknown';
    const userAvatar = selectedRequest.avatar || selectedRequest.user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
    
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedRequest(null)}
          className="text-blue-600 dark:text-blue-400 text-sm hover:underline mb-4"
        >
          ← Back to List
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <img
                src={userAvatar}
                alt={userName}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
                }}
              />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {userName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  @{userUsername}
                </p>
              </div>
            </div>
            {getStatusBadge(request.status || 'pending')}
          </div>

          <div className="space-y-4">
            {request.category && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <p className="text-gray-900 dark:text-white mt-1">
                  {request.category}
                </p>
              </div>
            )}

            {request.reason && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
                <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
                  {request.reason}
                </p>
              </div>
            )}

            {request.socialLinks && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Social Links</label>
                <p className="text-blue-600 dark:text-blue-400 mt-1 break-all">
                  {request.socialLinks}
                </p>
              </div>
            )}

            {request.additionalInfo && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Additional Info</label>
                <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
                  {request.additionalInfo}
                </p>
              </div>
            )}

            {request.requestedAt && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar size={16} />
                <span>Requested: {formatDate(request.requestedAt)}</span>
              </div>
            )}

            {request.status === 'pending' && (
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => handleAction(selectedRequest._id, 'approve')}
                  loading={actionLoading}
                  className="flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Approve
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => handleAction(selectedRequest._id, 'reject')}
                  loading={actionLoading}
                  className="flex items-center justify-center gap-2"
                >
                  <XCircle size={18} />
                  Reject
                </Button>
              </div>
            )}

            {request.status !== 'pending' && request.reviewedAt && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Reviewed: {formatDate(request.reviewedAt)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-blue-600 dark:text-blue-400 text-sm hover:underline mb-4"
      >
        ← Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Verification Requests
        </h3>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {['pending', 'approved', 'rejected', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8">
          <User size={48} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500 dark:text-gray-400">
            No {filter !== 'all' ? filter : ''} requests found
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            // Handle different possible data structures
            const verificationReq = request.verificationRequest || {};
            const userName = request.name || request.user?.name || 'Unknown User';
            const userUsername = request.username || request.user?.username || 'unknown';
            const userAvatar = request.avatar || request.user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
            
            console.log('🔍 Request item:', request); // DEBUG
            
            return (
              <div
                key={request._id}
                onClick={() => setSelectedRequest(request)}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {userName}
                        </h4>
                        {getStatusBadge(verificationReq.status || 'pending')}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        @{userUsername} {verificationReq.category && `• ${verificationReq.category}`}
                      </p>
                      {verificationReq.requestedAt && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatDate(verificationReq.requestedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VerificationPanel;