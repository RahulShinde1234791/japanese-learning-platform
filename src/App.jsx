import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Hiragana from "./pages/Hiragana";
import Katakana from "./pages/Katakana";
import Kanji from "./pages/Kanji";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/hiragana" element={<Hiragana />} />
        <Route path="/katakana" element={<Katakana />} />
        <Route path="/kanji" element={<Kanji />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;