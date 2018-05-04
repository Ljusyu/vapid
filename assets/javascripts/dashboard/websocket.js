if ('WebSocket' in window) {
  const ws = new WebSocket('ws://localhost:3000/livereload');

  ws.onmessage = (evt) => {
    console.log(JSON.parse(evt.data));
  };
}