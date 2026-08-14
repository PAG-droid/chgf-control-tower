import { Route, Routes } from 'react-router-dom'
import Shell from './components/Shell'
import Home from './routes/Home'
import Teams from './routes/Teams'
import Judging from './routes/Judging'
import Resources from './routes/Resources'
import Monitor from './routes/Monitor'
import Ops from './routes/Ops'
import NotFound from './routes/NotFound'

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/judging" element={<Judging />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/monitor" element={<Monitor />} />
        <Route path="/ops" element={<Ops />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Shell>
  )
}
