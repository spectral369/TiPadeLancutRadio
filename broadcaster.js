const EventEmitter = require("events");
const PassThroughStream = require("stream").PassThrough;

const ytdl = require("ytdl-core");
const url1 = "https://www.youtube.com/watch?v=WNeLUngb-Xg";
const Fs = require("fs");
const Throttle = require("throttle");
//const { OpusStreamDecoder } = require('opus-stream-decoder');
const FFmpeg = require("fluent-ffmpeg");

let counter = 0;

class Users {
  constructor() {
    this._sinks = new Map(); // lista de useri
    this._songs = []; // test queue
    this._currentSong = null;
    this.stream = new EventEmitter();
  }

  init() {
    this._currentSong = ytdl(url1, { quality: "highestaudio" });
    this.createAndAppendToSongs(this._currentSong);
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

    var bitrate = 143360;
    let audi = ytdl(url1, { quality: "highestaudio" });

    var throttleTransformable = new Throttle(bitrate / 8); //test
    throttleTransformable.on("data", (chunk) =>
      this._broadcastToEverySink(chunk)
    );
    throttleTransformable.on("end", () => this._playLoop());

    this.stream.emit("play", this._currentSong);

   var str = new FFmpeg(audi)
      .audioCodec("libfdk_aac")
      .format("adts")
      .outputOptions(["-movflags faststart"]);
   /*   var str = new FFmpeg(audi)
      .audioCodec("libopus")
      .format("ogg")
      .outputOptions(["-movflags faststart"]);*/
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

  createAndAppendToSongs(song) {
    this._songs.push(song);
  }
  createAndAppendToSongs(song) {
    this._songs.push(song);
  }
  removeFromSongs(index) {
    const adjustedIndex = this._boxChildrenIndexToSongsIndex(index);
    return this._songs.splice(adjustedIndex, 1);
  }
}

exports.Users = new Users();
