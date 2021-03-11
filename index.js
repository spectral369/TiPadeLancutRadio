const { Users } = require("./broadcaster.js");
const path = require("path");
const { type } = require("os");
const fs = require("fs");


//test


const plugin = {
  name: "streamServer",
  register: async (server) => {
    server.route({
      method: "GET",
      path: "/",
      handler: (request, reply) => {
        var data = { message: "Hello from Future Studio" };

        return reply.view("index.html", data);
      },
    });

    server.route({
      method: "GET",
      path: "/public/{param*}",
      handler: {
        directory: {
          path: path.join(__dirname, "public"),
        },
      },
    });

    server.route({
      method: "GET",
      path: "/favicon.ico",
      handler: function (request, reply) {
        const ico = require("fs").createReadStream("./favicon.ico");
        return reply.response(ico).code(200).type("image/x-icon");
      },
    });

    server.route({
      method: "GET",
      path: "/stream2",
      handler: function (request, h) {
        var filePath = "./test.webm";
        var stat = fs.statSync(filePath);
        var total = stat.size;

        return h
          .response(fs.createReadStream(filePath))
          .header("Content-Length", total)
          .header("Content-Type", "audio/webm;codes=opus")
          .type("audio/webm;codecs=opus");
      },
    });

    server.route({
      method: "GET",
      path: "/stream",

      handler: (request, h) => {
        const { id, responseSink } = Users.makeResponseSink();

        request.app.sinkId = id;
        console.log("user added", request.app);

        return h
          .response(responseSink)
          .header("Transfer-Encoding", "chunked")
          .type("audio/aac");
      },
      options: {
        ext: {
          onPreResponse: {
            method: (request, h) => {
              request.events.once("disconnect", () => {
                Users.removeResponseSink(request.app.sinkId);
                console.log("user removed", request.app);
              });
              return h.continue;
            },
          },
        },
      },
    });
    server.route({
      method: "GET",
      path: "/admin",
      handler: (request, reply) => {
        var data = { message: "Hello from Future Studio" };

        return reply.view("./admin.html", data);
     //  reply.view('./admin.html', {}, { layout: 'admin' });
      },
    });


    server.route({
      method: "POST",
      path: "/addsong",
      config: {
        payload: {
            output: 'data'
        }
    },
    handler: function (request, response){
      var ytlink = request.payload.ytlink;
      Users.addSong(ytlink);
      return "success";
    }
    });


  },
};

module.exports = plugin;
