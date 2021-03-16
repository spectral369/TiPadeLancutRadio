

let chatUserName = "unknown";
let isNameSet = false;
function showChat(){
  document.getElementById('chatArea').style.display = 'block';
  document.getElementById('chatArea').style.visibility = 'visible';
  document.getElementById('nameDiv').style.display = 'none';
  document.getElementById('nameDiv').style.visibility = 'hidden';
  chatUserName  = document.getElementById('chatName').value;
  isNameSet=true;
  socket.emit('addsocketandname',chatUserName);
}

var messages = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');

form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', chatUserName.concat(':').concat(input.value));
    input.value = '';
  }
});

socket.on('chat message', function(msg) {
  var item = document.createElement('li');
  item.textContent = msg;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

