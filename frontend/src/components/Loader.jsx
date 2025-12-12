import React from 'react';

const Loader = ({ size = 'medium', fullScreen = false }) => {
  const sizeClasses = {
    small: 'loader-small',
    medium: 'loader-medium',
    large: 'loader-large',
  };

  if (fullScreen) {
    return (
      <div className="loader-fullscreen">
        <div className={`loader ${sizeClasses[size]}`}></div>
        <p>Loading...</p>
      </div>
    );
  }

  return <div className={`loader ${sizeClasses[size]}`}></div>;
};

export default Loader;
