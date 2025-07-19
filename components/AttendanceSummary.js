import React from 'react';

const AttendanceSummary = ({ attendanceRecords }) => {
  const today = new Date().toDateString();
  
  const todayRecords = attendanceRecords.filter(record => 
    new Date(record.timestamp).toDateString() === today
  );

  const totalToday = todayRecords.length;
  const successfulToday = todayRecords.filter(record => record.success).length;
  const failedToday = totalToday - successfulToday;
  
  const uniqueUsersToday = new Set(
    todayRecords.filter(record => record.success).map(record => record.userEmail)
  ).size;

  const averageConfidence = todayRecords.length > 0 
    ? Math.round(todayRecords.reduce((sum, record) => sum + record.confidence, 0) / todayRecords.length)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">📈 Today's Attendance Summary</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{totalToday}</div>
          <div className="text-sm text-blue-700">Total Attempts</div>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{successfulToday}</div>
          <div className="text-sm text-green-700">Successful</div>
        </div>
        
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{failedToday}</div>
          <div className="text-sm text-red-700">Failed</div>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{uniqueUsersToday}</div>
          <div className="text-sm text-purple-700">Unique Users</div>
        </div>
      </div>

      {totalToday > 0 && (
        <div className="mt-4 text-center">
          <p className="text-gray-600">
            Average Confidence: <span className="font-medium">{averageConfidence}%</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendanceSummary; 