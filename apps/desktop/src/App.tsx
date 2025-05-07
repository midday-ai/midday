import "./App.css";

function App() {
  return (
    <div className="w-screen h-screen bg-transparent">
      {/* Optional: translucent custom header */}
      {/* <div
        data-tauri-drag-region
        className="h-8 flex items-center gap-2 pl-3 pt-2 backdrop-blur bg-white/20 absolute top-0 left-0 w-full z-10"
      >
        <div
          className="w-3 h-3 bg-red-500 rounded-full"
          onClick={() => window.__TAURI__.window.appWindow.close()}
        />
        <div
          className="w-3 h-3 bg-yellow-400 rounded-full"
          onClick={() => window.__TAURI__.window.appWindow.minimize()}
        />
        <div
          className="w-3 h-3 bg-green-500 rounded-full"
          onClick={() => window.__TAURI__.window.appWindow.toggleMaximize()}
        />
      </div> */}

      {/* Fullscreen iframe */}
      <iframe
        src="http://localhost:3001"
        className="w-full h-full absolute top-0 left-0 border-none"
        title="Midday"
      />
    </div>
  );
}

export default App;
