const EventEmitter = require("events");
const PassThroughStream = require("stream").PassThrough;

const ytdl = require("ytdl-core");
const url1 = "https://www.youtube.com/watch?v=M-mtdN6R3bQ"; //"https://www.youtube.com/watch?v=WNeLUngb-Xg";
const Fs = require("fs");
const Throttle = require("throttle");
//const { OpusStreamDecoder } = require('opus-stream-decoder');
const FFmpeg = require("fluent-ffmpeg");
const { SQueue } = require("./queue.js");
const yts = require("yt-search");

let counter = 0;

class Users {
  constructor() {
    this._sinks = new Map(); // lista de useri
    this._songNameList = new Array(); //lista melodii
    this._songsLength = new Array();
    this._songs = new SQueue();
    this._currentSong = null;
    this.stream = new EventEmitter();
    //this.songsLength = 0;
    this._currentBitrate = 143360; //default
  }

  init() {
    this.addSong(url1);
    //this._songs.enqueue(url1);
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

    if (this._songs.size() > 0) {
      this._currentSong = this._songs.dequeue();
      this._songNameList.pop();
      this._songsLength.pop();
    }
    if (this._songs.size() < 1) {
      this.randomPlaylist()
        .then((name) => {
          this.addSong(name);
        })
        .catch((err) => {
          console.log(err);
        });
    }

    let audi = ytdl(this._currentSong, { quality: "highestaudio" });

  
    var throttleTransformable = new Throttle(this._currentBitrate / 8); //test
    throttleTransformable.on("data", (chunk) =>
      this._broadcastToEverySink(chunk)
    );

    throttleTransformable.on("end", () => this._playLoop());

    this.stream.emit("play", this._currentSong);

    var str = new FFmpeg(audi)
      .audioCodec("aac") //libfdk_aac
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
      this._currentBitrate = data.currentKbps;
      console.log("curent kbs=" + this._currentBitrate);
    });
    ffstream.pipe(throttleTransformable);
  }

  startStreaming() {
    this._playLoop();
  }

  addSong(link) {
    this.getYTInfo(link)
    .then((name) => {
      this._songNameList.push(name.videoDetails.title);
      this._songsLength.push(name.videoDetails.lengthSeconds);
    })
    .catch((err) => {
      console.log(err);
    });
    console.log("added new song", link);
    this._songs.enqueue(link);
  }



  async getYTInfo(link){

    return await ytdl.getInfo(link);
  }


  getQueueSize() {
    return this._songs.size(); //cate melodii exista atm
  }


  async randomPlaylist() {
    const r = await yts(this.randomStringSong());
    const videos = r.videos.slice(0, 1); //nr de video returnate din cautare
    return videos[0].url;

  }

  randomStringSong() {
    const keywords = [
      "mix music",
      "best of summer hits",
      "popular summer hits",
      "music hits new",
      "summer mix",
      "dj dark",
      "rammor mix",
    ];
    const randomElement = Math.floor(Math.random() * keywords.length);

    return keywords[randomElement];
  }


  removeSongFromQueue(){
    this._songs.dequeue(); //test
  }
}

exports.Users = new Users();
