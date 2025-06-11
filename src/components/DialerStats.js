import React, { useState, useEffect } from 'react';
import { getDialerStats } from '../api/leads';

function DialerStats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getDialerStats();
        const formattedStats = data.map(stat => ({
          label: stat.dialerAssignment,
          total: stat.count,
          pending: stat.pendingCount,
          percentage: ((stat.pendingCount / stat.count) * 100).toFixed(1)
        }));
        setStats(formattedStats);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dialer stats:', error);
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dialer-stats">
      <h2>Dialer Assignment Statistics</h2>
      <table>
        <thead>
          <tr>
            <th>Assignment</th>
            <th>Total</th>
            <th>Pending</th>
            <th>Percentage Pending</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((stat, index) => (
            <tr key={index}>
              <td>{stat.label}</td>
              <td>{stat.total}</td>
              <td>{stat.pending}</td>
              <td>{stat.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DialerStats; 