let ws;
function getWebSocket() {
  return ws;
}
function setWebSocket(newWS) {
  ws = newWS;
}
async function recordMeeting(track) {
  var context = new AudioContext({
    latencyHint: "interactive",
  });

  await context.audioWorklet.addModule("google-processor.js");
  context.resume();

  var globalStream = new MediaStream();
  globalStream.addTrack(track);

  var input = context.createMediaStreamSource(globalStream);
  var processor = new window.AudioWorkletNode(context, "recorder.worklet");
  processor.connect(context.destination);
  context.resume();
  input.connect(processor);

  processor.port.onmessage = (e) => {
    const audioData = e.data;
    const ws2 = getWebSocket();
    const a = [1, 2, 4];
    if ((ws2 == null ? void 0 : ws2.readyState) === WebSocket.OPEN) {
      ws2.send(e.data);
    } else {
      console.log("error", ws2.readyState);
    }
  };
}
const init = async () => {
  const meeting = await DyteClient.init({
    authToken: window.authtoken,
    roomName: window.roomname,
    defaults: {
      audio: true,
      video: true,
    },
  });

  document.getElementById("my-meeting").meeting = meeting;
  const ws2 = new WebSocket("wss://transcribe-api.bhasa.io/ws/record");
  setWebSocket(ws2);
  console.log("websocket assigned");
  ws2.onmessage = async (event) => {
    console.log("data is arrived", event);
  };
  ws2.onerror = (err) => {
    console.error("websocket error: ", err);
  };
  ws2.onclose = () => {
    console.info("Connection to websocket closed");
  };
  ws2.onopen = () => {
    console.log("connecyion is open");
    ws2.send(
      JSON.stringify({
        meeting_id: window.roomname,
        participant_id: meeting.self.name,
      })
    );
  };
  recordMeeting(meeting.self.audioTrack);
};

init();
