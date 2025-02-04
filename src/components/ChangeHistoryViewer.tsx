import React from 'react';
import { ChangeHistory } from '../types';
import { Clock, Edit, Trash, Plus } from 'lucide-react';

// ChangeHistoryViewer component that displays a list of changes with details and revert button
// Found in the entity details page to show the history of changes made to the entity 
interface ChangeHistoryViewerProps {
  history: ChangeHistory[];
  onRevert?: (change: ChangeHistory) => void;
}

export const ChangeHistoryViewer: React.FC<ChangeHistoryViewerProps> = ({
  history,
  onRevert
}) => {
  const getChangeIcon = (type: ChangeHistory['changeType']) => {
    switch (type) {
      case 'create': return <Plus className="w-4 h-4 text-green-400" />;
      case 'update': return <Edit className="w-4 h-4 text-blue-400" />;
      case 'delete': return <Trash className="w-4 h-4 text-red-400" />;
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-4">
      {history.map((change) => (
        <div
          key={change.id}
          className="p-4 bg-white/5 rounded-lg border border-white/10"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {getChangeIcon(change.changeType)}
              <span className="text-white font-medium">
                {change.changeType.charAt(0).toUpperCase() + change.changeType.slice(1)}
              </span>
              <span className="text-white/60">
                {change.entityType}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Clock className="w-4 h-4" />
              {formatDate(change.timestamp)}
            </div>
          </div>

          {/* Changes Details */}
          {Object.entries(change.changes).map(([key, value]) => (
            <div key={key} className="grid grid-cols-3 gap-4 text-sm py-1">
              <span className="text-white/60">{key}</span>
              <div className="col-span-2">
                <span className="text-red-400">- {JSON.stringify(value.old ?? 'undefined')}</span>
                <br />
                <span className="text-green-400">+ {JSON.stringify(value.new ?? 'undefined')}</span>
              </div>
            </div>
          ))}

          {onRevert && (
            <button
              onClick={() => onRevert(change)}
              className="mt-3 text-sm text-blue-400 hover:text-blue-300"
            >
              Revert this change
            </button>
          )}
        </div>
      ))}
    </div>
  );
};