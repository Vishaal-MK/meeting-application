function floatTo16BitPCM(input) {
  let output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    let s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}
const alert = (message, type) => {
  const alertPlaceholder = document.getElementById("divx");
  const wrapper = document.createElement("div");
  wrapper.innerHTML = [
    `<div class="alert alert-success alert-dismissible" role="alert">`,
    `   <div>${message}</div>`,
    '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
    "</div>",
  ].join("");

  alertPlaceholder.append(wrapper);
};
let ws;
function getWebSocket() {
  return ws;
}
function setWebSocket(newWS) {
  ws = newWS;
}
var context;
function checklatency() {
  let ax = [];
  for (let a = 0; a < 8192; a++) {
    ax.push("a");
  }
  let s = ax.join("");
  var start = new Date().getTime();
  let a = fetch("/checklat", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `b=${s}`,
  });
  a.then((response) => {
    var end = new Date().getTime();

     alert(`Your Network Latency is ${end-start}ms`);
  });
}
async function recordMeeting(track) {
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
      let x = floatTo16BitPCM(e.data);
      ws2.send(x.buffer);
    } else {
      // console.log("error", ws2.readyState);
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
  context = new AudioContext({
    latencyHint: "interactive",
  });
  const ws2 = new WebSocket("wss://transcribe-api.bhasa.io/ws/record");
  setWebSocket(ws2);

  ws2.onmessage = async (event) => {};
  ws2.onerror = (err) => {
    console.error("websocket error: ", err);
  };
  ws2.onclose = () => {
    console.info("Connection to websocket closed");
  };
  ws2.onopen = () => {
    ws2.send(
      JSON.stringify({
        meeting_id: window.roomname,
        participant_id: meeting.self.name,
        sample_rate: context.sampleRate,
      })
    );
  };

  recordMeeting(meeting.self.rawAudioTrack);
};

init();

checklatency();
