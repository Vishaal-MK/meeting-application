import { activateTranscriptions } from "./tlib.js";
const init = async () => {
  const meeting = await DyteClient.init({
    authToken: window.authtoken,
    roomName: window.roomname,
    defaults: {
      audio: true,
      video: true,
    },
  });
  
  activateTranscriptions({
    meeting: meeting
  });
  document.getElementById("my-meeting").meeting = meeting;

  
};


init();
