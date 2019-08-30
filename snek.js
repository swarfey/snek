'use strict'
var keypress = require('keypress');
var colors = require('colors')
const { spawn } = require("child_process");

const child = spawn('start node anal.js');
child.on('close', (code) => {
    console.log(code)
});

const width = process.stdout.columns - 1
const height = process.stdout.rows - 3

var reqPage = 1

keypress(process.stdin);
process.stdin.on('keypress', function (ch, key) {
    if (key && key.ctrl && key.name == 'c') {
      process.exit();
    }
    switch(key.name) {
        case("i") :
            init()
            break;
        case("c") :
            spawnCreature(Math.floor(Math.random() * (width-2)), Math.floor(Math.random() * (height-2)), ((Math.random() * 2) + 1).toFixed(2), 1)
        case("d") :
            if(reqPage+1 > Population.length) return;
            reqPage += 1
            selectCreature(reqPage-1)
            break;
        case("a") :
            if(reqPage-1 <= 0) return;
            reqPage -= 1
            selectCreature(reqPage-1)
            break;
        case("w") :
            if(foodStep != 100) foodStep+=1
            break;
        case("s") :
            if(foodStep != 0) foodStep-=1
            break;
    }
});
process.stdin.setRawMode(true);
process.stdin.resume();
keypress.enableMouse(process.stdout);

const sprsheet = [' ', '█', 'C', 'π', '©']
var rows = new Array()



class Tile {
    constructor(x,y,spr,properties,clr) {
        this.x = parseInt(x)
        this.y = parseInt(y)
        this.sprite = spr.toString()
        this.properties = properties.toString()
        this.color = clr
        this.createdAt = Date.now()
        this.age = function() {return Date.now() - createdAt}
    };
};
class Row {
    constructor(y) {
        this.tiles = new Array();
        for(var i = 0; i <= width-1; i++) {
            this.tiles.push(new Tile(i,y,sprsheet[0],'empty'))
        };
    }

}
class Creature {
    constructor(x,y,speed, gen) {
        this.id = Math.floor(Math.random() * 1000);
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.energy = 100;
        this.path = new Array();
        this.generation = gen || 1;
        this.foodEaten = 0;
        this.target = new Object();
        this.selected = false;
        this.defaultTarget = randomFreePosition();
    }
}
class Food {
    constructor(x,y) {
        this.x = x;
        this.y = y;
        this.energy = Math.floor(Math.random() * 100) + 1;
        this.expiration = Date.now() + (Math.floor(Math.random() * 30000) + 1);
    }
}
var availableFood = new Array()
var Population = new Array()

function selectCreature(i) {
    Population.forEach(c => {
        if(Population.indexOf(c) != i) {
            c.selected = false
        } else c.selected = true
    })
}

function updateTile(x,y,sprite,properties) {
    rows[y].tiles[x] = new Tile(x,y,sprite,properties)
}
var step = 0;
function init() {

    rows.length = 0;
    Population.length = 0;
    availableFood.length = 0;
    step = 0;
    for(let i = 0; i <= height-1; i++) {
        rows.push(new Row(i));
    };
    rows.forEach(r => {
        r.tiles.forEach(t => {
            if(t.x == 0 || t.y == 0 || t.x == width-1 || t.y == height-1) {
                updateTile(t.x,t.y,sprsheet[1], 'border')
            }
        })
    })
}
function drawWorld(rows) {
    console.clear()
    var str = ''
    rows.forEach(r => {
        r.tiles.forEach(t => {
            str += t.sprite
        });
        str += '\n';
    });
    console.log(str)
}
function randomFreePosition() {
    while(true) {
        let randomx = parseInt(`${Math.floor(Math.random() * width)}`);
        let randomy = parseInt(`${Math.floor(Math.random() * height)}`);
        if(rows[randomy].tiles[randomx].properties == 'empty') {
            return {x: randomx, y: randomy}
        };
    };
}
function spawnCreature(x,y,speed,gen) {
    let variencex = 1;
    let variencey = 1;
    while(true) {
        if(variencex > 10 || variencey > 10) {
            console.log('COULDNT FIND NEARBY TILE'.red)
            break;
        }
        var row = rows[y + (Math.round(Math.random() * variencex))]
        if(row) {
            var tile = row.tiles[x + (Math.round(Math.random() * variencey))]
            if(tile) {
                if(tile.properties == 'empty') {
                    Population.push(new Creature(tile.x,tile.y,speed,gen));
                    updateTile(tile.x,tile.y,sprsheet[2], 'creature');
                    break;
                } else {
                    variencex++
                    variencey++
                }
            } else variencey++
        } else variencex++
    }
}
function spawnFood() {
    while(true) {
        let randomx = parseInt(`${Math.floor(Math.random() * width)}`);
        let randomy = parseInt(`${Math.floor(Math.random() * height)}`);
        if(rows[randomy].tiles[randomx].properties == 'empty') {
            availableFood.push(new Food(randomx, randomy))
            updateTile(randomx,randomy,sprsheet[3], 'food')
            break;
        }
    }
}
function nearestFood(creature) {
    var shortest = Infinity
    var shortestCoords = {x: undefined, y: undefined}
    for(var i = 0; i < availableFood.length; i++) {
        let foodx = availableFood[i].x
        let foody = availableFood[i].y
        let path = pathFind(creature, foodx, foody)
        if(path.length < shortest) {
            shortest = path.length
            shortestCoords = {x: foodx, y: foody}
        }
    }
    return shortestCoords
}
function nearestCreature(creature) {
    var shortest = Infinity
    var shortestCoords = {x: undefined, y: undefined}
    for(var i = 0; i < Population.length; i++) {
        if(creature.id != Population[i].id && Population[i].energy > 80) {
            let cx = Population[i].x
            let cy = Population[i].y
            let path = pathFind(creature, cx, cy)
            if(path.length < shortest) {
                shortest = path.length
                shortestCoords = {x: cx, y: cy}
            }
        }
    }
    return shortestCoords
}
function cuddle(creatureA, creatureB, x, y) {
    while(creatureA.energy > 120 && creatureB.energy > 80) {
        creatureA.energy -= 50
        creatureB.energy -= 50
        let gen = creatureA.generation >= creatureB.generation ? creatureA.generation + 1 : creatureB.generation + 1
        let speed = ([creatureA.speed, creatureB.speed].map((c, i, arr) => c / arr.length).reduce((p, c) => c + p)) + ((Math.floor(Math.random() * 10) - 5) / 100 )
        spawnCreature(x + Math.floor(Math.random() * 2),y + Math.floor(Math.random() * 2),speed,gen)
    }
}
function creatureStepper(step) {
    Population.forEach(c => {

        if(c.x == c.defaultTarget.x && c.y == c.defaultTarget.y) c.defaultTarget = randomFreePosition();

        c.target = c.energy >= 120 ? nearestCreature(c) : nearestFood(c)
        if(!c.target.x) c.target = nearestFood(c)
        if(!c.target.x) c.target = c.defaultTarget;
        c.path = pathFind(c, c.target.x, c.target.y)
        
        if(c.speed <= 1 && step % 10 == 0) {
            walk(c);
        } else if(c.speed > 1 && c.speed < 3 && step % 5 == 0) {
            walk(c);
        } else if(c.speed >= 3 && step % 3 == 0) {
            walk(c);
        }
    })
}
function walk(creature) {
    if(creature.path.length < 1) return
    creature.energy--
    if(creature.energy <= 0) {
        updateTile(creature.x,creature.y,sprsheet[0],'empty');
        return Population.splice(Population.indexOf(creature),1)
    }
    updateTile(creature.x,creature.y,sprsheet[0],'empty')
    creature.x += creature.path[0].x
    creature.y += creature.path[0].y
    creature.path.shift();
}
function pathFind(creature, x, y) {
    var path = new Array()
    if(creature.x >= x) {
        for(var i = 0; i <= (creature.x - x) - 1; i++) {
            path.push({x: -1,y: 0})
        }
    } else {
        for(var i = 0; i <= (x - creature.x) - 1; i++) {
            path.push({x: 1,y: 0})
        }
    }
    if(creature.y >= y) {
        for(var i = 0; i <= (creature.y - y) - 1; i++) {
            path.push({x: 0,y: -1})
        }
    } else {
        for(var i = 0; i <= (y - creature.y) - 1; i++) {
            path.push({x: 0,y: 1})
        }
    }
    return shuffle(path);
    
}
function shuffle(a) {
    return a.sort((a,b) => 0.5 - Math.random()); 
};
init()
var foodStep = 10
setInterval(() => {
    Population.forEach(c => {
        availableFood.forEach((f,index) => {
            if(f.x == c.x && f.y == c.y) {
                c.energy += f.energy
                c.foodEaten++
                availableFood.splice(index, 1);
            }
        })
        Population.forEach(c2 => {
            if(c.id != c2.id && c.x == c2.x && c.y == c2.y) {
                if(c.energy >= 120) {
                    cuddle(c,c2,c.x,c.y)
                } else {
                    c.path = [{x: Math.floor(Math.random()),y: Math.floor(Math.random())}];
                }
            }
        })
        if(!c.selected) {
            if(c.energy <= 40) updateTile(c.x,c.y,sprsheet[2].red,'creature')
            if(c.energy > 40 && c.energy < 120) updateTile(c.x,c.y,sprsheet[2].yellow,'creature')
            if(c.energy >= 120) updateTile(c.x,c.y,sprsheet[2].green,'creature')
        } else {
            if(c.energy <= 40) updateTile(c.x,c.y,sprsheet[4].red,'creature')
            if(c.energy > 40 && c.energy < 120) updateTile(c.x,c.y,sprsheet[4].yellow,'creature')
            if(c.energy >= 120) updateTile(c.x,c.y,sprsheet[4].green,'creature')
        }
    })
    drawWorld(rows)

    if(Math.random() * 100 <= foodStep) {
        spawnFood()
    }

    step++
    if(step > 100) {
        step = 0;

    }

    creatureStepper(step)
    availableFood.forEach((f, index) => {
        let expiresIn = f.expiration - Date.now()
        if(0 >= expiresIn) {
            availableFood.splice(index, 1)
            updateTile(f.x,f.y,sprsheet[0],'empty')
        }
        if(expiresIn > 0 && expiresIn <= 5000) updateTile(f.x,f.y,sprsheet[3].magenta, 'food')
        if(expiresIn > 5000 && expiresIn <= 15000) updateTile(f.x,f.y,sprsheet[3].blue, 'food')
        if(expiresIn > 15000) updateTile(f.x,f.y,sprsheet[3].cyan, 'food')
    })
    
    try{console.log(`S ${step.toString().padStart(3, "0").red}, F${foodStep.toString().cyan}, C ${reqPage}/${Population.length}: ID ${Population[reqPage-1].id.toString().green}, gen: ${Population[reqPage-1].generation.toString().green}, ` + `{x: ${Population[reqPage-1].x}, y: ${Population[reqPage-1].y}}`.yellow + `, speed: ${Population[reqPage-1].speed}, energy: ${Population[reqPage-1].energy.toString().red}, score: ${Population[reqPage-1].foodEaten.toString().green}, path length: ${Population[reqPage-1].path.length.toString().green}, target: ` + `{x: ${Population[reqPage-1].target.x}, y: ${Population[reqPage-1].target.y}}`.yellow)}catch(error){console.log('NO DATA'.red)} 
}, 100);
