import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Hiragana from "./pages/Hiragana";
import Katakana from "./pages/Katakana";
import Kanji from "./pages/Kanji";
import Flashcards from "./pages/Flashcards";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/hiragana" element={<Hiragana />} />
        <Route path="/katakana" element={<Katakana />} />
        <Route path="/kanji" element={<Kanji />} />
        <Route path="/flashcards" element={<Flashcards />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;