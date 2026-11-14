// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
import { useEffect, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";
import { useAstronaut } from "./data/DataProvider";
import CrewOverview from "./pages/CrewOverview";
import CrewPicker from "./pages/CrewPicker";
import Kit from "./pages/Kit";
import Learn from "./pages/Learn";
import Methodology from "./pages/Methodology";
import MyHealth from "./pages/MyHealth";
import NotFound from "./pages/NotFound";

/** The browser tab's title. The page header text stays as it is. */
function Titled({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} · MissionVitals`;
  }, [title]);
  return children;
}

/** No login: the crew picker shows until someone is chosen, then My Health opens. */
function Home() {
  const astronaut = useAstronaut();
  return astronaut ? (
    <Titled title="My health">
      <MyHealth key={astronaut.id} />
    </Titled>
  ) : (
    <Titled title="Who's checking in?">
      <CrewPicker />
    </Titled>
  );
}

export const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  {
    path: "/crew",
    element: (
      <Titled title="Crew">
        <CrewOverview />
      </Titled>
    ),
  },
  {
    path: "/learn",
    element: (
      <Titled title="Learn">
        <Learn />
      </Titled>
    ),
  },
  {
    path: "/methodology",
    element: (
      <Titled title="Methodology">
        <Methodology />
      </Titled>
    ),
  },
  // The component kit is a review aid. It is only served while developing.
  ...(import.meta.env.DEV ? [{ path: "/kit", element: <Kit /> }] : []),
  {
    path: "*",
    element: (
      <Titled title="Page not found">
        <NotFound />
      </Titled>
    ),
  },
]);
