import { useEffect } from 'react';
import ExploreView from './components/ExploreView';
import Home from './components/Home';
import TourView from './components/TourView';
import { tourById } from './data/tours';
import { useRoute } from './lib/router';
import { LanguageProvider } from './lib/language';

export default function App() {
  const route = useRoute();

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (route.view === 'home') window.scrollTo(0, 0);
  }, [route.view]);

  return <LanguageProvider>
    {route.view === 'tour' && tourById(route.tourId) ? <TourView tour={tourById(route.tourId)!} artId={route.art} /> : route.view === 'explore' ? <ExploreView artId={route.art} /> : <Home />}
  </LanguageProvider>;
}
