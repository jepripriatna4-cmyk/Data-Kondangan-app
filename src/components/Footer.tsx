import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer
      id="app-footer"
      className="w-full mt-auto py-5 border-t border-blue-900/40 bg-[#040919]/90 backdrop-blur-md"
    >
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-800/40 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
          <span className="text-xs sm:text-sm font-semibold text-blue-200 tracking-wide">
            Created By: FAISAL ADI PRITANA
          </span>
        </div>
      </div>
    </footer>
  );
};
