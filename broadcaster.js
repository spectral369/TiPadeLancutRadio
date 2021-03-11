const EventEmitter = require("events");
const PassThroughStream = require("stream").PassThrough;

const ytdl = require("ytdl-core");
const url1 = "https://www.youtube.com/watch?v=WNeLUngb-Xg";
const Fs = require("fs");
const Throttle = require("throttle");
//const { OpusStreamDecoder } = require('opus-stream-decoder');
const FFmpeg = require("fluent-ffmpeg");
const { SQueue } = require("./queue.js");

let counter = 0;

class Users {
  constructor() {
    this._sinks = new Map(); // lista de useri
    this._songs = new SQueue();
    this._currentSong = null;
    this.stream = new EventEmitter();
  }

  init() {
    //this._currentSong = ytdl(url1, { quality: "highestaudio" });
    this._songs.enqueue(url1);
  }

  makeResponseSink() {
    const id = Math.random().toString(36).slice(2);
    const responseSink = new PassThroughStream();
    this._sinks.set(id, responseSink);
    return { id, responseSink };
  }

  removeResponseSink(id) {
    this._sinks.delete(id);
  }

  _broadcastToEverySink(chunk) {
    for (const [, user] of this._sinks) {
      user.write(chunk);
    }
  }

  _playLoop() {


    console.log(++counter);
    if(this._songs.size()>0)
    this._currentSong =  this._songs.dequeue();
    var bitrate = 143360;
    let audi = ytdl(this._currentSong, { quality: "highestaudio" });
    console.log('songs remaining:'+this._songs.size());

    var throttleTransformable = new Throttle(bitrate / 8); //test
    throttleTransformable.on("data", (chunk) =>
      this._broadcastToEverySink(chunk)
    );
    throttleTransformable.on("end", () => this._playLoop());

    this.stream.emit("play", this._currentSong);

   var str = new FFmpeg(audi)
      .audioCodec("libfdk_aac")
      .format("adts");

   /*   var str = new FFmpeg(audi)
      .audioCodec("libopus")
      .format("ogg");
    //  .outputOptions(["-movflags faststart"]);*/
    var ffstream = str.pipe();
    ffstream.on("data", function (chunk) {
      // console.log('ffmpeg just wrote ' + chunk.length + ' bytes');
    });
    str.on("progress", function (data) {
      bitrate = data.currentKbps;
      console.log("curent kbs=" + bitrate);
    });
    ffstream.pipe(throttleTransformable);
  }

  startStreaming() {
    this._playLoop();
  }

  addSong(link){
    this._songs.enqueue(link);
  
  }

  getQueueSize(){
    return this._songs.size();
  }

}

exports.Users = new Users();
