const MessageFormatter = ({ content }: { content: string }) => {
  const formatText = (text: string) => {
    return text.split('\n').map((paragraph, index) => {
      if (paragraph.startsWith('###')) {
        return (
          <h3 key={index} className="text-xl font-bold my-4 text-[#874487] dark:text-[#ff9b9b]">
            {paragraph.replace(/^###\s*/, '')}
          </h3>
        );
      }

      const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={index} className={index > 0 ? 'mt-4' : ''}>
          {parts.map((part, partIndex) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={partIndex} className="font-semibold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={partIndex}>{part}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <div className="prose dark:prose-invert max-w-none">
      {formatText(content)}
    </div>
  );
};

export default MessageFormatter;