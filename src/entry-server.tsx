import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { AppProviders } from "./AppProviders";
import App from "./App";

export function render(url: string): string {
  return renderToString(
    <AppProviders>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </AppProviders>
  );
}
