'use strict';
/*globals io*/

/**
 * Minimum viable WebSocket client. This function is stringified and written in
 * to our client side library.
 *
 * @runat client
 * @api private
 */
module.exports = function client() {
  var primus = this
    , socket;

  //
  // Connect to the given url.
  //
  primus.on('outgoing::connect', function connect(url) {
    if (socket) socket.disconnect();

    //
    // We need to remove the pathname here as socket.io will assume that we want
    // to connect to a namespace instead.
    //
    socket = io.connect(url.replace(this.pathname.slice(1), ''), {
      'resource': this.pathname.slice(1),
      'force new connection': true,
      'reconnect': false
    });

    //
    // Setup the Event handlers.
    //
    socket.on('connect', primus.emits('connect'));
    socket.on('connect_failed', primus.emits('error'));
    socket.on('disconnect', primus.emits('end'));
    socket.on('message', primus.emits('data'));
  });

  //
  // We need to write a new message to the socket.
  //
  primus.on('outgoing::data', function write(message) {
    if (socket) socket.send(message);
  });

  //
  // Attempt to reconnect the socket. It asumes that the `close` event is
  // called if it failed to disconnect.
  //
  primus.on('outgoing::reconnect', function reconnect() {
    if (socket) {
      socket.disconnect();
      socket.connected = socket.connecting = socket.reconnecting = false;
      socket.connect();
    }
  });

  //
  // We need to close the socket.
  //
  primus.on('outgoing::close', function close() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  });
};
