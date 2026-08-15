import { Route, Routes } from 'react-router-dom'
import Shell from './components/Shell'
import Home from './routes/Home'
import Teams from './routes/Teams'
import Judging from './routes/Judging'
import Resources from './routes/Resources'
import Monitor from './routes/Monitor'
import People from './routes/People'
import Learning from './routes/Learning'
import Demos from './routes/Demos'
import Gallery from './routes/Gallery'
import Photos from './routes/Photos'
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
        <Route path="/people" element={<People />} />
        <Route path="/learning" element={<Learning />} />
        {/* Unlisted: the live submission monitor, kept for the record. */}
        <Route path="/monitor" element={<Monitor />} />
        {/* Unlisted, like /ops — shared by direct link, not in the nav. */}
        <Route path="/demos" element={<Demos />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/photos" element={<Photos />} />
        <Route path="/ops" element={<Ops />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Shell>
  )
}
