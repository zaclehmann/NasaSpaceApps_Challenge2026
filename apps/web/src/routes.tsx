// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
import { createBrowserRouter } from "react-router-dom";
import { useAstronaut } from "./data/DataProvider";
import CrewOverview from "./pages/CrewOverview";
import CrewPicker from "./pages/CrewPicker";
import Kit from "./pages/Kit";
import Learn from "./pages/Learn";
import Methodology from "./pages/Methodology";
import MyHealth from "./pages/MyHealth";

/** No login: the crew picker shows until someone is chosen, then My Health opens. */
function Home() {
  const astronaut = useAstronaut();
  return astronaut ? <MyHealth key={astronaut.id} /> : <CrewPicker />;
}

export const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/crew", element: <CrewOverview /> },
  { path: "/learn", element: <Learn /> },
  { path: "/methodology", element: <Methodology /> },
  // The component kit is a review aid. It is only served while developing.
  ...(import.meta.env.DEV ? [{ path: "/kit", element: <Kit /> }] : []),
]);
