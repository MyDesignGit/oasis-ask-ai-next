import React, { useState } from 'react';

interface FormData {
  name: string;
  phone: string;
  email: string;
  gender: string;
  location: string;
}

interface ChatIntakeFormProps {
  onComplete: (data: FormData) => void;
}

const ChatIntakeForm: React.FC<ChatIntakeFormProps> = ({ onComplete }) => {
  const [currentField, setCurrentField] = useState('name');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    gender: '',
    location: ''
  });
  const [currentInput, setCurrentInput] = useState('');

  const fields = [
    { id: 'name', label: 'name', type: 'text', placeholder: 'Enter your full name' },
    { id: 'phone', label: 'phone number', type: 'tel', placeholder: 'Enter your phone number' },
    { id: 'email', label: 'email', type: 'email', placeholder: 'Enter your email address' },
    { id: 'gender', label: 'gender', type: 'select', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    { id: 'location', label: 'location', type: 'text', placeholder: 'Enter your city' }
  ];

  const handleSubmit = () => {
    if (!currentInput.trim()) return;

    const updatedFormData = {
      ...formData,
      [currentField]: currentInput
    };
    setFormData(updatedFormData);
    setCurrentInput('');

    const currentIndex = fields.findIndex(f => f.id === currentField);
    if (currentIndex < fields.length - 1) {
      setCurrentField(fields[currentIndex + 1].id);
    } else {
      onComplete(updatedFormData);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const currentFieldData = fields.find(f => f.id === currentField);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {Object.entries(formData).map(([field, value]) => (
        value && (
          <div key={field} className="flex justify-end mb-4">
            <div className="bg-[#874487] text-white rounded-lg p-3 max-w-[80%]">
              {value}
            </div>
          </div>
        )
      ))}
      
      <div className="flex justify-start mb-4">
        <div className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg p-3 max-w-[80%]">
          Please provide your {currentFieldData?.label}:
        </div>
      </div>

      <div className="relative">
        {currentFieldData?.type === 'select' ? (
          <select
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
              focus:border-[#874487] dark:focus:border-[#ff9b9b] outline-none"
          >
            <option value="">Select your gender</option>
            {currentFieldData.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input
            type={currentFieldData?.type}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={currentFieldData?.placeholder}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
              placeholder-gray-500 dark:placeholder-gray-400
              focus:border-[#874487] dark:focus:border-[#ff9b9b] outline-none"
          />
        )}
        <button
          onClick={handleSubmit}
          disabled={!currentInput.trim()}
          className={`absolute right-4 top-1/2 -translate-y-1/2 ${
            !currentInput.trim() 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-[#874487] dark:text-[#ff9b9b] hover:opacity-80'
          } transition-opacity`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatIntakeForm;