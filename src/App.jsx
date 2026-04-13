import { createBrowserRouter, RouterProvider } from "react-router";
import {
  ErrorPage,
  Funding,
  Home,
  Layout,
  PnL,
  Risk,
  WhaleFeed,
} from "./pages";

const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "risk", element: <Risk /> },
      { path: "pnl", element: <PnL /> },
      { path: "whale-feed", element: <WhaleFeed /> },
      { path: "funding", element: <Funding /> },

      { path: "*", element: <ErrorPage /> },
    ],
  },
];

const router = createBrowserRouter(routes);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
