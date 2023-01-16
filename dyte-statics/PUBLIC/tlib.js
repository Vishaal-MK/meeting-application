let ws;
let transcriptions = [];
function getWebSocket() {
  return ws;
}
function setWebSocket(newWS) {
  ws = newWS;
}



async function audioTranscriptionMiddleware(audioContext) {
  const processor = audioContext.createScriptProcessor(1024, 1, 1);
  processor.onaudioprocess = (audioProcessingEvent) => {
    const inputBuffer = audioProcessingEvent.inputBuffer;
    const outputBuffer = audioProcessingEvent.outputBuffer;
    for (let channel = 0; channel < 1; channel++) {
      const inputData = inputBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      let floatTo16Bit = function floatTo16BitPCM(input) {
    	  let output = new Int16Array(input.length);
	      for (let sample = 0; sample < input.length; sample++) {
		      let s = Math.max(-1, Math.min(1, input[sample]));
		      output[sample] = s < 0 ? s * 0x8000 : s * 0x7FFF;
		      outputData[sample] = input[sample];
	      }
        return output;
      };
      const ws2 = getWebSocket();
      if ((ws2 == null ? void 0 : ws2.readyState) === WebSocket.OPEN) {
        console.log("sending buffer to server");
        let targetBuffer = floatTo16Bit(inputData);
        ws2.send(targetBuffer.buffer);
      }
    }
  };
  return processor;
}
async function activateTranscriptions$1({
  meeting,
  symblAccessToken,
  languageCode
}) {
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
    console.log("meeting id is ",meeting.self.name)
  };
  return meeting.self.addAudioMiddleware(audioTranscriptionMiddleware);
}

async function activateTranscriptions(param) {
  var _a;
  if (!((_a = param == null ? void 0 : param.meeting) == null ? void 0 : _a.self)) {
    throw new Error("arguments[0].meeting.self is not available. Did you miss calling new DyteClient first?");
  }

  return activateTranscriptions$1(param);
}

export { activateTranscriptions };
