import { useEffect } from 'react';
import ExploreView from './components/ExploreView';
import Home from './components/Home';
import TourView from './components/TourView';
import { tourById } from './data/tours';
import { href, useRoute } from './lib/router';
import { personalTour, usePersonalWalks } from './lib/profile';
import CommunityHub from './components/CommunityHub';

export default function App() {
  const route = useRoute();
  const [walks] = usePersonalWalks();

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (route.view === 'home' || route.view === 'profile') window.scrollTo(0, 0);
  }, [route.view]);

  if (route.view === 'profile') return <main className="mx-auto max-w-5xl px-5 py-8"><a className="font-semibold underline" href={href({ view: 'home' })}>← Home</a><h1 className="mt-6 font-display text-3xl font-semibold">My ArtWalk</h1><CommunityHub /></main>;
  if (route.view === 'tour') {
    const walk = walks.find((item) => item.id === route.tourId);
    const tour = tourById(route.tourId) ?? (walk ? personalTour(walk) : undefined);
    if (tour) return <TourView key={`${tour.id}:${walk?.updatedAt ?? ''}`} tour={tour} artId={route.art} />;
  }
  if (route.view === 'explore') return <ExploreView artId={route.art} />;
  return <Home />;
}
