export interface AudioManager {play(cue:string):void;setAmbience(id:string):void;mute():void}
export const silentAudio: AudioManager = {play(){},setAmbience(){},mute(){}};
