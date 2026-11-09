import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import LessonsPath from './pages/lessons/LessonsPath'
import LessonDetail from './pages/lessons/LessonDetail'
import Review from './pages/words/WordsHome'
import Flashcards from './pages/words/Flashcards'
import Spelling from './pages/words/Spelling'
import Listening from './pages/words/Listening'
import Choice from './pages/words/Choice'
import Match from './pages/words/Match'
import TrueFalse from './pages/words/TrueFalse'
import Learn from './pages/words/Learn'
import Test from './pages/words/Test'
import GrammarTopicPage from './pages/grammar/GrammarTopicPage'
import Exercises from './pages/grammar/Exercises'
import EditorHome from './pages/editor/EditorHome'
import WordEditor from './pages/editor/WordEditor'
import GrammarEditor from './pages/editor/GrammarEditor'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />

        <Route path="/lessons" element={<LessonsPath />} />
        <Route path="/lessons/:slug" element={<LessonDetail />} />

        <Route path="/review" element={<Review />} />
        <Route path="/words/flashcards" element={<Flashcards />} />
        <Route path="/words/spelling" element={<Spelling />} />
        <Route path="/words/listening" element={<Listening />} />
        <Route path="/words/choice" element={<Choice />} />
        <Route path="/words/match" element={<Match />} />
        <Route path="/words/truefalse" element={<TrueFalse />} />
        <Route path="/words/learn" element={<Learn />} />
        <Route path="/words/test" element={<Test />} />

        <Route path="/grammar/topic/:id" element={<GrammarTopicPage />} />
        <Route path="/grammar/exercises" element={<Exercises />} />

        <Route path="/editor" element={<EditorHome />} />
        <Route path="/editor/words" element={<WordEditor />} />
        <Route path="/editor/grammar" element={<GrammarEditor />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
