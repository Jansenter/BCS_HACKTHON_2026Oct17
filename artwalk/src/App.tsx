import { useEffect } from 'react';
import ExploreView from './components/ExploreView';
import Home from './components/Home';
import TourView from './components/TourView';
import { tourById } from './data/tours';
import { useRoute } from './lib/router';

export default function App() {
  const route = useRoute();

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (route.view === 'home') window.scrollTo(0, 0);
  }, [route.view]);

  if (route.view === 'tour') {
    const tour = tourById(route.tourId);
    if (tour) return <TourView tour={tour} artId={route.art} />;
  }
  if (route.view === 'explore') return <ExploreView artId={route.art} />;
  return <Home />;
}
