import React from 'react';

const WelcomeSection = ({ 
  username, 
  onPromptClick 
}: { 
  username: string; 
  onPromptClick: (prompt: string) => void;
}) => {
  const predefinedPrompts = [
    'IVF myths debunked',
    'AMH test results',
    'Low sperm count',
    'IVF success rates',
    'Medical tests before IVF'
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-6xl font-bold mb-6 text-center">
        <span className="text-[#874487]">Hello, </span>
        <span className="bg-gradient-to-r from-pink-400 via-pink-300 to-orange-400 text-transparent bg-clip-text">
          {username || 'there'}
        </span>
      </h1>
      
      <h2 className="text-xl text-gray-600 dark:text-gray-300 mb-16 text-center">
        You are in the good hands of science.
      </h2>
      
      <div className="flex flex-wrap justify-center gap-4 w-full max-w-2xl">
        {predefinedPrompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onPromptClick(prompt)}
            className="px-6 py-3 rounded-full bg-[#F8F9FE] hover:bg-[#F0F2FC] 
              text-gray-700 text-sm
              transition-all duration-200
              border border-gray-100 hover:border-gray-200"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WelcomeSection;