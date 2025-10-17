import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw } from 'lucide-react';

const HeadlinesSection = () => {
  const [headlines, setHeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHeadlines = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      // Fetch from your backend API
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/news/headlines?country=us&pageSize=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch headlines');
      }
      
      const data = await response.json();
      setHeadlines(data.data || []);
    } catch (err) {
      console.error('Error fetching headlines:', err);
      setError('Failed to load headlines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeadlines();
  }, []);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="text-blue-500" size={24} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Latest Headlines
          </h2>
        </div>
        <button
          onClick={fetchHeadlines}
          disabled={loading}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          title="Refresh headlines"
        >
          <RefreshCw 
            size={20} 
            className={`text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} 
          />
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-4 text-red-500 dark:text-red-400">
          <p>{error}</p>
          <button
            onClick={fetchHeadlines}
            className="mt-2 text-sm text-blue-500 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          ))}
        </div>
      )}

      {/* Headlines List */}
      {!loading && !error && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {headlines.map((article, index) => (
            <a
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="flex gap-3">
                {/* Image */}
                {article.urlToImage && (
                  <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <img
                      src={article.urlToImage}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mt-1">
                      {article.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {article.source.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {formatTime(article.publishedAt)}
                      </span>
                      <ExternalLink size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && headlines.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Newspaper size={48} className="mx-auto mb-2 opacity-50" />
          <p>No headlines available</p>
        </div>
      )}
    </div>
  );
};

export default HeadlinesSection;
