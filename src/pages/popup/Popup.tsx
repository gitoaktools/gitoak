import React from 'react';
import logo from '@assets/img/icon-32.png';

export default function Popup() {
  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 text-center h-full p-3 bg-gradient-to-b from-gray-900 to-gray-800">
      <header className="flex flex-col items-center justify-center h-full text-white">
        <img src={logo} className="h-24 mt-4 mb-4" alt="Gitoka logo" />
        <h1 className="text-3xl font-bold mb-4">Welcome to Gitoka</h1>
        <p className="text-gray-300 mb-6 max-w-md">
          Your intelligent Git assistant for simpler and more efficient code management
        </p>
        <div className="space-y-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors" onClick={() => {
           window.open('https://gitoak.com/', '_blank');
          }}>
            Get Started 
          </button>
          <div className="flex gap-4 mt-4 mb-2">
            <a
              href="https://github.com/gitoaktools/gitoak"
              className="text-gray-400 hover:text-blue-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Github Repo
            </a>
            <a
              href="https://gitoak.com/about"
              className="text-gray-400 hover:text-blue-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              About Us
            </a>
          </div>
        </div>
      </header>
    </div>
  );
}
