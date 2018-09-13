"use strict";

/**
 * User sessions
 * @param {Array} users
 */
const users = [];

/**
 * Find opponent for a user
 * @param {User} user
 */
function findOpponent(user) {
	for (let i = 0; i < users.length; i++) {
		if (user !== users[i] && users[i].opponent === null && !users[i].ready) {
            console.log(users[i].socket.id, users[i].ready);
			new Game(user, users[i]).match();
		}
	}
}

/**
 * Remove user session
 * @param {User} user
 */
function removeUser(user) {
	users.splice(users.indexOf(user), 1);
}

/**
 * Game class
 */
class Game {

	/**
	 * @param {User} user1 
	 * @param {User} user2 
	 */
	constructor(user1, user2) {
		this.user1 = user1;
		this.user2 = user2;
	}

	/**
	 * New game ready to be launched
	 */
	match() {
		this.user1.match(this, this.user2);
		this.user2.match(this, this.user1);
	}
    
    // Launch countdown
    count() {
		this.user1.count(this, this.user2);
		this.user2.count(this, this.user1);
    }
   
    reset() {
        this.user1.ready = false;
        this.user2.ready = false;
    }

}

/**
 * User session class
 */
class User {

	/**
	 * @param {Socket} socket
	 */
	constructor(socket) {
		this.socket = socket;
		this.game = null;
		this.opponent = null;
        this.ready = false;
	}

	/**
	 * Set guess value
	 * @param {number} guess
	 */
	setGuess(guess) {
		return true;
	}

	/**
	 * Start new game
	 * @param {Game} game
	 * @param {User} opponent
	 */
	match(game, opponent) {
		this.game = game;
		this.opponent = opponent;
        this.ready = false;
		this.socket.emit("match");
	}
    
    // Launch a countdown
    count(game, opponent) {
        this.socket.emit("count");
    }

	/**
	 * Terminate game
	 */
	end() {
		this.game = null;
		this.opponent = null;
		this.socket.emit("end");
	}

}

/**
 * Socket.IO on connect event
 * @param {Socket} socket
 */
module.exports = {

	io: (socket) => {
		const user = new User(socket);
		users.push(user);
        findOpponent(user); 
        
        socket.on("ready", ()=> {
            console.log("user", socket.id, "ready");
            user.ready = true;
            if (user.opponent && user.opponent.ready) user.game.count();
        });
        
        socket.on("hit", ()=> {
            console.log("user", socket.id, "HIT!", user.ready);
            if (user.opponent) user.opponent.socket.emit("opp_hit");
        });        
        socket.on("offline", ()=> {
            console.log("user", socket.id, "offline!");
            if (user.opponent) user.opponent.socket.emit("opp_off");
        });        
        socket.on("find", ()=> {
            user.ready = false;
            findOpponent(user);
        });   
        
        socket.on("win", ()=> {
            console.log("user", socket.id, "WON!");
            if (user.game) user.game.reset();
            if (user.opponent) user.opponent.socket.emit("opp_win");
        });

		socket.on("disconnect", () => {
			console.log("Disconnected: " + socket.id);
			removeUser(user);
			if (user.opponent) {
				user.opponent.end();
			}
		});

		console.log("Connected: " + socket.id);
	}

};