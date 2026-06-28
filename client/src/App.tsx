import { useState, useEffect } from 'react';
import DesignSystemPreview from './DesignSystemPreview';
import './App.css';

const useHash = () => {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const handler = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return hash;
};

const App = () => {
  const hash = useHash();

  if (hash === '#design-preview') {
    return <DesignSystemPreview />;
  }

  return (
    <div className="content">
      <h1>Rsbuild with React</h1>
      <p>Start building amazing things with Rsbuild.</p>
    </div>
  );
};

export default App;
