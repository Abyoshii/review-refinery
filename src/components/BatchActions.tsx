
import React from 'react';
import { BatchAction } from '@/lib/types';
import { MessageSquareText, Wand2, Send, X } from 'lucide-react';

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
    <div className="bg-blue-50 p-4 rounded-lg mb-4 flex flex-wrap items-center gap-3 dark:bg-blue-900/20 transition-colors">
      <span className="font-medium text-blue-700 mr-2 dark:text-blue-400">
        Выбрано отзывов: {selectedCount}
      </span>
      <div className="flex flex-wrap gap-2">
        <button
          className="px-3 py-1.5 bg-white text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-gray-700"
          onClick={() => onAction('template')}
          disabled={disabled}
        >
          <div className="flex items-center gap-1">
            <MessageSquareText className="h-4 w-4" />
            Ответить шаблоном
          </div>
        </button>
        <button
          className="px-3 py-1.5 bg-white text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-gray-700"
          onClick={() => onAction('generate')}
          disabled={disabled}
        >
          <div className="flex items-center gap-1">
            <Wand2 className="h-4 w-4" />
            Сгенерировать ответы (ИИ)
          </div>
        </button>
        <button
          className="px-3 py-1.5 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
          onClick={() => onAction('send')}
          disabled={disabled}
        >
          <div className="flex items-center gap-1">
            <Send className="h-4 w-4" />
            Отправить выбранные ответы
          </div>
        </button>
        <button
          className="px-3 py-1.5 bg-white text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700"
          onClick={() => onAction('deselect')}
        >
          <div className="flex items-center gap-1">
            <X className="h-4 w-4" />
            Снять выделение
          </div>
        </button>
      </div>
    </div>
  );
};

export default BatchActions;
