
let ws;
let transcriptions = [];
function getWebSocket() {
  return ws;
}
function setWebSocket(newWS) {
  ws = newWS;
}
function getTranscriptions$1() {
  return transcriptions;
}
function setTranscriptions(newTranscriptions) {
  transcriptions = newTranscriptions;
}
function setPeerIdForSymblId(symblId, peerId) {
}
let listernerParam;
const broadcastedMessageCB = async ({ payload, type }) => {
  if (type === "audioTranscriptionMessage") {
    console.log("brodcast message called", payload);
    let filteredTranscriptions = [];
    getTranscriptions$1().forEach((transcription) => {
      const shouldKeep = transcription.peerId !== payload.peerId || transcription.peerId === payload.peerId && !transcription.isPartialTranscript;
      if (shouldKeep) {
        filteredTranscriptions.push(transcription);
      }
    });
    filteredTranscriptions.push(payload);
    filteredTranscriptions = filteredTranscriptions.slice(-1 * listernerParam.noOfTranscriptionsToCache);
    setTranscriptions(filteredTranscriptions);
    listernerParam == null ? void 0 : listernerParam.transcriptionsCallback(filteredTranscriptions);
  }
};
async function addTranscriptionsListener(param) {
  listernerParam = param;
  param.meeting.participants.on("broadcastedMessage", broadcastedMessageCB);
}
async function removeTranscriptionsListener$1({
  meeting
}) {
  try {
    meeting.participants.removeListener("broadcastedMessage", broadcastedMessageCB);
  } catch (ex) {
    console.error("Failed to close Symbl websocket. Error: ", ex);
  }
}
async function audioTranscriptionMiddleware(audioProcessingEvent) {
  await audioProcessingEvent.audioWorklet.addModule("audioprocessor.js"); 
  const randomNoiseNode = new AudioWorkletNode(
    audioProcessingEvent,
    "audioprocessor"
  );
  randomNoiseNode.connect(audioProcessingEvent.destination);
  
}
async function activateTranscriptions$1({
  meeting,
  symblAccessToken,
  languageCode
}) {
 console.log("activaing trans");
  return;
  deactivateTranscriptions$1({ meeting });
  meeting.meta.roomName;
  const symblEndpoint = "wss://transcribe-api.bhasa.io/ws/record";
  const ws2 = new WebSocket(symblEndpoint);
  setWebSocket(ws2);
  ws2.onmessage = async (event) => {
    var _a, _b, _c;
    const data = JSON.parse(event.data);
    console.log("data is ", data);
    console.log("data");
    if (data["type"] == null) {
      let x = document.getElementById("md");
      x.innerText = data[0]["transcript"];
      meeting.participants.broadcastMessage("audioTranscriptionMessage", {
        text: data[0]["transcript"],
        peerId: meeting.self.id,
        displayName: meeting.self.name
      });
    }
    if (data.type === "message" && Object.prototype.hasOwnProperty.call(data.message, "punctuated")) {
      if (((_a = data.message.user) == null ? void 0 : _a.peerId) === meeting.self.id) {
        setPeerIdForSymblId(data.message.user.id, meeting.self.id);
        meeting.participants.broadcastMessage("audioTranscriptionMessage", {
          text: data.message.punctuated.transcript,
          isPartialTranscript: true,
          startTimeISO: ((_b = data.message.duration) == null ? void 0 : _b.startTime) || new Date().toISOString(),
          endTimeISO: ((_c = data.message.duration) == null ? void 0 : _c.endTime) || new Date().toISOString(),
          peerId: meeting.self.id,
          displayName: meeting.self.name
        });
      }
    }
 
  };
 ws2.onerror = (err) => {
    console.error("Symbl websocket error: ", err);
  };
  ws2.onclose = () => {
    console.info("Connection to Symbl websocket closed");
  };
  ws2.onopen = () => {
    ws2.send(JSON.stringify({
      meeting_id: window.roomname,
      participant_id : meeting.self.name
    }));
  };
 return meeting.self.addAudioMiddleware(audioTranscriptionMiddleware);
}
async function deactivateTranscriptions$1({
  meeting
}) {
  var _a;
  try {
    setTranscriptions([]);
    meeting.self.removeAudioMiddleware(audioTranscriptionMiddleware);
    (_a = getWebSocket()) == null ? void 0 : _a.close();
  } catch (ex) {
    console.error("Failed to close Symbl websocket. Error: ", ex);
  }
}
async function activateTranscriptions(param) {
  var _a;
  if (!((_a = param == null ? void 0 : param.meeting) == null ? void 0 : _a.self)) {
    throw new Error("arguments[0].meeting.self is not available. Did you miss calling new DyteClient first?");
  }
  return activateTranscriptions$1(param);
}
async function deactivateTranscriptions(param) {
  var _a;
  if (!((_a = param.meeting) == null ? void 0 : _a.self)) {
    throw new Error("arguments[0].meeting.self is not available. Did you miss calling new DyteClient first?");
  }
  return deactivateTranscriptions$1(param);
}
async function addTranscriptionsListerner(param) {
  var _a;
  if (!((_a = param == null ? void 0 : param.meeting) == null ? void 0 : _a.self)) {
    throw new Error("arguments[0].meeting.self is not available. Did you miss calling new DyteClient first?");
  }
  if (!(param == null ? void 0 : param.transcriptionsCallback)) {
    throw new Error("arguments[0].transcriptionsCallback is not missing. Please provide transcriptionsCallback.");
  }
  return addTranscriptionsListener(param);
}
async function removeTranscriptionsListener(param) {
  var _a;
  if (!((_a = param.meeting) == null ? void 0 : _a.self)) {
    throw new Error("arguments[0].meeting.self is not available. Did you miss calling new DyteClient first?");
  }
  return removeTranscriptionsListener$1(param);
}
function getTranscriptions() {
  return getTranscriptions$1();
}
export { activateTranscriptions, addTranscriptionsListerner, deactivateTranscriptions, getTranscriptions, removeTranscriptionsListener };
