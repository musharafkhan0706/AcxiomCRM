import React from 'react';
import { AuditLog } from '../../types';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/cn';

interface AuditDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: AuditLog | null;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({ isOpen, onClose, audit }) => {
  if (!audit) return null;

  const formatJson = (jsonStr?: string) => {
    if (!jsonStr) return 'None';
    try {
      const parsed = JSON.parse(jsonStr);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonStr;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Audit Inspection: ${audit.action} on ${audit.entityName}`}
      size="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Metadata summary grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div>
            <span className="text-gray-500 block font-medium">Actor</span>
            <span className="font-bold text-gray-900">{audit.username || 'System'}</span>
          </div>
          <div>
            <span className="text-gray-500 block font-medium">Record ID</span>
            <span className="font-bold text-gray-900">{audit.recordId || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-500 block font-medium">Status</span>
            <span
              className={`font-bold ${audit.result === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              {audit.result}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block font-medium">Timestamp</span>
            <span className="font-semibold text-gray-700">{formatDate(audit.timestamp)}</span>
          </div>
        </div>

        {audit.details && (
          <div>
            <label className="font-semibold text-gray-700 block mb-1">Audit Log Description</label>
            <p className="p-2.5 bg-gray-50 rounded border border-gray-100 text-gray-800">
              {audit.details}
            </p>
          </div>
        )}

        {/* Diff view */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-gray-700 block mb-1">Previous State (Old Value)</label>
            <pre className="p-3 bg-gray-900 text-rose-300 rounded-lg overflow-x-auto text-[11px] font-mono max-h-64">
              {formatJson(audit.oldValue)}
            </pre>
          </div>

          <div>
            <label className="font-semibold text-gray-700 block mb-1">Updated State (New Value)</label>
            <pre className="p-3 bg-gray-900 text-emerald-300 rounded-lg overflow-x-auto text-[11px] font-mono max-h-64">
              {formatJson(audit.newValue)}
            </pre>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Close Inspection
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AuditDetailModal;

