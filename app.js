const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const socketIO = require('socket.io');
const http = require('http');
const { response } = require('express');
const { body, validationResult } = require('express-validator');
const {phoneNumberFormatter} = require('./helpers/formatter');
const {groupIdFormatter} = require('./helpers/formatter')
//const client = new Client();
//const { Client, Location, List, Buttons, LocalAuth} = require('./index');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const client = new Client({
    authStrategy: new LocalAuth(),
    restartOnAuthFail: true,
    puppeteer: { 
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // <- this one doesn't works in Windows
            '--disable-gpu'
          ],
    }
});

 client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
 });

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});

client.on('message', msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    } else if (msg.body == 'halo'){
        msg.reply('Hallo Juga!!')
    }
});

app.get('/', (req, res) => {
    res.sendFile('index.html', {root: __dirname});
});

client.initialize();

// Socket IO connection
io.on('connection', function(socket) {
    socket.emit('message', 'Conecting...');

    client.on('qr', (qr) => {
        // Generate and scan this code with your phone
        console.log('QR RECEIVED', qr);
        // qrcode.generate(qr);
        qrcode.toDataURL(qr, (err, url) => {
            socket.emit('qr', url);
            socket.emit('message', 'QR Code is Received, please scan!');
        });
    });

    client.on('ready', () => {
        socket.emit('ready', 'Client is ready!');
        socket.emit('message', 'Client is ready!');
    });

    client.on('authenticated', () => {
        socket.emit('authenticated', 'Client is authenticated!');
        socket.emit('authenticated', 'Client is authenticated!');
        console.log('AUTHENTICATED');
    });

});

// Checking Number is Registered WhatsApp
const checkRegisteredNumber = async function(phoneNumber) {
    const isRegistered = await client.isRegisteredUser(phoneNumber);

    return isRegistered;
}

// send
app.post('/send', [
    body('phoneNumber').notEmpty(),
    body('message').notEmpty(),
], async (req, res) => {
    const errors = validationResult(req).formatWith(({ msg }) => {
        return msg;
    })
    if (!errors.isEmpty()) {
        return res.status(422).json({
            status: false,
            message: errors.mapped()
        });
    }
    const phoneNumber = phoneNumberFormatter(req.body.phoneNumber);
    const message = req.body.message;
    const isRegisteredNumber = await checkRegisteredNumber(phoneNumber);

    if (!isRegisteredNumber) {
        return res.status(422).json({
            status: false,
            message: 'The Phone Number is not Registered'
        });
    }

    client.sendMessage(phoneNumber, message).then(response => {
        res.status(200).json({
            status: true,
            response: response
        });
    }).catch(err => {
        res.status(500).json({
            status: false,
            response: err
        });
    });
});

// media
app.post('/media', (req, res) => {
    const phoneNumber = phoneNumberFormatter(req.body.phoneNumber);
    const caption = req.body.caption;
    //const media = MessageMedia.fromFilePath('./media/images/example.jpg')
    const media = MessageMedia.fromFilePath(req.body.media)
    client.sendMessage(phoneNumber, media, {caption: caption}).then(response => {
        res.status(200).json({
            status: true,
            response: response
        });
    }).catch(err => {
        res.status(500).json({
            status: false,
            response: err
        });
    });
});

// Group
const findGroupByName = async function(name) {
    const group = await client.getChats().then(chats => {
      return chats.find(chat => 
        chat.isGroup && chat.name.toLowerCase() == name.toLowerCase()
      );
    });
    return group;
  }
  
  // Send message to group
  // You can use chatID or group name, yea!
  app.post('/groupchat', [
    body('id').custom((value, { req }) => {
      if (!value && !req.body.name) {
        throw new Error('Invalid value, you can use `id` or `name`');
      }
      return true;
    }),
    body('message').notEmpty(),
  ], async (req, res) => {
    const errors = validationResult(req).formatWith(({
      msg
    }) => {
      return msg;
    });
  
    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped()
      });
    }
  
    let chatId = groupIdFormatter(req.body.id);
    const groupName = req.body.name;
    const message = req.body.message;
  
    // Find the group by name
    if (!chatId) {
      const group = await findGroupByName(groupName);
      if (!group) {
        return res.status(422).json({
          status: false,
          message: 'No group found with name: ' + groupName
        });
      }
      chatId = group.id._serialized;
    }
  
    client.sendMessage(chatId, message).then(response => {
      res.status(200).json({
        status: true,
        response: response
      });
    }).catch(err => {
      res.status(500).json({
        status: false,
        response: err
      });
    });
  });

server.listen(7070, function(){
    console.log('App Running on *: ' + 7070);
});