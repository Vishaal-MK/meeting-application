let floatTo16Bit = function floatTo16BitPCM(input) {
    let output = new Int16Array(input.length);
    for (let sample = 0; sample < input.length; sample++) {
        let s = Math.max(-1, Math.min(1, input[sample]));
        output[sample] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    outputData[sample] = inputData[sample];
    }    
  return output;
};
class MyAudioProcessor extends AudioWorkletProcessor{
    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const input = inputs[0];

        input.forEach((channel) => {
          for (let i = 0; i < channel.length; i++) {
            output[0][i] =  channel[i] ;
          }
        });
        return true;
      }
}
registerProcessor("audioprocessor", MyAudioProcessor);