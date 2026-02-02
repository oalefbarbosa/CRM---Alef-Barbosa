
import React, { useState, useEffect } from 'react';
import { formatCurrency, formatNumber } from '../utils/formatters';
import * as Icons from './Icons';

interface EditableCellProps {
  value: number;
  onSave: (newValue: number) => void;
  format: 'number' | 'currency';
}

const EditableCell: React.FC<EditableCellProps> = ({ value, onSave, format }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleSave = () => {
    if (currentValue !== value) {
        onSave(Number(currentValue));
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1500);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        value={currentValue}
        onChange={(e) => setCurrentValue(Number(e.target.value))}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-24 bg-background border border-brand-blue rounded-md px-2 py-1 text-right font-mono text-sm shadow-lg"
      />
    );
  }

  return (
    <div 
        onClick={() => setIsEditing(true)} 
        className="cursor-pointer w-full text-right hover:bg-bg-subtle p-1 rounded-md transition-colors relative group"
    >
      {showSuccess && <Icons.CheckCircle className="h-4 w-4 text-brand-green absolute -left-1 top-1/2 -translate-y-1/2" />}
      {format === 'currency' ? formatCurrency(value) : formatNumber(value)}
      <Icons.FileText className="h-3 w-3 text-text-secondary opacity-0 group-hover:opacity-100 absolute right-1 top-1/2 -translate-y-1/2 transition-opacity" />
    </div>
  );
};

export default EditableCell;
