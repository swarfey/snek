const cfg = require(`./cfg.js`)
if(!cfg) {
    cfg = {
        height: "auto",
        width: "auto",

        speed: 100,

        randomObstacles: false,

        randomObstacleChance: 20,

        pathFind : false
    }
}

const height = cfg.height == "auto" ? process.stdout.rows - 3 : isNaN(cfg.height) ? process.stdout.rows -3 : parseInt(cfg.height);
const width = cfg.wdith == "auto" ? process.stdout.columns - 1 : isNaN(cfg.width) ? process.stdout.columns -1 : parseInt(cfg.width);
const hh = Math.floor(height / 2)
const hw = Math.floor(width / 2)

console.log(width)

var Highscore = 0

var stdin = process.openStdin();
stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8')

var rows = new Array();

var Player = {
    x: hw,
    y: hh,
    body: [{x: hw -1, y: hh}, {x: hw -2, y: hh}, {x: hw -3, y: hh}],
    score: 0,
    velx: 1,
    vely: 0,
};

function init() {
    rows = new Array()
    Player = {
        x: hw,
        y: hh,
        body: [{x: hw -1, y: hh}, {x: hw -2, y: hh}, {x: hw -3, y: hh}],
        score: 0,
        velx: 1,
        vely: 0,
    };
    var rownum = 0;
    while(rows.length < height) {
        cellnum = 0;
        row = {
            num: rownum,
            cells: new Array()
        }
        while(row.cells.length < width) {
            cell = {
                x: cellnum,
                y: rownum,
                str: ' ',
                state: 'tile'
            }
            if(cell.x == 0 || cell.y == 0 || cell.x == width-1 || cell.y == height-1) cell.state = 'border'
            row.cells.push(cell)
            cellnum++;
        }
    rows.push(row);
    rownum++;
    };
    console.log(rows)
    while(true) {
        let randomx = parseInt(`${Math.floor(Math.random() * width)}`);
        let randomy = parseInt(`${Math.floor(Math.random() * height)}`);
        if(rows[randomy].cells[randomx].state == 'tile') {
            updateCell(randomx,randomy, 'food')
            break;
        }
    };
};
function updateCell(x,y,state) {
    var row = rows[y]
    if(row) {
        var cell = row.cells[x]
        if(cell) {
            rows[y].cells[x].state = state;
        }
    }
};

function writeToScreen(rows) {
    console.clear()
    str = ''
    rows.forEach(r => {
        r.cells.forEach(c => {
            switch(c.state) {
                case 'tile' :
                    str += ' '
                    break;
                case 'food' :
                    str += 'π'
                    break;
                case 'border' :
                    str += '█'
                    break;
                case 'head' :
                    str += '⚇'
                    break;
                case 'body' :
                    str += '○'
            }
        })
        str += '\n'
    })
    console.log(str)
};
function changeVelocity(x,y) {
    if((Player.velx == 1 && x == -1) || (Player.vely == 1 && y == -1) || (Player.velx == -1 && x == 1) || (Player.vely == -1 && y == 1)) return
    Player.velx = x;
    Player.vely = y;
}
function movePlayer(x,y) {
    for (let i = Player.body.length - 1; i >=0 ; i--) {
        let b = Player.body[i]
        if(i == Player.body.length-1) updateCell(b.x, b.y, 'tile')
        if(i == 0) {b.x = Player.x, b.y = Player.y}
        if(i != 0) {b.x = Player.body[i-1].x, b.y = Player.body[i-1].y}
        updateCell(b.x, b.y, 'body')
    };
    Player.x += x;
    Player.y += y;
    switch(rows[Player.y].cells[Player.x].state) {
        case("food") :
            eat(Player.x, Player.y)
            break;
        case("border") :
            init()
            break;
        case("body") :
            init()
            break;
    }
    updateCell(Player.x, Player.y, 'head')
}
function spawnRandomObstacle() {
    while(true) {
        let randomx = parseInt(`${Math.floor(Math.random() * width)}`);
        let randomy = parseInt(`${Math.floor(Math.random() * height)}`);
        if(rows[randomy].cells[randomx].state == 'tile') {
            updateCell(randomx,randomy, 'border')
            break;
        }
    }
};
function eat(x,y) {
    updateCell(x,y,'tile')
    console.log('\007')
    while(true) {
        let randomx = parseInt(`${Math.floor(Math.random() * width)}`);
        let randomy = parseInt(`${Math.floor(Math.random() * height)}`);
        if(rows[randomy].cells[randomx].state == 'tile') {
            updateCell(randomx,randomy, 'food')
            break;
        }
    }
    Player.body.push({x: Player.body[Player.body.length-1].x, y: Player.body[Player.body.length-1].y})
    Player.score++;
    if(Player.score > Highscore) Highscore = Player.score
};
function findFood() {
    for(var i = 0; i < rows.length; i++) {
        for(var j = 0; j < rows[i].cells.length; j++) {
            if(rows[i].cells[j].state == 'food') {
                return {x: rows[i].cells[j].x, y: rows[i].cells[j].y};
            };
        };
    };
};
function pathFind(creature) {
    var target = findFood();
    var path = [];
    if(creature.x >= target.x) {
        for(var i = 0; i <= (creature.x - target.x) - 1; i++) {
            path.push({x: -1,y: 0})
        }
    } else {
        for(var i = 0; i <= (target.x - creature.x) - 1; i++) {
            path.push({x: 1,y: 0})
        }
    }
    if(creature.y >= target.y) {
        for(var i = 0; i <= (creature.y - target.y) - 1; i++) {
            path.push({x: 0,y: -1})
        }
    } else {
        for(var i = 0; i <= (target.y - creature.y) - 1; i++) {
            path.push({x: 0,y: 1})
        }
    };
    path = path.sort((a,b) => 0.5 - Math.random()); 
    var count = 0;
    while(rows[creature.y + path[0].y].cells[creature.x + path[0].x].state.match(/^(?!tile$|food$).*/)) {
        path = path.sort((a,b) => 0.5 - Math.random()); 
        count++;
        if(count > 100) {
            path.push({x: 1, y: 0});
            path.push({y: 1, x: 0});
        };
        if(count > 5000) break;
    };
    changeVelocity(path[0].x, path[0].y);
};
init()

setInterval(() => {
    movePlayer(Player.velx, Player.vely)
    writeToScreen(rows);
    console.log(`Score: ${Player.score}, Highscore: ${Highscore}`)
    if(cfg.randomObstacles == true && Math.random() * 100 <= cfg.randomObstacleChance) {
        spawnRandomObstacle()
    } 
    
    pathFind(Player);
}, cfg.speed);

stdin.on('data', key => {
    if(key === '\u0003') process.exit(200);

    switch(key) {
        case("w") :
            changeVelocity(0,-1)
            break;
        case("s") :
            changeVelocity(0,1)
            break;
        case("a") :
            changeVelocity(-1,0)
            break;
        case("d") :
            changeVelocity(1,0)
            break;
        case("r") :
            init()
            break;
        case("+") :
            Player.body.push({x: Player.body[Player.body.length-1].x, y: Player.body[Player.body.length-1].y})
            break;
        case("-") :
            if(Player.body.length > 2) Player.body.splice(-1,1)
            break;

    }
})
