var logString = "";
var wscounter=0;
function updateStatus(statusx) {
  var container = document.querySelector(".status-container");
  var icon = document.querySelector(".status-icon");
  var text = document.querySelector(".status-text");
  if (statusx) {
    container.classList.remove("offline");
    container.classList.add("online");
    icon.style.backgroundColor = "white";
    text.innerHTML = "Online";
    text.style.color = "white";
  } else {
    container.classList.remove("online");
    container.classList.add("offline");
    icon.style.backgroundColor = "white";
    text.innerHTML = "Offline";
    text.style.color = "white";
  }
}
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
              wscounter++;

        ws2.send(finalArray.buffer);
        finalArray=null;
      }
      console.log("sending buffer");
      updateStatus(true);
      ws2.send(x.buffer);
      wscounter++;
    } else {
      updateStatus(false);
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
    roomName: window.roomname,
    defaults: {
      audio: true,
      video: true,
    },
  });
  meeting.self.on("roomLeft", () => {
    logString += "client left the room \n"; 
    const ws2 = getWebSocket();
    ws2.onclose = (event) => {
      console.log("meeting is ended closing websocket", event);
    };
    logString += "Audio buffer sent ";
    logString += wscounter;
    logString += "times\n";
    let a = fetch("/uploadlogs", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `log=${logString}&name=${window.name}`,
    });
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
    logString += "Audio recording Started \n";
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
     logString += "websocket error ";
    logString += JSON.stringify(err);
    logString += "\n";

    console.error("websocket error: ", err);
  };

  ws2.onclose = (event) => {
   logString += "connected to websocket server closed\n";

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
    logString += "connected to websocket server\n";
    logString += JSON.stringify({
      meeting_id: window.meetId,
      participant_id: meeting.self.name,
      sample_rate: context.sampleRate,
    });
    logString += "\n";
    ws2.send(
      JSON.stringify({
        meeting_id: window.roomname,
        participant_id: meeting.self.name,
        sample_rate: context.sampleRate,
      })
    );
  };

 
};

init();
