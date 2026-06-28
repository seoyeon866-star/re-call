import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import SearchResult from './pages/SearchResult';
import ProductDetail from './pages/ProductDetail';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0) }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResult />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/recall/:id" element={<ProductDetail />} />
      </Routes>
    </>
  );
}
