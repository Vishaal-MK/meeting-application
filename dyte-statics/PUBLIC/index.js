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

    alert(`Your Network Latency is ${end - start}ms`);
  });
}
var bf_array = new Int16Array();
var offset = 0;
var finalArray;
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
    let x = floatTo16BitPCM(e.data);
    if ((ws2 == null ? void 0 : ws2.readyState) === WebSocket.OPEN) {
      if(finalArray != undefined && finalArray.byteLength >0 ){
        console.log("sending previous buffer")
        ws2.send(finalArray.buffer);
        finalArray=null;
      }
      console.log("sending buffer");
      ws2.send(x.buffer);
    } else {
      if (finalArray == undefined) {
        finalArray = x;
        offset = x.byteLength;
      } else {
        finalArray.set(x, offset);
        offset += x.byteLength;
      }
    }
  };
}
const init = async () => {
  const meeting = await DyteClient.init({
    authToken: window.authtoken,
    defaults: {
      audio: true,
      video: true,
    },
  });
  meeting.self.on("roomLeft", () => {
    const ws2 = getWebSocket();
    ws2.onclose = (event) => {
      console.log("meeting is ended closing websocket", event);
    };
    ws2.close();
  });
  meeting.self.on("roomJoined", () => {
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
      })
      .then((stream) => {
        console.log("stream is started by our self");
        let mytracks = stream.getAudioTracks();
        if (mytracks.length == 0) console.log("track is empty");
        // recordMeeting(mytracks[0]);
      })
      .catch((err) => {
        /* handle the error */
      });

    recordMeeting(meeting.self.audioTrack);
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

  ws2.onclose = (event) => {
    console.log("meeting is ended closing websocket", event);
    if (event != null && event != undefined) {
      if (event.code != 1000) {
        window.location.reload();
        
      } else {
        console.log("event code is ", event.code);
      }
    } else {
      console.log("event is null");
    }
  };
  var x = ws2.onclose;
  console.log(x);
  ws2.onopen = () => {
    ws2.send(
      JSON.stringify({
        meeting_id: window.roomname,
        participant_id: meeting.self.name,
        sample_rate: context.sampleRate,
      })
    );
  };

  // recordMeeting(meeting.self.rawAudioTrack);
};

init();
