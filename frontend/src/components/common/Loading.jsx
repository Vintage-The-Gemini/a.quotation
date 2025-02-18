import React from "react";

const Loading = ({ fullScreen = false }) => {
  const baseClasses = "flex items-center justify-center";
  const fullScreenClasses = fullScreen ? "min-h-screen" : "min-h-[200px]";

  return (
    <div className={`${baseClasses} ${fullScreenClasses}`}>
      <div className="relative">
        <div className="animate-spin h-10 w-10 border-4 border-gray-200 dark:border-gray-700 rounded-full border-t-blue-500 dark:border-t-blue-400"></div>
        <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
          Loading...
        </div>
      </div>
    </div>
  );
};

export default Loading;
