import { renderToStaticMarkup } from "react-dom/server";

// TODO: This is a temporary function to render the component to a string.
// We should use the render function from react-email instead.
// renderToPipeableStream is not defined error from react-email
export const render = (component: React.ReactNode) => {
  return renderToStaticMarkup(component);
};
