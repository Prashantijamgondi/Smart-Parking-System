import React from 'react';

const HistoryTable = ({ history }) => {
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="table-container">
      <table className="history-table">
        <thead>
          <tr>
            <th>Slot</th>
            <th>Vehicle Number</th>
            <th>Entry Time</th>
            <th>Exit Time</th>
            <th>Duration</th>
            <th>Amount (₹)</th>
            <th>Email</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {history.length === 0 ? (
            <tr>
              <td colSpan="8" className="no-data">
                No parking history found
              </td>
            </tr>
          ) : (
            history.map((record) => (
              <tr key={record.id}>
                <td>{record.slot_id}</td>
                <td>{record.vehicle_number}</td>
                <td>{formatDate(record.entry_time)}</td>
                <td>{formatDate(record.exit_time)}</td>
                <td>{formatDuration(record.duration_minutes)}</td>
                <td>₹{record.total_amount.toFixed(2)}</td>
                <td>{record.user_email}</td>
                <td>{record.user_phone}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default HistoryTable;
