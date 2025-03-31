
import React from 'react';
import { BatchAction } from '@/lib/types';

interface BatchActionsProps {
  selectedCount: number;
  onAction: (action: BatchAction) => void;
  disabled?: boolean;
}

const BatchActions: React.FC<BatchActionsProps> = ({ 
  selectedCount, 
  onAction,
  disabled = false
}) => {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 p-4 rounded-lg mb-4 flex flex-wrap items-center gap-3">
      <span className="font-medium text-blue-700 mr-2">
        Выбрано отзывов: {selectedCount}
      </span>
      <div className="flex flex-wrap gap-2">
        <button
          className="px-3 py-1.5 bg-white text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
          onClick={() => onAction('template')}
          disabled={disabled}
        >
          Ответить шаблоном
        </button>
        <button
          className="px-3 py-1.5 bg-white text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
          onClick={() => onAction('generate')}
          disabled={disabled}
        >
          Сгенерировать ответы (ИИ)
        </button>
        <button
          className="px-3 py-1.5 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          onClick={() => onAction('send')}
          disabled={disabled}
        >
          Отправить выбранные ответы
        </button>
        <button
          className="px-3 py-1.5 bg-white text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          onClick={() => onAction('deselect')}
        >
          Снять выделение
        </button>
      </div>
    </div>
  );
};

export default BatchActions;
