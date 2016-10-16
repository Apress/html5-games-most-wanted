(function(ns, $){
  "use strict";

ns.Storage = function() {
  var key = 'chessdemo_';
  var appLaunchedKey = key+'gameLaunched';
  var gameKey = key+'game';

  var appNeverLaunched = !localStorage.getItem(appLaunchedKey);
  localStorage.setItem(appLaunchedKey, 'true');

  return {
    saveGame: function(game) {
      localStorage.setItem( gameKey, JSON.stringify(game) );
    },
    retrieveGame: function() {
      return JSON.parse( localStorage.getItem(gameKey) );
    },
    emptyGame: function() {
      localStorage.removeItem(gameKey);
    },
    hasGameSaved: function() {
      return !! localStorage.getItem(gameKey);
    },
    appNeverLaunched: function(){ return appNeverLaunched; }
  }
}();


  $(document).ready(function(){
    ns.Controller.init();
    $(window).bind("hashchange", function() {
      ns.Controller.route(!location.hash ? '/' : location.hash.replace('#!', ''));
    }).trigger("hashchange");
   
    // Improve display feedback when using click because of the 300ms timeout
    $('a').each(function(){
      var a = $(this);
      if(a.attr('href').substring(0,4)!='http') {
        a.bind('touchstart', function(){
          e.preventDefault();
          location.hash = $(this).attr('href');
        });
      }
    });
    // Wait before enabling transition to not do transition for the first load
    setTimeout(function(){
      $('#pages').addClass('enabletransition');
    }, 500);
  });

  ns.currentGame = null;

  ns.Controller = function(){
    var scene = function(name) {
      var section = $('#'+name);
      //section.nextAll().addClass('after')
      //section.removeClass('after');
      //section.prevAll().removeClass('after');
      section.addClass('current').siblings().removeClass('current');
    }
    
    var _functions = [];
    var onRouteChange = function(call) {
      _functions.push(call);
    }
    var callRouteChangeFunctions = function() {
      for(var i=0; i<_functions.length; ++i)
        _functions[i]();
      _functions = [];
    }

    return {
      init: function(){
        
      },
      route: function(path) {
        callRouteChangeFunctions();
        if(path=="/") return this.index();
        if(path=="/menu") return this.menu();
        if(path=="/game/continue") return this.continueGame();
        if(path=="/game/new") return this.newGame();
        if(path=="/game") return this.game();
        if(path="/help") return this.help();
      },
      index: function(){
        return this.menu();
      },
      menu: function(){
        if(ns.currentGame || ns.Storage.hasGameSaved()) 
          $('.showOnlyIfContinuableGame').show();
        else 
          $('.showOnlyIfContinuableGame').hide();
        scene('menu');
      },
      continueGame: function(){
        if(!ns.currentGame && ns.Storage.hasGameSaved()) {
          ns.currentGame = new ns.Game( ns.Storage.retrieveGame() );
        }
        return this.game();
      },
      newGame: function(){
        ns.Storage.emptyGame();
        ns.currentGame = null;
        return this.game();
      },
      game: function(){
        var renderer = new ns.Renderer();
        if(!ns.currentGame)
          ns.currentGame = new ns.Game().init();
        var game = ns.currentGame;
        renderer.init(game);
        game.bindChange(function(){
          ns.Storage.saveGame( game.export() );
          if( game.isFinished() ) {
            alert("CheckMate!"); // maybe render a finish page instead
            ns.currentGame = null;
            history.back();
          }
        })
        scene('game');
      },

      help: function(){
        scene('help');
      }
  }
}();


  // light event system from https://gist.github.com/1000193
  var Event = (function(_){return{pub:function(a,b,c,d){for(d=-1,c=[].concat(_[a]);c[++d];)c[d](b)},sub:function(a,b){(_[a]||(_[a]=[])).push(b)}}})({})

  var uuid = (function(num){
    return function(){ return ++num; }
  }(0))

  var forEachPosition = function(callback){
    return _.each('87654321', function(digit){
      _.each('abcdefgh', function(letter){
        callback(letter+digit, letter, digit);
      })
    });
  }
  var positionToCoord = function(position){
    return {
        x: position.charCodeAt(0)-97,
        y: parseInt(position.substring(1,2))-1
      }
  }
  var coordToPosition = function(coord){
    return String.fromCharCode(coord.x+97)+""+(coord.y+1);
  }


  ns.Renderer = function(){
    var self = this;
    var lighterCases = ["a2","a4","a6","a8","c2", "c4", "c6", "c8", "e2", "e4", "e6", "e8", "g2", "g4", "g6", "g8", "b1", "b3", "b5", "b7", "d1", "d3", "d5", "d7", "f1", "f3", "f5", "f7", "h1", "h3", "h5", "h7"]

    self.render = function(){
      if(self.game.isCheckMate(self.game.currentPlayer)) {
        alert("CheckMate");
        return;
      }
      self.board[0].className = 'player-'+self.game.currentPlayer;
      var map = self.game.generateCurrentMap();
      forEachPosition(function(p, l, d){
        var piece = map[p];
        var className = p;
        if(_.include(lighterCases, p)) className += " lighter";
        if(piece) {
          className += ' piece '+piece.color+' '+piece.type;
          if(self.game.currentPiece == piece) {
            className += ' current';
          }
        }
        if(self.game.possibleMoveContains(p)) {
          className += ' playable';
        }
        self.positions[p].className = className;
      });
      self.blackEated.empty();
      _.each(self.game.blackEated, function(type){
        self.blackEated.append(createImage({ color: 'white', type: type }));
      });
      self.whiteEated.empty();
      _.each(self.game.whiteEated, function(type){
        self.whiteEated.append(createImage({ color: 'black', type: type }));
      });

    }
    self.init = function(game){
      self.game = game;
      self.board = $('#chessboard').empty();
      self.blackEated = $('#black-eated').empty();
      self.whiteEated = $('#white-eated').empty();
      self.positions = [];
      forEachPosition(function(p){
        var node = $('<div />');
        self.positions[p] = node[0];
        self.board.append(node);
        node.bind('click', function(){
          self.game.onClick(p);
        });
      });
      self.render();
      self.game.bindChange(function(){ self.render() });
      return this;
    }
  }

  /**
   * o contains :
   * color: 'white' | 'black'
   * type: 'rook' | 'knight' | 'bishop' | 'queen' | 'king' | 'pawn'
   * position: <letter from a to h><digit from 1 to 8>
   */
  ns.Piece = function(o){
    var self = this;
    self.color = o.color;
    self.type = o.type;
    self.position = o.position;
  }

  ns.Game = function(o){
    var self = this;
    self.pieces = [];
    self.whiteEated = [];
    self.blackEated = [];
    self.currentPlayer = 'white';
    self.currentPiece = null;
    self.possibleMoves = null;
    var id = uuid();

    self.import = function(o) {
      self.pieces = _.clone(o.pieces);
      self.whiteEated = _.clone(o.whiteEated);
      self.blackEated = _.clone(o.blackEated);
      self.currentPlayer = o.currentPlayer;
    }

    if(o) self.import(o);

    self.export = function() {
      return {
        pieces: _.clone(self.pieces),
        whiteEated: _.clone(self.whiteEated),
        blackEated: _.clone(self.blackEated),
        currentPlayer: self.currentPlayer
      }
    }

    self.init = function(){
      var piece = function(c, t, p){ return new ns.Piece({ color: c, type: t, position: p }) };
      self.pieces = [];
      self.currentPlayer = 'white';
      self.currentPiece = null;
      var firstRowTypes = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
      for(var i=0; i<=7; ++i) {
        var c = String.fromCharCode(i+97);
        self.pieces.push( piece('white', firstRowTypes[i], c+'1') );
        self.pieces.push( piece('white', 'pawn',           c+'2') );
        self.pieces.push( piece('black', 'pawn',           c+'7') );
        self.pieces.push( piece('black', firstRowTypes[i], c+'8') );
      }
      return this;
    }
    self.toggleCurrentPlayer = function(){
      self.currentPlayer = self.currentPlayer=='white' ? 'black' : 'white';
    }
    self.triggerChange = function() {
      Event.pub('game'+id+'_change');
    }
    self.bindChange = function(callback) {
      Event.sub('game'+id+'_change', callback);
    }
    self.onGameEnd = function(callback) {
      Event.sub('game'+id+'_end', callback);
    }

    self.askPiece = function(callback) {
      // TODO
      callback('queen')
    }
    
    self.onClick = function(position) {
      var unselect = function() {
        self.unselect();
        self.triggerChange();
      }
      var select = function(p) {
        self.select(p);
        self.triggerChange();
      }
      var newTurn = function() {
        unselect();
        self.toggleCurrentPlayer();
        self.triggerChange();
      }

      var p = self.findPieceByPosition(position);
      var pOwned = p && p.color == self.currentPlayer;
      var pIsOpponent = p && p.color != self.currentPlayer;
      if(self.currentPiece) {
        if(pOwned) {
          if(p == self.currentPiece) {
            unselect();
          }
          else {
            select(p);
          }
        }
        else {
          if(pIsOpponent) {
            if( self.canTakeWithSelected(p) ) {
              self.takeWithSelected(p);
              newTurn();
            }
            else {
              unselect();
            }
          }
          else {
            if( self.canMoveSelected(position) ) {
              self.moveSelected(position);
              newTurn();
            }
            else {
              unselect();
            }
          }
        }
      }
      else {
        if(pOwned)
          select(p);
      }
    }

    self.select = function(p) {
      self.currentPiece = p;
      if( self.isCheck(p.color) && p.type!='king' ) 
        self.possibleMoves = [];
      else
        self.possibleMoves = self.getMoves(p);
    }

    self.unselect = function() {
      self.currentPiece = null;
      self.possibleMoves = null;
    }

    self.possibleMoveContains = function(pos) {
      return _.include(self.possibleMoves, pos);
    }

    self.canMoveSelected = function(position) {
      return !self.findPieceByPosition(position) && self.possibleMoveContains(position);
    }

    self.moveSelected = function(position) {
      if(self.currentPiece.type=='king') {
        var y = self.currentPiece.color=='white' ? 0 : 7;
        var coord = positionToCoord(self.currentPiece.position);
        var coordTo = positionToCoord(position);
        if(coord.x==4 && coord.y==y && coordTo.y==y && coordTo.x==6 ) {
          self.findPieceByPosition(coordToPosition({ x: 7, y: y })).position = coordToPosition({ x: 5, y: y });
        }
      }
      self.currentPiece.position = position;
    }
    
    self.canTakeWithSelected = function(piece) {
      return self.possibleMoveContains(piece.position);
    }
    
    self.takeWithSelected = function(pieceTo) {
      self.currentPiece.position = pieceTo.position;
      self.pieces = _.without(self.pieces, pieceTo);
      if( pieceTo.color == 'black' ) {
        self.whiteEated.push( pieceTo.type );
      }
      else {
        self.blackEated.push( pieceTo.type );
      }
    }

    self.isCheck = function(color) {
      var king = self.findKing(color);
      var map = self.generateCurrentMap();
      var colorOp = (color=='white' ? 'black' : 'white');
      var opponents = _.filter(self.pieces, function(piece){ return piece.color == colorOp; });
      return _.any(opponents, function(piece){
        var moves = self.getVisibles(piece, map);
        return _.include(moves, function(p){ 
          return p.position.x == piece.position.x && 
                 p.position.y == piece.position.y;
        });
      });
    }
    self.isCheckMate = function(color) {
      var king = self.findKing(color);
      var moves = self.getMoves(king);
      return false;
    }
    self.isFinished = function() {
      return self.isCheckMate('white') || 
             self.isCheckMate('black');
    }

    self.findKing = function(color) {
      return _.detect(self.pieces, function(piece){ return piece.type == 'king' && piece.color == color });
    }
    self.findPieceByPosition = function(position) {
      return _.detect(self.pieces, function(piece){ return piece.position == position });
    }
    self.generateCurrentMap = function() {
      var o = {};
      _.each(self.pieces, function(piece){
        o[piece.position] = piece;
      });
      return o;
    }

    self.getVisibles = function(piece, map) {
      if(!map) map = self.generateCurrentMap();
      var moves = [];
      var coord = positionToCoord(piece.position);
      var collide = false;
      var addToMovesWithCollide = function(pos){
        if(collide) return;
        var p = map[pos];
        if(p) {
          if(p.color!=piece.color)
            moves.push(pos);
          collide = true;
        }
        else
          moves.push(pos);
      }
      if(piece.type == 'rook' || piece.type == 'queen') {
        if(coord.x<7) {
          collide = false;
          _(_.range(coord.x+1, 9)).chain().map(function(x){
            return coordToPosition({ x: x, y: coord.y })
          }).each(addToMovesWithCollide);
        }
        if(coord.x>0) {
          collide = false;
          _(_.range(coord.x-1, -1, -1)).chain().map(function(x){
            return coordToPosition({ x: x, y: coord.y })
          }).each(addToMovesWithCollide);
        }
        if(coord.y<7) {
          collide = false;
          _(_.range(coord.y+1, 9)).chain().map(function(y){
            return coordToPosition({ x: coord.x, y: y })
          }).each(addToMovesWithCollide);
        }
        if(coord.y>0) {
         collide = false;
          _(_.range(coord.y-1, -1, -1)).chain().map(function(y){
            return coordToPosition({ x: coord.x, y: y })
          }).each(addToMovesWithCollide);
        }
      }
      if(piece.type == 'bishop' || piece.type == 'queen') {
        if(coord.x<7 && coord.y<7) {
          collide = false;
          _(_.range(1, 8-Math.max(coord.x, coord.y))).chain().map(function(i){
            return coordToPosition({ x: coord.x+i, y: coord.y+i })
          }).each(addToMovesWithCollide);
        }
        if(coord.x>0 && coord.y<7) {
          collide = false;
          _(_.range(1, Math.max(coord.x-1, 8-coord.y))).chain().map(function(i){
            return coordToPosition({ x: coord.x-i, y: coord.y+i })
          }).each(addToMovesWithCollide);
        }
        if(coord.x<7 && coord.y>0) {
          collide = false;
          _(_.range(1, Math.max(8-coord.x, coord.y-1))).chain().map(function(i){
            return coordToPosition({ x: coord.x+i, y: coord.y-i })
          }).each(addToMovesWithCollide);
        }
        if(coord.x>0 && coord.y>0) {
          collide = false;
          _(_.range(1, Math.max(coord.x, coord.y)-1)).chain().map(function(i){
            return coordToPosition({ x: coord.x-i, y: coord.y-i })
          }).each(addToMovesWithCollide);
        }
      }
      if(piece.type == 'knight') {
        var deltas = [
          {x:1, y:2}, {x:1, y:-2},
          {x:-1,y:2}, {x:-1,y:-2},
          {y:1, x:2}, {y:1, x:-2},
          {y:-1,x:2}, {y:-1,x:-2}
        ];
        for(var k in deltas) {
          var delta = deltas[k];
          var c = _.clone(coord);
          c.y += delta.y;
          c.x += delta.x;
          var pos = coordToPosition(c);
          var p = map[pos];
          if(!p || p.color!=piece.color)
            moves.push(pos);
        }
      }
      if(piece.type == 'king') {
        for(var x = coord.x-1; x <= coord.x+1; ++x) {
          for(var y = coord.y-1; y <= coord.y+1; ++y) {
            var pos = coordToPosition({ x: x, y: y });
            var p = map[pos];
            if(!p || p && p.color!=piece.color)
              moves.push(pos);
          }
        }
        var y = piece.color=='white' ? 0 : 7;
        if(coord.x==4 && coord.y==y 
           && !map[coordToPosition({ x: 5, y: y })] 
           && !map[coordToPosition({ x: 6, y: y })] ) {
          var c = map[coordToPosition({ x: 7, y: y })];
          if(c && c.type=='rook' && c.color==piece.color) {
            moves.push(coordToPosition({ x: 6, y: y }));
          }
        }
      }
      if(piece.type == 'pawn') {
        var sens = piece.color=='white' ? 1 : -1;
        var c = _.clone(coord);
        c.y += sens;
        var pos = coordToPosition(c);
        var p = map[pos];
        if(!p) {
          moves.push(pos);
          c.y += sens;
          pos = coordToPosition(c);
          p = map[pos];
          if(!p && (piece.color=='white' && coord.y==1 
          || piece.color=='black' && coord.y==6)) {
            moves.push(pos);
          }
          c.y -= sens;
        }
        c.x += 1;
        pos = coordToPosition(c);
        p = map[pos];
        if( p && p.color!=piece.color ) {
          moves.push(pos);
        }
        c.x -= 2;
        pos = coordToPosition(c);
        p = map[pos];
        if( p && p.color!=piece.color ) {
          moves.push(pos);
        }
      }
      
      moves = _.reject(moves, function(pos){
        var coord = positionToCoord(pos);
        return coord.x<0 || coord.x>=8 ||
               coord.y<0 || coord.y>=8;
      });
      return moves;
    }

    self.getMoves = function(piece, map) {
      if(!map) map = self.generateCurrentMap();
      return _.reject(self.getVisibles(piece, map), function(pos){
        var p = map[pos];
        return p && p.type=='king';
      });
    }


  }
}(window.Game={}, window.jQuery||window.Zepto));
