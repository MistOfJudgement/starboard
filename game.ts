import { Display } from "rot-js/lib/index";
class Point {
    origin(origin: any, position: any) {
        throw new Error("Method not implemented.");
    }
    x : number;
    y : number;
    constructor(x : number | {x:number, y:number}, y? :number | undefined) {
        if(typeof x === "number") {
            this.x = x;
            this.y = y!;
        } else {
            this.x = x.x;
            this.y = x.y;
        }
    }
    add(point : Point) : Point {
        return new Point(this.x + point.x, this.y + point.y);
    }
    subtract(point : Point) : Point {
        return new Point(this.x - point.x, this.y - point.y);
    }
    scale(scale : number) : Point {
        return new Point(this.x * scale, this.y * scale);
    }
    magnitude() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
    normalize() {
        let magnitude = this.magnitude();
        return new Point(this.x / magnitude, this.y / magnitude);
    }
    clone() {
        return new Point(this.x, this.y);
    }
    equals(point : Point) {
        return this.x === point.x && this.y === point.y;
    }

}

function distance(point1 : Point, point2 : Point) {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}

class Game {
    display : any = new Display({width: 80, height: 24, fontSize: 24, fontFamily: "monospace", spacing: 1.1});
    player: Player = new Player();
    world: World = new World();
    camera: Camera = new Camera();
    map!: Map;
    init() {
        document.body.appendChild(this.display.getContainer());


        this.camera.size =  new Point ( 80, 24);
        this.camera.world = this.world;
        this.camera.player = this.player;
        this.world.player = this.player;

        this.map = new Map(this.player, this.world);
        //player spawn planet
        let planet = new Planet({position: new Point(0, 0), size: 16, color: "#0f0", icon:"P"});
        planet.generateDepots(MaterialTypes.copper,7);
        planet.generateDepots(MaterialTypes.iron, 4);
        planet.generateDepots(MaterialTypes.gold, 2);
        this.world.planets.push(planet);
        this.world.generatePlanets(new Point({ x: 0, y: 0 }), new Point ({ x: 300, y: 300}));
        document.addEventListener("keydown", this.player.input.bind(this.player));
        setInterval(this.draw.bind(this), 1000 / 60);
        setInterval(this.update.bind(this), 1000 / 60);
    }

    draw() {
        this.camera.draw(this.display);
        if (this.isPlayerOnFeature() ) {
            //draws the depot menu at the top right corner

            (this.isPlayerOnFeature() as Feature).drawFeature(this.display, this.camera.topleft);
        }
    }


    update() {
        this.world.update();
    }

    findPlanetPlayerIsOn(): Planet | null {
        for(const planet of this.world.planets) {
            if(planet.inBounds(this.player.position)) {
                return planet;
            }
        }
        return null;
    }

    //returns false if the player is not on a depot, otherwise returns the depot
    isPlayerOnFeature() : Feature | false {
        let planet = this.findPlanetPlayerIsOn();
        if(planet == null) {
            return false;
        }
        for(const feature of planet.features) {

                if(Math.pow(feature.position.x - this.player.position.x, 2) + Math.pow(feature.position.y - this.player.position.y, 2) < Math.pow(1, 2)) {
                    return feature;
                }
            
        }
        return false;
    }

    
}
type Material = {
    color: string;
    icon: string;
    name: string;
}
class Feature {
    public position: Point;
    public planet!: Planet;
    public type: string = "feature"
    static description: string = "A feature";
    constructor(position : Point, planet: Planet) {
        this.position = position ?? new Point(0, 0);
        this.planet = planet;
        
    }
    public draw(display : any, topleft : Point) {
    }
    public drawFeature(display : any, topleft : Point) {
    }
    public update() {
    }
    public interact() {
    }

    public destroy() {
        this.planet.features = this.planet.features.filter((feature) => feature !== this);
    }
    static checkPlacement(position : Point, planet : Planet) : boolean {
        //default check is just is the position on the planet
        return planet.inBounds(position);
    }
};


const MaterialTypes : {[key: string]: Material} = {
    copper: {
        color: "#fa1",
        icon: "C",
        name: "Copper"
    },
    iron: {
        color: "#f11",
        icon: "I",
        name: "Iron"
    },
    gold: {
        color: "#ff0",
        icon: "G",
        name: "Gold"
    },
    diamond: {
        color: "#0ff",
        icon: "D",
        name: "Diamond"
    },
    uranium: {
        color: "#0f0",
        icon: "U",
        name: "Uranium"
    },
};

class MatDepot extends Feature {
    materials: { color: string; icon: string; name: string; };
    type: string = "matdepot"
    static description = "A deposit of materials";
    constructor(position: Point, planet: Planet, materials? : Material) {
        super(position, planet);
        this.materials = materials ?? MaterialTypes.copper;
    }

    draw(display : any, topleft : Point) {
        display.rdraw(this.position.x - topleft.x, this.position.y - topleft.y, this.materials.icon, this.materials.color);
    }
    drawFeature(display : any, topleft : Point) {
        display.drawMenu(60, 0, ["Deposit", "Materials: " + this.materials.name, "[Space] pick up"]);
    }
    //removes the depot from the planet
    //returns the materials
    crack() {
        this.planet?.removeFeature(this);
        return this.materials.name;

    }
    
    static checkPlacement(position : Point, planet : Planet) : boolean {
        if(!Feature.checkPlacement(position, planet)) {
            return false;
        }
        for(const feature of planet.features) {
            if(feature instanceof MatDepot) {
                if(Math.pow(feature.position.x - position.x, 2) + Math.pow(feature.position.y - position.y, 2) < Math.pow(1, 2)) {
                    return false;
                }
            }
        }
        return true;
    }
        
}


class World {
    planets: Planet[] = [];
    player!: Player;
    generatedPoints: Point[] = [];
    
    constructor() {


    }

    isPlayerNearBounds(direction : Point = new Point(0, 0)) {
        //if the player is outside the range of any of the generated points, return a new point to generate planets
        //treat the size as 50 units smaller when checking if the player is near the edge
        let checkDist = 150;
        let closetPoint : Point = this.generatedPoints[0];
        let newPoint = { origin: new Point({x:this.player.position.x, y:this.player.position.y}), size: new Point({x:150, y:150} )};
        newPoint.origin.x += direction.x * checkDist;
        newPoint.origin.y += direction.y * checkDist;
        for(const point of this.generatedPoints) {
            if(distance(point, this.player.position) < distance(closetPoint, this.player.position)) {
                closetPoint = point;
            }

            //if the new point is within distance of a generated point, return false
            if(distance(point, newPoint.origin) < checkDist) {
                return false;
            }
        
            //if the player is within distance of a generated point, return false
            if(distance(point, this.player.position) < checkDist) {
                return false;
            }
            
        }
        
        this.generatePlanets(newPoint.origin, newPoint.size);
        return newPoint;

    }

    draw(display: any, topleft: any, size: any) {
        this.planets.forEach(element => {
            element.draw(display, topleft, size);
        });
        this.player.draw(display, topleft);
    }
    
    update() {
        for(const planet of this.planets) {
            planet.update();
        }
    }
    randColor() {
        let colorOptions = "456789abcd";
        let color = "#";
        for(let i = 0; i < 3; i++) {
            color += colorOptions[Math.floor(Math.random() * colorOptions.length)];
        }
        return color;
    }
    generatePlanets(origin : Point, size : Point) {
        console.log("generating planets at " + origin.x + ", " + origin.y);
        let iter = 0;
        for (let i = 0; i < 20; i++) {
            let p = new Planet({ position: new Point({x:0, y:0}), size: Math.round(Math.random() * 12 + 5), color: this.randColor(), icon: "O" });
            do {
                p.position.x = Math.round(Math.random() * size.x - size.x/2 + origin.x);
                p.position.y = Math.round(Math.random() * size.y - size.y/2 + origin.y);
                if(iter++ > 1000) {
                    console.log("error generating planets");
                    this.generatedPoints.push( origin);
                    return;
                }
            } while(this.isPlanetTooClose(p));
            p.generateDepots();
            this.planets.push(p);
        }
        this.generatedPoints.push( origin);
    }
    
    isPlanetTooClose(planet : Planet) {
        for(const p of this.planets) {
            if(Math.pow(p.position.x - planet.position.x, 2) + Math.pow(p.position.y - planet.position.y, 2) < Math.pow(planet.radius + p.radius+.5 , 2)) {
                return true;
            }
        }
        return false;
    }
    
    getPlanetAt(position : Point, scale : number = 1) {
        for(const planet of this.planets) {
            if(distance(planet.position, position) < scale * scale * Math.sqrt(planet.radius)) {
                return planet;
            }
        }
        return null;
    }
}
 class Camera {
    player!: Player;
    world!: World;
    topleft:Point = new Point(0, 0);
    size: Point = new Point(0, 0);

    static alertMessage: string = "";
    static alertTime: number = 0;
    constructor () {
    
    }
    //Draws using the Rot display object
    draw(display : any) {

       //override the draw function to round the coordinates
        display.rdraw = function(x: number, y: number, ch: any, fg: any, bg: any) {
            this.draw(Math.round(x), Math.round(y), ch, fg, bg);
        }
            
        display.drawMenu = function(x: any, y: number, lines: string | any[]) {
            for(let i = 0; i < lines.length; i++) {
                this.drawText(x, y + i, lines[i]);
            }
        }

        display.width = this.size.x;
        display.height = this.size.y;
        //clear display
        display.clear();

        //update topleft so that the player is in the center
        this.topleft.x = this.player.position.x - this.size.x / 2;
        this.topleft.y = this.player.position.y - this.size.y / 2;

        this.world.draw(display, this.topleft, this.size);

        if(Camera.alertTime > 0) {
            //top 
            display.drawMenu(20, 0, [Camera.alertMessage]);
            Camera.alertTime--;
            if(Camera.alertTime == 0) {
                Camera.alertMessage = "";

            }
        }

    }
}

class Planet {
    radius : number;
    position: Point;
    features: Feature[] = [];
    color: any;
    icon: any;

    ratio : number = 2.5;//ratio of height to width
    constructor(params: { position: Point; size: number; color: string; icon: string; }) {
        this.position = params.position;
        //size is a float
        this.radius = params.size;//radius
        this.color = params.color;
        this.icon = params.icon;
        this.features = [];
    }


    generateDepots(matType? : Material, num? : number) {
        // let depotType = MaterialTypes[Object.keys(MaterialTypes)[Math.floor(Math.random() * Object.keys(MaterialTypes).length)]];
        let depotType = matType || MaterialTypes[Object.keys(MaterialTypes)[Math.floor(Math.random() * Object.keys(MaterialTypes).length)]];

        for (let i = 0; i < (num ?? this.radius); i++) {
            //make sure the depot is in the planet
            let temp = new Point(0, 0);
            do {
                temp = new Point(Math.round(Math.random() * this.radius * 2 - this.radius), Math.round(Math.random() * this.radius * 2 - this.radius));
                temp = temp.add(this.position);
            } while(this.inBounds(temp) == false);
            // temp = temp.add(this.position);
            let dep = new MatDepot(temp, this, depotType);

            this.features.push(dep);
            
        }
        //remove overlapping depots
        for(let i = 0; i < this.features.length; i++) {
            for(let j = i + 1; j < this.features.length; j++) {
                //depots are pixel perfect
                if(this.features[i].position.x == this.features[j].position.x && this.features[i].position.y == this.features[j].position.y) {
                    this.features.splice(j, 1);
                    j--;
                }
            }
        }
    }
    removeFeature(feature: Feature) {
        this.features = this.features.filter(f => f !== feature);
    }
    
    inBounds(point: Point) {
        return Math.pow(point.x - this.position.x, 2) + this.ratio*Math.pow(point.y - this.position.y, 2) < Math.pow(this.radius, 2);
    }

    draw(display :any, topleft : Point, size : Point) {
        //draw circular planet
        //dont draw if out of bounds
        if(this.position.x + this.radius < topleft.x || this.position.x - this.radius > topleft.x + size.x) {
            return;
        }
        if(this.position.y + this.radius < topleft.y || this.position.y - this.radius > topleft.y + size.y) {
            return;
        }
        //draw planet
        for (let x = this.position.x - this.radius; x < this.position.x + this.radius; x++) {
            for (let y = this.position.y - this.radius; y < this.position.y + this.radius; y++) {
                if(this.inBounds(new Point(x, y))){
                    display.rdraw(x - topleft.x, y - topleft.y, this.icon, this.color, this.color);
                }
            }
        }
        
        //draw features
        this.features.forEach(element => {
            element.draw(display, topleft);
        });
    }

    update() {
        this.features.forEach(element => {
            element.update();
        });
    }

    getFeatureAt(point: Point) : Feature | undefined{
        for(let i = 0; i < this.features.length; i++) {
            if(this.features[i].position.x == point.x && this.features[i].position.y == point.y) {
                return this.features[i];
            }
        }
        return undefined;
    }
}

class Player {
    position: Point;
    mode: "grounded" | "craft" | "inventory" | "map";
    icon: string;
    color: string;
    cursor: number;
    inventory: Inventory;

    constructor() {
        this.position = new Point({ x: 0, y: 0 });
        this.mode = "grounded";
        this.icon = "@";
        this.color = "#fff";
        this.cursor = 0;
        this.inventory = new Inventory();

    }

    draw(display :any, topleft :Point) {
        display.rdraw(this.position.x - topleft.x, this.position.y - topleft.y, this.icon, this.color);
        this.inventory.draw(display, topleft);
        if (this.mode == "craft") {
            //draw the recipe list at the bottom
            let count = Object.keys(RecipeList).length;
            let i = 0;

            for(let re in RecipeList) {
                
                RecipeList[re].draw(display, new Point({ x: 2, y: game.camera.size.y - count + i  }));
                i++;
            }
            
            //draw the cursor
            display.draw(0, display._options.height - count + this.cursor, ">");
        } else if (this.mode == "inventory") {
            display.draw(0, this.cursor, ">");
        } else if(this.mode == "map") {
            game.map.draw(display, topleft);
        }

        if(this.mode!=="grounded") {
            Camera.alertMessage= "Menu Open. Press 'q' to close";
            Camera.alertTime = 4;
        }
    }

    move(direction :Point) {
        if (this.mode == "grounded" || this.mode == "map") {
            this.position.x += direction.x ;
            this.position.y += direction.y ;

            game.world.isPlayerNearBounds(direction);
        } else if (this.mode == "craft") {
            this.cursor += direction.y;
            if (this.cursor < 0) {
                this.cursor = 0;
                audio.playSound('error');
            } else if (this.cursor >= Object.keys(RecipeList).length) {
                this.cursor = Object.keys(RecipeList).length- 1;
                audio.playSound('error');

            } else {
                audio.playSound("menu")
            }
        } else if (this.mode == "inventory") {
            this.cursor += direction.y;
            if (this.cursor < 0) {
                this.cursor = 0;
                audio.playSound('error');

            }
            else if (this.cursor >= this.inventory.length()) {
                this.cursor = this.inventory.length() - 1;
                audio.playSound('error');

            } else {
                audio.playSound("menu")

            }
        }

        
    }

    
    action() {
        //check if there is a depot
        //if there is, crack it open
        if(this.mode == "grounded") {
            let depot = game.isPlayerOnFeature();
            if(depot) {
                if (depot instanceof MatDepot) {
                    let res = depot.crack();
                    //add the resource to the inventory
                    if (!this.inventory.materials[res])
                        this.inventory.materials[res] = 0;
                    this.inventory.materials[res]++;
                } else if ((depot as any).inventory instanceof Inventory) {
                    let inv : Inventory = (depot as any).inventory;
                    for(let mat in inv.materials) {
                        if(!this.inventory.materials[mat]) {
                            this.inventory.materials[mat] = 0;
                        }
                        this.inventory.materials[mat] += inv.materials[mat];
                    }
                    //destroy the depot after it is emptied
                    depot.destroy();
                    depot.planet.removeFeature(depot);
                    
                }
                audio.playSound("pickup");
            }
        }
        else if(this.mode == "craft") {
            let recipe = RecipeList[Object.keys(RecipeList)[this.cursor]];
            if(recipe) {
                let canCraft = true;
                for(const mat of recipe.ingredients) {
                    if(!this.inventory.materials[mat.type] || this.inventory.materials[mat.type]  < mat.count) {
                        canCraft = false;
                        break;
                    }
                }
                if(canCraft) {
                    for(const mat of recipe.ingredients) {
                        this.inventory.materials[mat.type] -= mat.count;
                    }
                    if(!this.inventory.materials[recipe.product.type]) {
                        this.inventory.materials[recipe.product.type] = 0;
                    }
                    this.inventory.materials[recipe.product.type]+= recipe.product.count;
                }
            }
        } else if(this.mode == "inventory") {

            //if the player isn't on a planet, warn them
            if(!game.findPlanetPlayerIsOn()) {
                Camera.alertMessage = "You can't drop items in space!";
                Camera.alertTime = 60 * 2;
                audio.playSound("error");
                return;
            }
            //drop the item
            let planet = game.findPlanetPlayerIsOn() as Planet;


            let item = this.inventory.getMaterial(this.cursor);

            if (!item) {
                return;
            }
            item = item as string;
            //if the item is a material, drop it as a depot
            console.log(item);
            if(item.toLowerCase() in MaterialTypes) {
                if(!MatDepot.checkPlacement(this.position, planet)) {
                    Camera.alertMessage = "You can't place a deposit here!";
                    Camera.alertTime = 60 * 2;
                    audio.playSound("error");
                    return;
                }
                let a = new MatDepot(this.position.clone(), planet, MaterialTypes[item.toLowerCase()]);
                planet.features.push(a);
                this.inventory.materials[item]--;
            }
            else if (item in FeatureTypes) {
                if(!FeatureTypes[item].checkPlacement(this.position, planet)) {
                    Camera.alertMessage = "You can't place a " + item + " here!";
                    Camera.alertTime = 60 * 2;
                    return;
                }
                let a = new FeatureTypes[item](this.position.clone(), planet); 
                planet.features.push(a);
                this.inventory.materials[item]--;
            }
            

        }
    }
    input(event :any) {
        let direction = new Point({ x: 0, y: 0 });
        switch (event.keyCode) {
            //left or a
            case 37:
            case 65:
                direction.x = -1;
                break;

            //up or w
            case 38:
            case 87:
                direction.y = -1;
                break;

            //right or d
            case 39:
            case 68:
                direction.x = 1;
                break;
            
            //down or s
            case 83:
            case 40:
                direction.y = 1;
                break;
            case 32:
                this.action();
                break;
            //e is switch mode
            case 69:
                this.mode = this.mode == "craft" ? "grounded" : "craft";
                this.cursor = 0;
                break;
            //i is inventory
            case 73:
                this.mode = this.mode == "inventory" ? "grounded" : "inventory";
                if(this.mode == "inventory" && this.inventory.length() == 0) this.mode = "grounded"
                this.cursor = 0;
                break;

            //q is always to grounded
            case 81:
                this.mode = "grounded";
                this.cursor = 0;
                break;
            //m is to map
            case 77:
                this.mode = this.mode == "map" ? "grounded" : "map";
                this.cursor = 0;
                break;

            //plus and minus are to zoom
            case 187:
                game.map.scalingFactor += 0.1;
                break;
            case 189:
                game.map.scalingFactor -= 0.1;
                break;

        }
        this.move(direction);
            
        
    }
}
type MatSlot = { type: string; count: number; };
class Inventory {
    materials: { [key: string]: number } = {};
    constructor() {
            
    }

    length() {
        return Object.keys(this.materials).length;
    }

    getMaterial(index:number) {
        let i = 0;
        for(let mat in this.materials) {
            if(i == index) {
                return mat;
            }
            i++;
        }
        return null;
    }

    draw(display :any, topleft : Point, offset = new Point({ x: 0, y: 0 })) {
        //draw a box in the top left corner
        //draw the materials in the box
        let y = 0;
        for (let material in this.materials) {
            display.drawText(1 + offset.x, offset.y + y++, material + ": " + this.materials[material]);

        }


    }

}

class Recipe {
    ingredients: MatSlot[];
    product: MatSlot;
    constructor(options: { ingredients: MatSlot[]; product: MatSlot; }) {
        this.ingredients = options.ingredients;
        this.product = options.product;
    }
    ingredientString(ing : { count: number; type: string; }) {
        return ing.count + "x" + ing.type;
    }
    draw(display : any, offset : Point) {
        let x = offset.x;
        let y = offset.y;
        //for each ingredient, check if the player has enough
        //if they do, draw it normally
        //if they dont, draw it red
        //recipies are rendered like "4x Copper, 2x Iron, 1x Gold -> 1x Robot"
        //format specifiers look like %c{name}/%b{name}
        for(const ing of this.ingredients) {
            if(game.player.inventory.materials[ing.type] >= ing.count) {
                display.drawText(x, y, "%c{}" +this.ingredientString(ing));
            } else {
                display.drawText(x, y, "%c{#f00}" + this.ingredientString(ing));
            }
            x += this.ingredientString(ing).length;
            
            //draw a plus if there are more ingredients
            if(this.ingredients.indexOf(ing) != this.ingredients.length - 1) {
                display.drawText(x, y, "+");
                x += 1;
            }

        }
        display.drawText(x, y, "->");
        x += 2;
        display.drawText(x, y, this.ingredientString(this.product));
        x += this.ingredientString(this.product).length;
        display.drawText(x+3, y, "[" + (FeatureTypes[this.product.type]?.description ?? "Crafting Component") + "]", "#fff", "#000");


    }

}

class Robot extends Feature{
    icon: string;
    color: string;
    framesSinceLastMove: number;
    framesPerMove: number;
    inventory: Inventory;
    reachedCenter = false;
    fuel = 60 * 60 / 20;
    type = "robot";
    name = "Robot";
    static description = "Wanders and Collects.";
    constructor(position : Point, planet : Planet) {
        super(position, planet);
        this.icon = "R";
        this.color = "#0ff";
        this.framesSinceLastMove = 0;
        this.framesPerMove = 20;
        this.inventory = new Inventory();
    }

    draw(display : any, topleft : Point) {
        display.rdraw(this.position.x - topleft.x, this.position.y - topleft.y, this.icon, this.color);
    }

    drawFeature(display : any, topleft : Point) {
        let y = 0;
        display.drawMenu(60, 0, [this.name, "Fuel: " + this.fuel]);
        y+=2
        if(this.fuel <= 0) {
            display.drawMenu(60, y++, ["[space] to pickup"]);
        }
        display.drawMenu(60, y, Object.keys(this.inventory.materials).map(m => m + ": " + this.inventory.materials[m]));
        
            
    }

    
    update() {
        if(this.planet.getFeatureAt(this.position) instanceof RobotFactory) {
            let factorio = this.planet.getFeatureAt(this.position) as RobotFactory
            if(!factorio.robotType) {
                factorio.robotType = this;
                this.planet.removeFeature(this);
                this.fuel = 0;
            }
        }
        this.framesSinceLastMove++;
        if(this.framesSinceLastMove >= this.framesPerMove) {
            this.framesSinceLastMove = 0;
            this.move();
        }
        
    }

    move() {
        if(this.fuel <= 0) {
            return;
        }
       //random moves it is midnight i cant think
         let direction = new Point({x: 0, y: 0});
            let rand = Math.random();
            if(rand < 0.25) {
                direction.x = -1;
            }
            else if(rand < 0.5) {
                direction.x = 1;
            }
            else if(rand < 0.75) {
                direction.y = -1;
            }
            else {
                direction.y = 1;
            }
        //clamp the direction so the robot doesnt go off the planet
        //if the robot would go off the planet, dont move it
        if(!this.planet.inBounds(this.position.add(direction))) {
            this.move();//try again
            return;
        }
        this.fuel--;
        this.position = this.position.add(direction);
        this.tryPickup();
    }

    tryPickup() {
        //check if there is a material at the robot's position
        //if there is, add it to the inventory
        let mat = this.planet.getFeatureAt(this.position);
        if(mat && mat instanceof MatDepot) {
            if(!this.inventory.materials[mat.materials.name]) {
                this.inventory.materials[mat.materials.name] = 0;
            }
            this.inventory.materials[mat.materials.name]++;
            this.planet.removeFeature(mat);
        }
    }


    interpolateSpiral(center:Point, radius :number, step :number) {
        //slow down when we get further out
        let angle = step * Math.PI * 2 / 360;
        let x = center.x + radius * Math.cos(angle);
        let y = center.y + radius * Math.sin(angle);
        

        return new Point({x: x, y: y});
    }

    distToCenter() {
        let x = this.planet.radius - this.position.x;
        let y = this.planet.radius - this.position.y;
        
        return Math.sqrt(x * x + y * y);
    }
    dirToCenter () {
        let dest = this.planet.position.subtract(this.position);
        return dest.normalize();
    }

}

class SuperRobot extends Robot {
    type = "superrobot";
    name="SuperRobot";
    static description = "Wanders and Collects. Faster."
    constructor(position : Point, planet : Planet) {
        super(position, planet);
        this.icon = "S";
        this.color = "#f0f";
        this.framesPerMove = 1;
        this.fuel = 60 * 60  * 5;
    }
}

class SmartRobot extends Robot {
    type = "smartrobot";
    name = "SmartRobot"
    static description = "No more wandering.";
    constructor(position : Point, planet : Planet) {
        super(position, planet);
        this.icon = "s";
        this.color = "#0f0";
        this.framesPerMove = 20;
        this.fuel = 60 * 60 * 5;
    }

    move() {
        if(this.fuel <= 0) {
            return;
        }
        //get closest material
        let closests = this.planet.features.filter(f => f instanceof MatDepot)?.sort((a, b) => distance(a.position, this.position) - distance(b.position, this.position));
        //move towards it
        if(closests) {
            let closest = closests[0]
            if(!closest) return;
            let dir = closest.position.subtract(this.position).normalize();
            //lock to orthagonal movement
            if(Math.abs(dir.x) > Math.abs(dir.y)) {
                dir.y = 0;
            } else {
                dir.x = 0;
            }
            //normalize
            dir = dir.normalize();
            if(!this.planet.inBounds(this.position.add(dir))) {
                //step towards center
                dir = dir.add(this.planet.position.subtract(this.position).normalize());
                dir = new Point(dir.x < -0.4 ? -1 : dir.x > 0.4 ? 1 : 0, dir.y < -0.4 ? -1 : dir.y > 0.4 ? 1 : 0);
                
            }
            this.fuel--;
            this.position = this.position.add(dir);
            this.tryPickup();
        } else {
            this.fuel = 0;
        }
    }
    
}

class RobotFactory extends Feature {
    icon: string = "F"
    color: string = "#fff"
    framesSinceLastMove : number = 0;
    framesPerMove : number =  60* 3;
    type: string = "robotfactory";
    name: string ="RobotFactory";
    static description: string = "factorio";
    fuel = 5;
    robotType : Robot | undefined;
    constructor(position : Point, planet : Planet) {
        super(position, planet);

    }

    draw(display:any, topleft:Point) {
        display.rdraw(this.position.x - topleft.x, this.position.y - topleft.y, this.icon, this.color);
        
    }

    public drawFeature(display: any, topleft: Point): void {
        let y = 0;
        display.drawMenu(60, 0, [ "RoboFactory", "Fuel: " + this.fuel, "Spawning:" + (this.robotType?? {type:"None"}).type]);
        y+=2

    }

    public update(): void {
        if(this.fuel > 0) {
            if(this.framesSinceLastMove > this.framesPerMove) {
                this.spawn();
                this.framesSinceLastMove = 0;
            }
            this.framesSinceLastMove ++;
        }

    }

    public spawn() {
        //get nearby planets
        let planets = game.world.planets.sort((a, b) => distance(a.position,this.planet.position) - distance(b.position, this.planet.position));
        //put a robot on the first one with least robots
        if(!this.robotType) return;
        let count = 0;
        while(count < 3) {
            for(let planet of planets) {
                if(planet.features.filter((val)=>val instanceof Robot).length <= count) {
                    let a = new FeatureTypes[this.robotType.name](planet.position.clone(), planet)
                    planet.features.push(a);
                    this.fuel -= 1;
                    return;
                }
            }
        }
    }

}

class Drill extends Feature {
    icon: string;
    color: string;
    framesSinceLastMove: number;
    framesPerMove: number = 5 * 60;
    type = "drill";
    name = "Drill";
    static description = "Drills a deposit.";
    matType!: Material;
    inventory: Inventory = new Inventory();
    fuel = 60 * 60 / 20;
    constructor(position : Point, planet: Planet) {
        super(position, planet);
        this.icon = "M";
        this.color = "#f00";
        this.framesSinceLastMove = 0;
        let check = this.planet.getFeatureAt(this.position);
        if(check && check instanceof MatDepot) {
            this.matType = check.materials;
            planet.removeFeature(check);

        } else {
            this.matType = {name: "No Material", color: "#000", icon: "?"};
        }
        this.inventory.materials[this.matType.name] = 0;
        planet.features.push(this);
    }

    draw(display : any, topleft : Point) {
        display.rdraw(this.position.x - topleft.x, this.position.y - topleft.y, this.icon, this.color);
    
    }

    drawFeature(display : any, topleft : Point) {
        let y = 0;
        display.drawMenu(60, 0, [this.matType.name + " Drill", "Fuel: " + this.fuel]);
        y+=2
        display.drawMenu(60, y++, ["[space] to pickup"]);
        display.drawMenu(60, y, Object.keys(this.inventory.materials).map(m => m + ": " + this.inventory.materials[m]));

    }


    update() {
        if(this.matType.name === "No Material") {
            return;
        }
        if(this.fuel <= 0) {
            return;
        }
        this.framesSinceLastMove++;
        if(this.framesSinceLastMove >= this.framesPerMove) {
            this.framesSinceLastMove = 0;
            //collect from deposit
            this.inventory.materials[this.matType.name] += 1;
            this.fuel--;
        }
    }
    move() {
        
    }

    static checkPlacement(position: Point, planet: Planet): boolean {
        let mat = planet.getFeatureAt(position);
        if(mat && mat instanceof MatDepot) {
            return true;
        }
        return false;
    }

}

const RecipeList: {[key: string] : Recipe} = {


    robot: new Recipe({
        ingredients: [
            {type: "Copper", count: 4},
            {type: "Iron", count: 2},
            {type: "Gold", count: 1}
        ],
        product: {type: "Robot", count: 1}
    }),

    drill: new Recipe({
        ingredients: [
            {type: "Copper", count: 2},
            {type: "Iron", count: 2},
            {type: "Gold", count: 1},
            {type: "Diamond", count: 1}
        ],
        product: {type: "Drill", count: 1}
    }),
    superRobot: new Recipe({
        ingredients: [
            {type: "Robot", count: 1},
            {type: "Drill", count: 1},
            {type: "Uranium", count: 4},
        ],
        product: {type: "SuperRobot", count: 1}
    }),
    integratedChip: new Recipe({
        ingredients: [
            {type: "Copper", count: 2},
            {type: "Iron", count: 2},
            {type: "Gold", count: 2}
        ],
        product: {type: "IntegratedChip", count: 1}
    }),
    smartRobot: new Recipe({
        ingredients: [
            {type: "Robot", count: 1},
            {type: "IntegratedChip", count: 1},
            {type: "Gold", count: 2},
        ],
        product: {type: "SmartRobot", count: 1}
    }),
    robotFactory: new Recipe({
        ingredients: [
            {type: "Robot", count: 1},
            {type: "SuperRobot", count: 1},
            {type: "SmartRobot", count: 1},
            {type: "IntegratedChip", count: 3}
        ], 
        product: {type: "RobotFactory", count: 1}
    })


}

const FeatureTypes : {[key: string]: typeof Feature} = {
    MatDepot: MatDepot,
    Robot: Robot,
    SuperRobot: SuperRobot,
    Drill: Drill,
    SmartRobot: SmartRobot,
    RobotFactory: RobotFactory
};

class Map {
    scalingFactor = 2;
    player: Player;
    world: World;
    constructor(player : Player, world : World) {
        this.player = player;
        this.world = world;
    }


    draw(display : any, topleft : Point) {
        //fancy time.
        //draw a box in the center of the screen
        let offset = 4;
        // topleft = topleft.subtract(topleft.scale(this.scalingFactor));
        let center = this.player.position;
        for(let x = offset; x < display.width - offset; x++) {
            for(let y = offset; y < display.height - offset; y++) {
                //if we are on the edge, draw a border
                if(x === offset || x === display.width - offset - 1 || y === offset || y === display.height - offset - 1) {
                    display.draw(x, y, "#", "#fff");
                } else {
                    if(x === display.width / 2 && y === display.height / 2) {
                        display.draw(x, y, "@", "#fff");
                    }
                    //get the color of a planet within range of the pixel being drawn based on scale
                    let searchPoint = center.add(new Point(x - display.width / 2, y - display.height / 2).scale(this.scalingFactor));
                    let planet = this.world.getPlanetAt((searchPoint));
                    if(planet) {
                        let sizeChar = "o0";
                        let size = Math.floor(planet.radius / 10);
                        if(size > sizeChar.length) {
                            size = sizeChar.length - 1;
                        }

                        display.draw(x, y, sizeChar[size], planet.color);
                    } else {
                        display.draw(x, y, ".", "#000");
                    }

                }
            }
        }

        //draw the player
        display.draw(display.width / 2, display.height / 2, "@", "#fff");
    }
}

class Audio {
    audioContext: AudioContext;
    sdfx: {[key: string]: {freq: number, type: OscillatorType}} = {
        pickup : {
            freq: 440,
            type: "square"
        },
        error : {
            freq: 200,
            type: "square"
        },
        menu : {
            freq : 800,
            type: "square"
        }
    }

    constructor() {
        this.audioContext = new AudioContext();


    }

    playSound(name: string) {
        let osc = this.audioContext.createOscillator();
        osc.frequency.value = this.sdfx[name].freq;
        osc.type = this.sdfx[name].type;
        osc.connect(this.audioContext.destination);
        osc.start();
        setTimeout(() => osc.stop(), 50);
    }

}




var game = new Game();
var audio = new Audio();