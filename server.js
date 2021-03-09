const Hapi = require("@hapi/hapi");

const StaticFilePlugin = require("@hapi/inert");

const { Users } = require("./broadcaster.js");

const Routes = require("./");

const Path = require("path");

var favicon = require("serve-favicon");

let listenersCounter = 0;
clients = [];

void (async function startApp() {
  try {
    Users.init();
    Users.startStreaming();
    const server = Hapi.server({
      port: process.env.PORT || 3000,
      host: process.env.HOST || "localhost",
      compression: false,
      routes: { files: { relativeTo: Path.join(__dirname, "views") } },
    });
    server.listener.keepAliveTimeout = 0;

    await server.register({
      plugin: require("vision"), // add template rendering support in hapi
    });
    server.views({
      engines: {
        html: require("handlebars"),
      },
      path: "views",
      layoutPath: "views/layout",
      layout: "default",
      partialsPath: "views/partials",
    });
    await server.register(StaticFilePlugin);
    await server.register(Routes);

    //Engine.start();
    const io = require("socket.io")(server.listener);
    //test

    io.on("connection", (socket) => {
      console.log("a user connected socketIO");
      listenersCounter++;
      clients.push(socket);

      /*ss(socket).on('ready', function(){
        console.log('Here it comes...');
    
        readable.pipe(es.map(function(block, callback) {
          ss(socket).emit('sending', block);
         //callback(null);
    
      })).pipe(process.stdout);
    
      });*/
      /*
      ss(socket).on('ready', function(){
        console.log('Here it comes...');
        const url1 = 'https://www.youtube.com/watch?v=WNeLUngb-Xg'
        let rs =  ytdl(url1,{ begin: Date.now(),quality: 'highestaudio', filter: 'audioonly' });
      //rs.pipe(throttle).on('data', (block) => {
        readable.pipe(throttle).on('data',function(block){
      //rs.pipe(es.map(function(block, callback) {
    
      
          clients.map(function(client){
         //  console.log(socket.id);
            ss(client).emit('sending', block);
             // callback(null);
         });
         
        });
      });
      */
      io.emit("chat message", "send from server");

      socket.on("disconnect", function () {
        listenersCounter--;
        clients.splice(clients.indexOf(socket), 1);
        console.log("a user disconnected");
      });
    });

    ///test

    await server.start();

    console.log(`Server running at: ${server.info.uri}`);
  } catch (err) {
    console.log(`Server errored with: ${err}`);
    console.error(err.stack);
    process.exit(1);
  }
})();
