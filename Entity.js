var initPack = { player: [], bullet: [], gun: [] };
var removePack = { player: [], bullet: [], gun: [] };

Entity = function(param) {
  var self = {
    x: 900, //7
    y: 500, ///4
    spdX: 0,
    spdY: 0,
    id: "",
    map: "field"
  };
  if (param) {
    if (param.x) self.x = param.x;
    if (param.y) self.y = param.y;
    if (param.map) self.map = param.map;
    if (param.id) self.id = param.id;
  }

  self.update = function() {
    self.updatePosition();
  };
  self.updatePosition = function() {
    self.x += self.spdX;
    self.y += self.spdY;
  };
  self.getDistance = function(pt) {
    return Math.sqrt(Math.pow(self.x - pt.x, 2) + Math.pow(self.y - pt.y, 2));
  };
  return self;
};
Entity.getFrameUpdateData = function() {
  var pack = {
    initPack: {
      player: initPack.player,
      bullet: initPack.bullet,
      gun: initPack.gun
    },
    removePack: {
      player: removePack.player,
      bullet: removePack.bullet,
      gun: removePack.gun
    },
    updatePack: {
      player: Player.update(),
      bullet: Bullet.update(),
      gun: Gun.update()
    }
  };
  initPack.player = [];
  initPack.bullet = [];
  initPack.gun = [];
  removePack.player = [];
  removePack.bullet = [];
  removePack.gun = [];
  return pack;
};

Player = function(param) {
  var self = Entity(param);
  self.number = "" + Math.floor(10 * Math.random());
  self.username = param.username;
  self.pressingRight = false;
  self.pressingLeft = false;
  self.pressingUp = false;
  self.pressingDown = false;
  self.pressingAttack = false;
  self.mouseAngle = 0;
  self.maxSpd = 10;
  self.hp = 10;
  self.hpMax = 10;
  self.score = 0;
  self.gunTimer = 0;
  //self.shoot = 0;
  self.usageCountGun = 0;
  self.count = 0;
  self.userItemGun = false; //using of item gun
  self.gunItem = null; //gun item name
  self.inventory = new Inventory(param.socket, true);

  var super_update = self.update;
  self.update = function() {
    self.updateSpd();

    super_update();

    if (self.pressingAttack) {
      //gunItem use
      if (self.useItemGun) {
        if (self.usageCountGun <= 0) {
          self.gunItem = null;
          self.useItemGun = false;
          self.usageCountGun = 0;
        }
        if (self.gunItem === gunList[0]) {
          //use Item -> 0.1%
          //machinegun
          self.usageCountGun--;
          self.shootBullet(self.mouseAngle);
          if (Math.random() < 0.005) Gun({ map: self.map });
        } else if (self.gunItem === gunList[1]) {
          //shotgun
          if (self.gunTimer >= 5) {
            self.usageCountGun--;
            for (
              var i = self.mouseAngle - 10;
              i < self.mouseAngle + 10;
              i += 2
            ) {
              self.shootBullet(i);
            }
            self.gunTimer = 0;
          }
          if (Math.random() < 0.005) Gun({ map: self.map });
        }
      }
      //gun normal
      else {
        if (self.gunTimer >= 5) {
          self.gunTimer = 0;
          if (Math.random() < 0.05) Gun({ map: self.map }); //normal-> 5%
          self.shootBullet(self.mouseAngle);
        }
      }
    }
    self.gunTimer++;
  };

  self.shootBullet = function(angle) {
    if (Math.random() < 0.0001) self.inventory.addItem("potion", 1); //0.01%
    Bullet({
      parent: self.id,
      angle: angle,
      x: self.x,
      y: self.y,
      map: self.map
    });
  };

  self.updateSpd = function() {
    if (self.pressingRight) {
      if (self.x > 1400) {
        self.spdX = 0;
      } else self.spdX = self.maxSpd;
    } else if (self.pressingLeft) {
      if (self.x < 500) {
        //500
        self.spdX = 0;
      } else {
        self.spdX = -self.maxSpd;
      }
    } else self.spdX = 0;

    if (self.pressingUp) {
      if (self.y < 250) {
        //250
        self.spdY = 0;
      } else {
        self.spdY = -self.maxSpd;
      }
    } else if (self.pressingDown) {
      if (self.y > 700) {
        self.spdY = 0;
      } else {
        self.spdY = self.maxSpd;
      }
    } else self.spdY = 0;
  };

  self.getInitPack = function() {
    return {
      id: self.id,
      x: self.x,
      y: self.y,
      number: self.number,
      hp: self.hp,
      hpMax: self.hpMax,
      score: self.score,
      map: self.map,
      shot: self.usageCountGun
    };
  };
  self.getUpdatePack = function() {
    return {
      id: self.id,
      x: self.x,
      y: self.y,
      hp: self.hp,
      score: self.score,
      map: self.map,
      shot: self.usageCountGun
    };
  };

  Player.list[self.id] = self;

  initPack.player.push(self.getInitPack());
  return self;
};
Player.list = {};
Player.onConnect = function(socket, username) {
  var map = "field";
  if (Math.random() < 0.5) map = "field";
  var player = Player({
    username: username,
    id: socket.id,
    map: map,
    socket: socket
  });
  socket.on("keyPress", function(data) {
    if (data.inputId === "left") player.pressingLeft = data.state;
    else if (data.inputId === "right") player.pressingRight = data.state;
    else if (data.inputId === "up") player.pressingUp = data.state;
    else if (data.inputId === "down") player.pressingDown = data.state;
    else if (data.inputId === "attack") player.pressingAttack = data.state;
    else if (data.inputId === "mouseAngle") player.mouseAngle = data.state;
  });

  socket.on("changeMap", function(data) {
    if (player.map === "field") player.map = "forest";
    else player.map = "field";
  });
  /*
지워야됨
  socket.on("sendMsgToServer", function(data) {
    for (var i in SOCKET_LIST) {
      SOCKET_LIST[i].emit("addToChat", player.username + ": " + data);
    }
  });
  */
  socket.on("sendPmToServer", function(data) {
    //data:{username,message}
    var recipientSocket = null;
    for (var i in Player.list)
      if (Player.list[i].username === data.username)
        recipientSocket = SOCKET_LIST[i];
    if (recipientSocket === null) {
      socket.emit(
        "addToChat",
        "The player " + data.username + " is not online."
      );
    } else {
      recipientSocket.emit(
        "addToChat",
        "From " + player.username + ":" + data.message
      );
      socket.emit("addToChat", "To " + data.username + ":" + data.message);
    }
  });

  socket.emit("init", {
    selfId: socket.id,
    player: Player.getAllInitPack(),
    bullet: Bullet.getAllInitPack(),
    gun: Gun.getAllInitPack()
  });
};
Player.getAllInitPack = function() {
  var players = [];
  for (var i in Player.list) players.push(Player.list[i].getInitPack());
  return players;
};

Player.onDisconnect = function(socket) {
  delete Player.list[socket.id];
  removePack.player.push(socket.id);
};
Player.update = function() {
  var pack = [];
  for (var i in Player.list) {
    var player = Player.list[i];
    player.update();
    pack.push(player.getUpdatePack());
  }
  return pack;
};

//Bullet

Bullet = function(param) {
  var self = Entity(param);
  self.id = Math.random();
  self.angle = param.angle;
  self.spdX = Math.cos((param.angle / 180) * Math.PI) * 15;
  self.spdY = Math.sin((param.angle / 180) * Math.PI) * 15;
  self.parent = param.parent;

  self.timer = 0;
  self.toRemove = false;
  var super_update = self.update;
  self.update = function() {
    if (self.timer++ > 100) self.toRemove = true;
    super_update();

    for (var i in Player.list) {
      var p = Player.list[i];
      if (
        self.map === p.map &&
        self.getDistance(p) < 32 &&
        self.parent !== p.id
      ) {
        p.hp -= 1;

        if (p.hp <= 0) {
          var shooter = Player.list[self.parent];
          if (shooter) shooter.score += 1;
          p.hp = p.hpMax;
          p.x = Math.random() * 500;
          p.y = Math.random() * 500;
        }
        self.toRemove = true;
      }
    }
  };
  self.getInitPack = function() {
    return {
      id: self.id,
      x: self.x,
      y: self.y,
      map: self.map
    };
  };
  self.getUpdatePack = function() {
    return {
      id: self.id,
      x: self.x,
      y: self.y
    };
  };

  Bullet.list[self.id] = self;
  initPack.bullet.push(self.getInitPack());
  return self;
};
Bullet.list = {};

Bullet.update = function() {
  var pack = [];
  for (var i in Bullet.list) {
    var bullet = Bullet.list[i];
    bullet.update();
    if (bullet.toRemove) {
      delete Bullet.list[i];
      removePack.bullet.push(bullet.id);
    } else pack.push(bullet.getUpdatePack());
  }
  return pack;
};

Bullet.getAllInitPack = function() {
  var bullets = [];
  for (var i in Bullet.list) bullets.push(Bullet.list[i].getInitPack());
  return bullets;
};

//gun
Gun = function(param) {
  var self = Entity(param);
  self.id = Math.random();
  self.x = Math.random() * 900 + 500;
  self.y = Math.random() * 450 + 250;
  self.gunNumber = Math.floor(Math.random() * 2);
  self.gun = gunList[self.gunNumber];
  self.update = function() {
    for (var i in Player.list) {
      var p = Player.list[i];
      if (self.map === p.map && self.getDistance(p) < 32) {
        p.gunItem = self.gun;
        p.useItemGun = true;
        p.usageCountGun += 20;
        self.toRemove = true;
      }
    }
  };
  self.getInitPack = function() {
    return {
      id: self.id,
      x: self.x,
      y: self.y,
      map: self.map,
      gun: self.gun
    };
  };
  self.getUpdatePack = function() {
    return {
      id: self.id,
      x: self.x,
      y: self.y,
      gun: self.gun
    };
  };
  Gun.list[self.id] = self;
  initPack.gun.push(self.getInitPack());
  return self;
};

Gun.update = function() {
  var pack = [];
  for (var i in Gun.list) {
    var gun = Gun.list[i];
    gun.update();
    if (gun.toRemove) {
      delete Gun.list[i];
      removePack.gun.push(gun.id);
    } else pack.push(gun.getUpdatePack());
  }
  return pack;
};

Gun.getAllInitPack = function() {
  var guns = [];
  for (var i in Gun.list) guns.push(Gun.list[i].getInitPack());
  return guns;
};
gunList = ["machinegun", "shotgun"];
Gun.list = {};
