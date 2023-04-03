"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("rot-js/lib/index");
var Point = /** @class */ (function () {
    function Point(x, y) {
        if (typeof x === "number") {
            this.x = x;
            this.y = y;
        }
        else {
            this.x = x.x;
            this.y = x.y;
        }
    }
    Point.prototype.origin = function (origin, position) {
        throw new Error("Method not implemented.");
    };
    Point.prototype.add = function (point) {
        return new Point(this.x + point.x, this.y + point.y);
    };
    Point.prototype.subtract = function (point) {
        return new Point(this.x - point.x, this.y - point.y);
    };
    Point.prototype.scale = function (scale) {
        return new Point(this.x * scale, this.y * scale);
    };
    Point.prototype.magnitude = function () {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    };
    Point.prototype.normalize = function () {
        var magnitude = this.magnitude();
        return new Point(this.x / magnitude, this.y / magnitude);
    };
    Point.prototype.clone = function () {
        return new Point(this.x, this.y);
    };
    Point.prototype.equals = function (point) {
        return this.x === point.x && this.y === point.y;
    };
    return Point;
}());
function distance(point1, point2) {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}
var Game = /** @class */ (function () {
    function Game() {
        this.display = new index_1.Display({ width: 80, height: 24, fontSize: 24, fontFamily: "monospace", spacing: 1.1 });
        this.player = new Player();
        this.world = new World();
        this.camera = new Camera();
    }
    Game.prototype.init = function () {
        document.body.appendChild(this.display.getContainer());
        this.camera.size = new Point(80, 24);
        this.camera.world = this.world;
        this.camera.player = this.player;
        this.world.player = this.player;
        this.map = new Map(this.player, this.world);
        //player spawn planet
        var planet = new Planet({ position: new Point(0, 0), size: 16, color: "#0f0", icon: "P" });
        planet.generateDepots(MaterialTypes.copper, 7);
        planet.generateDepots(MaterialTypes.iron, 4);
        planet.generateDepots(MaterialTypes.gold, 2);
        this.world.planets.push(planet);
        this.world.generatePlanets(new Point({ x: 0, y: 0 }), new Point({ x: 300, y: 300 }));
        document.addEventListener("keydown", this.player.input.bind(this.player));
        setInterval(this.draw.bind(this), 1000 / 60);
        setInterval(this.update.bind(this), 1000 / 60);
    };
    Game.prototype.draw = function () {
        this.camera.draw(this.display);
        if (this.isPlayerOnFeature()) {
            //draws the depot menu at the top right corner
            this.isPlayerOnFeature().drawFeature(this.display, this.camera.topleft);
        }
    };
    Game.prototype.update = function () {
        this.world.update();
    };
    Game.prototype.findPlanetPlayerIsOn = function () {
        for (var _i = 0, _a = this.world.planets; _i < _a.length; _i++) {
            var planet = _a[_i];
            if (planet.inBounds(this.player.position)) {
                return planet;
            }
        }
        return null;
    };
    //returns false if the player is not on a depot, otherwise returns the depot
    Game.prototype.isPlayerOnFeature = function () {
        var planet = this.findPlanetPlayerIsOn();
        if (planet == null) {
            return false;
        }
        for (var _i = 0, _a = planet.features; _i < _a.length; _i++) {
            var feature = _a[_i];
            if (Math.pow(feature.position.x - this.player.position.x, 2) + Math.pow(feature.position.y - this.player.position.y, 2) < Math.pow(1, 2)) {
                return feature;
            }
        }
        return false;
    };
    return Game;
}());
var Feature = /** @class */ (function () {
    function Feature(position, planet) {
        this.type = "feature";
        this.position = position !== null && position !== void 0 ? position : new Point(0, 0);
        this.planet = planet;
    }
    Feature.prototype.draw = function (display, topleft) {
    };
    Feature.prototype.drawFeature = function (display, topleft) {
    };
    Feature.prototype.update = function () {
    };
    Feature.prototype.interact = function () {
    };
    Feature.prototype.destroy = function () {
        var _this = this;
        this.planet.features = this.planet.features.filter(function (feature) { return feature !== _this; });
    };
    Feature.checkPlacement = function (position, planet) {
        //default check is just is the position on the planet
        return planet.inBounds(position);
    };
    Feature.description = "A feature";
    return Feature;
}());
;
var MaterialTypes = {
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
var MatDepot = /** @class */ (function (_super) {
    __extends(MatDepot, _super);
    function MatDepot(position, planet, materials) {
        var _this = _super.call(this, position, planet) || this;
        _this.type = "matdepot";
        _this.materials = materials !== null && materials !== void 0 ? materials : MaterialTypes.copper;
        return _this;
    }
    MatDepot.prototype.draw = function (display, topleft) {
        display.rdraw(this.position.x - topleft.x, this.position.y - topleft.y, this.materials.icon, this.materials.color);
    };
    MatDepot.prototype.drawFeature = function (display, topleft) {
        display.drawMenu(60, 0, ["Deposit", "Materials: " + this.materials.name, "[Space] pick up"]);
    };
    //removes the depot from the planet
    //returns the materials
    MatDepot.prototype.crack = function () {
        var _a;
        (_a = this.planet) === null || _a === void 0 ? void 0 : _a.removeFeature(this);
        return this.materials.name;
    };
    MatDepot.checkPlacement = function (position, planet) {
        if (!Feature.checkPlacement(position, planet)) {
            return false;
        }
        for (var _i = 0, _a = planet.features; _i < _a.length; _i++) {
            var feature = _a[_i];
            if (feature instanceof MatDepot) {
                if (Math.pow(feature.position.x - position.x, 2) + Math.pow(feature.position.y - position.y, 2) < Math.pow(1, 2)) {
                    return false;
                }
            }
        }
        return true;
    };
    MatDepot.description = "A deposit of materials";
    return MatDepot;
}(Feature));
var World = /** @class */ (function () {
    function World() {
        this.planets = [];
        this.generatedPoints = [];
    }
    World.prototype.isPlayerNearBounds = function (direction) {
        if (direction === void 0) { direction = new Point(0, 0); }
        //if the player is outside the range of any of the generated points, return a new point to generate planets
        //treat the size as 50 units smaller when checking if the player is near the edge
        var checkDist = 150;
        var closetPoint = this.generatedPoints[0];
        var newPoint = { origin: new Point({ x: this.player.position.x, y: this.player.position.y }), size: new Point({ x: 150, y: 150 }) };
        newPoint.origin.x += direction.x * checkDist;
        newPoint.origin.y += direction.y * checkDist;
        for (var _i = 0, _a = this.generatedPoints; _i < _a.length; _i++) {
            var point = _a[_i];
            if (distance(point, this.player.position) < distance(closetPoint, this.player.position)) {
                closetPoint = point;
            }
            //if the new point is within distance of a generated point, return false
            if (distance(point, newPoint.origin) < checkDist) {
                return false;
            }
            //if the player is within distance of a generated point, return false
            if (distance(point, this.player.position) < checkDist) {
                return false;
            }
        }
        this.generatePlanets(newPoint.origin, newPoint.size);
        return newPoint;
    };
    World.prototype.draw = function (display, topleft, size) {
        this.planets.forEach(function (element) {
            element.draw(display, topleft, size);
        });
        this.player.draw(display, topleft);
    };
    World.prototype.update = function () {
        for (var _i = 0, _a = this.planets; _i < _a.length; _i++) {
            var planet = _a[_i];
            planet.update();
        }
    };
    World.prototype.randColor = function () {
        var colorOptions = "456789abcd";
        var color = "#";
        for (var i = 0; i < 3; i++) {
            color += colorOptions[Math.floor(Math.random() * colorOptions.length)];
        }
        return color;
    };
    World.prototype.generatePlanets = function (origin, size) {
        console.log("generating planets at " + origin.x + ", " + origin.y);
        var iter = 0;
        for (var i = 0; i < 20; i++) {
            var p = new Planet({ position: new Point({ x: 0, y: 0 }), size: Math.round(Math.random() * 12 + 5), color: this.randColor(), icon: "O" });
            do {
                p.position.x = Math.round(Math.random() * size.x - size.x / 2 + origin.x);
                p.position.y = Math.round(Math.random() * size.y - size.y / 2 + origin.y);
                if (iter++ > 1000) {
                    console.log("error generating planets");
                    this.generatedPoints.push(origin);
                    return;
                }
            } while (this.isPlanetTooClose(p));
            p.generateDepots();
            this.planets.push(p);
        }
        this.generatedPoints.push(origin);
    };
    World.prototype.isPlanetTooClose = function (planet) {
        for (var _i = 0, _a = this.planets; _i < _a.length; _i++) {
            var p = _a[_i];
            if (Math.pow(p.position.x - planet.position.x, 2) + Math.pow(p.position.y - planet.position.y, 2) < Math.pow(planet.radius + p.radius + .5, 2)) {
                return true;
            }
        }
        return false;
    };
    World.prototype.getPlanetAt = function (position, scale) {
        if (scale === void 0) { scale = 1; }
        for (var _i = 0, _a = this.planets; _i < _a.length; _i++) {
            var planet = _a[_i];
            if (distance(planet.position, position) < scale * scale * Math.sqrt(planet.radius)) {
                return planet;
            }
        }
        return null;
    };
    return World;
}());
var Camera = /** @class */ (function () {
    function Camera() {
        this.topleft = new Point(0, 0);
        this.size = new Point(0, 0);
    }
    //Draws using the Rot display object
    Camera.prototype.draw = function (display) {
        //override the draw function to round the coordinates
        display.rdraw = function (x, y, ch, fg, bg) {
            this.draw(Math.round(x), Math.round(y), ch, fg, bg);
        };
        display.drawMenu = function (x, y, lines) {
            for (var i = 0; i < lines.length; i++) {
                this.drawText(x, y + i, lines[i]);
            }
        };
        display.width = this.size.x;
        display.height = this.size.y;
        //clear display
        display.clear();
        //update topleft so that the player is in the center
        this.topleft.x = this.player.position.x - this.size.x / 2;
        this.topleft.y = this.player.position.y - this.size.y / 2;
        this.world.draw(display, this.topleft, this.size);
        if (Camera.alertTime > 0) {
            //top 
            display.drawMenu(20, 0, [Camera.alertMessage]);
            Camera.alertTime--;
            if (Camera.alertTime == 0) {
                Camera.alertMessage = "";
            }
        }
    };
    Camera.alertMessage = "";
    Camera.alertTime = 0;
    return Camera;
}());
var Planet = /** @class */ (function () {
    function Planet(params) {
        this.features = [];
        this.ratio = 2.5; //ratio of height to width
        this.position = params.position;
        //size is a float
        this.radius = params.size; //radius
        this.color = params.color;
        this.icon = params.icon;
        this.features = [];
    }
    Planet.prototype.generateDepots = function (matType, num) {
        // let depotType = MaterialTypes[Object.keys(MaterialTypes)[Math.floor(Math.random() * Object.keys(MaterialTypes).length)]];
        var depotType = matType || MaterialTypes[Object.keys(MaterialTypes)[Math.floor(Math.random() * Object.keys(MaterialTypes).length)]];
        for (var i = 0; i < (num !== null && num !== void 0 ? num : this.radius); i++) {
            //make sure the depot is in the planet
            var temp = new Point(0, 0);
            do {
                temp = new Point(Math.round(Math.random() * this.radius * 2 - this.radius), Math.round(Math.random() * this.radius * 2 - this.radius));
                temp = temp.add(this.position);
            } while (this.inBounds(temp) == false);
            // temp = temp.add(this.position);
            var dep = new MatDepot(temp, this, depotType);
            this.features.push(dep);
        }
        //remove overlapping depots
        for (var i = 0; i < this.features.length; i++) {
            for (var j = i + 1; j < this.features.length; j++) {
                //depots are pixel perfect
                if (this.features[i].position.x == this.features[j].position.x && this.features[i].position.y == this.features[j].position.y) {
                    this.features.splice(j, 1);
                    j--;
                }
            }
        }
    };
    Planet.prototype.removeFeature = function (feature) {
        this.features = this.features.filter(function (f) { return f !== feature; });
    };
    Planet.prototype.inBounds = function (point) {
        return Math.pow(point.x - this.position.x, 2) + this.ratio * Math.pow(point.y - this.position.y, 2) < Math.pow(this.radius, 2);
    };
    Planet.prototype.draw = function (display, topleft, size) {
        //draw circular planet
        //dont draw if out of bounds
        if (this.position.x + this.radius < topleft.x || this.position.x - this.radius > topleft.x + size.x) {
            return;
        }
        if (this.position.y + this.radius < topleft.y || this.position.y - this.radius > topleft.y + size.y) {
            return;
        }
        //draw planet
        for (var x = this.position.x - this.radius; x < this.position.x + this.radius; x++) {
            for (var y = this.position.y - this.radius; y < this.position.y + this.radius; y++) {
                if (this.inBounds(new Point(x, y))) {
                    display.rdraw(x - topleft.x, y - topleft.y, this.icon, this.color, this.color);
                }
            }
        }
        //draw features
        this.features.forEach(function (element) {
            element.draw(display, topleft);
        });
    };
    Planet.prototype.update = function () {
        this.features.forEach(function (element) {
            element.update();
        });
    };
    Planet.prototype.getFeatureAt = function (point) {
        for (var i = 0; i < this.features.length; i++) {
            if (this.features[i].position.x == point.x && this.features[i].position.y == point.y) {
                return this.features[i];
            }
        }
        return undefined;
    };
    return Planet;
}());
var Player = /** @class */ (function () {
    function Player() {
        this.position = new Point({ x: 0, y: 0 });
        this.mode = "grounded";
        this.icon = "@";
        this.color = "#fff";
        this.cursor = 0;
        this.inventory = new Inventory();
    }
    Player.prototype.draw = function (display, topleft) {
        display.rdraw(this.position.x - topleft.x, this.position.y - topleft.y, this.icon, this.color);
        this.inventory.draw(display, topleft);
        if (this.mode == "craft") {
            //draw the recipe list at the bottom
            var count = Object.keys(RecipeList).length;
            var i = 0;
            for (var re in RecipeList) {
                RecipeList[re].draw(display, new Point({ x: 2, y: game.camera.size.y - count + i }));
                i++;
            }
            //draw the cursor
            display.draw(0, display._options.height - count + this.cursor, ">");
        }
        else if (this.mode == "inventory") {
            display.draw(0, this.cursor, ">");
        }
        else if (this.mode == "map") {
            game.map.draw(display, topleft);
        }
        if (this.mode !== "grounded") {
            Camera.alertMessage = "Menu Open. Press 'q' to close";
            Camera.alertTime = 4;
        }
    };
    Player.prototype.move = function (direction) {
        if (this.mode == "grounded" || this.mode == "map") {
            this.position.x += direction.x;
            this.position.y += direction.y;
            game.world.isPlayerNearBounds(direction);
        }
        else if (this.mode == "craft") {
            this.cursor += direction.y;
            if (this.cursor < 0) {
                this.cursor = 0;
                audio.playSound('error');
            }
            else if (this.cursor >= Object.keys(RecipeList).length) {
                this.cursor = Object.keys(RecipeList).length - 1;
                audio.playSound('error');
            }
            else {
                audio.playSound("menu");
            }
        }
        else if (this.mode == "inventory") {
            this.cursor += direction.y;
            if (this.cursor < 0) {
                this.cursor = 0;
                audio.playSound('error');
            }
            else if (this.cursor >= this.inventory.length()) {
                this.cursor = this.inventory.length() - 1;
                audio.playSound('error');
            }
            else {
                audio.playSound("menu");
            }
        }
    };
    Player.prototype.action = function () {
        //check if there is a depot
        //if there is, crack it open
        if (this.mode == "grounded") {
            var depot = game.isPlayerOnFeature();
            if (depot) {
                if (depot instanceof MatDepot) {
                    var res = depot.crack();
                    //add the resource to the inventory
                    if (!this.inventory.materials[res])
                        this.inventory.materials[res] = 0;
                    this.inventory.materials[res]++;
                }
                else if (depot.inventory instanceof Inventory) {
                    var inv = depot.inventory;
                    for (var mat in inv.materials) {
                        if (!this.inventory.materials[mat]) {
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
        else if (this.mode == "craft") {
            var recipe = RecipeList[Object.keys(RecipeList)[this.cursor]];
            if (recipe) {
                var canCraft = true;
                for (var _i = 0, _a = recipe.ingredients; _i < _a.length; _i++) {
                    var mat = _a[_i];
                    if (!this.inventory.materials[mat.type] || this.inventory.materials[mat.type] < mat.count) {
                        canCraft = false;
                        break;
                    }
                }
                if (canCraft) {
                    for (var _b = 0, _c = recipe.ingredients; _b < _c.length; _b++) {
                        var mat = _c[_b];
                        this.inventory.materials[mat.type] -= mat.count;
                    }
                    if (!this.inventory.materials[recipe.product.type]) {
                        this.inventory.materials[recipe.product.type] = 0;
                    }
                    this.inventory.materials[recipe.product.type] += recipe.product.count;
                }
            }
        }
        else if (this.mode == "inventory") {
            //if the player isn't on a planet, warn them
            if (!game.findPlanetPlayerIsOn()) {
                Camera.alertMessage = "You can't drop items in space!";
                Camera.alertTime = 60 * 2;
                audio.playSound("error");
                return;
            }
            //drop the item
            var planet = game.findPlanetPlayerIsOn();
            var item = this.inventory.getMaterial(this.cursor);
            if (!item) {
                return;
            }
            item = item;
            //if the item is a material, drop it as a depot
            console.log(item);
            if (item.toLowerCase() in MaterialTypes) {
                if (!MatDepot.checkPlacement(this.position, planet)) {
                    Camera.alertMessage = "You can't place a deposit here!";
                    Camera.alertTime = 60 * 2;
                    audio.playSound("error");
                    return;
                }
                var a = new MatDepot(this.position.clone(), planet, MaterialTypes[item.toLowerCase()]);
                planet.features.push(a);
                this.inventory.materials[item]--;
            }
            else if (item in FeatureTypes) {
                if (!FeatureTypes[item].checkPlacement(this.position, planet)) {
                    Camera.alertMessage = "You can't place a " + item + " here!";
                    Camera.alertTime = 60 * 2;
                    return;
                }
                var a = new FeatureTypes[item](this.position.clone(), planet);
                planet.features.push(a);
                this.inventory.materials[item]--;
            }
        }
    };
    Player.prototype.input = function (event) {
        var direction = new Point({ x: 0, y: 0 });
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
                if (this.mode == "inventory" && this.inventory.length() == 0)
                    this.mode = "grounded";
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
    };
    return Player;
}());
var Inventory = /** @class */ (function () {
    function Inventory() {
        this.materials = {};
    }
    Inventory.prototype.length = function () {
        return Object.keys(this.materials).length;
    };
    Inventory.prototype.getMaterial = function (index) {
        var i = 0;
        for (var mat in this.materials) {
            if (i == index) {
                return mat;
            }
            i++;
        }
        return null;
    };
    Inventory.prototype.draw = function (display, topleft, offset) {
        if (offset === void 0) { offset = new Point({ x: 0, y: 0 }); }
        //draw a box in the top left corner
        //draw the materials in the box
        var y = 0;
        for (var material in this.materials) {
            display.drawText(1 + offset.x, offset.y + y++, material + ": " + this.materials[material]);
        }
    };
    return Inventory;
}());
var Recipe = /** @class */ (function () {
    function Recipe(options) {
        this.ingredients = options.ingredients;
        this.product = options.product;
    }
    Recipe.prototype.ingredientString = function (ing) {
        return ing.count + "x" + ing.type;
    };
    Recipe.prototype.draw = function (display, offset) {
        var _a, _b;
        var x = offset.x;
        var y = offset.y;
        //for each ingredient, check if the player has enough
        //if they do, draw it normally
        //if they dont, draw it red
        //recipies are rendered like "4x Copper, 2x Iron, 1x Gold -> 1x Robot"
        //format specifiers look like %c{name}/%b{name}
        for (var _i = 0, _c = this.ingredients; _i < _c.length; _i++) {
            var ing = _c[_i];
            if (game.player.inventory.materials[ing.type] >= ing.count) {
                display.drawText(x, y, "%c{}" + this.ingredientString(ing));
            }
            else {
                display.drawText(x, y, "%c{#f00}" + this.ingredientString(ing));
            }
            x += this.ingredientString(ing).length;
            //draw a plus if there are more ingredients
            if (this.ingredients.indexOf(ing) != this.ingredients.length - 1) {
                display.drawText(x, y, "+");
                x += 1;
            }
        }
        display.drawText(x, y, "->");
        x += 2;
        display.drawText(x, y, this.ingredientString(this.product));
        x += this.ingredientString(this.product).length;
        display.drawText(x + 3, y, "[" + ((_b = (_a = FeatureTypes[this.product.type]) === null || _a === void 0 ? void 0 : _a.description) !== null && _b !== void 0 ? _b : "Crafting Component") + "]", "#fff", "#000");
    };
    return Recipe;
}());
var Robot = /** @class */ (function (_super) {
    __extends(Robot, _super);
    function Robot(position, planet) {
        var _this = _super.call(this, position, planet) || this;
        _this.reachedCenter = false;
        _this.fuel = 60 * 60 / 20;
        _this.type = "robot";
        _this.name = "Robot";
        _this.icon = "R";
        _this.color = "#0ff";
        _this.framesSinceLastMove = 0;
        _this.framesPerMove = 20;
        _this.inventory = new Inventory();
        return _this;
    }
    Robot.prototype.draw = function (display, topleft) {
        display.rdraw(this.position.x - topleft.x, this.position.y - topleft.y, this.icon, this.color);
    };
    Robot.prototype.drawFeature = function (display, topleft) {
        var _this = this;
        var y = 0;
        display.drawMenu(60, 0, [this.name, "Fuel: " + this.fuel]);
        y += 2;
        if (this.fuel <= 0) {
            display.drawMenu(60, y++, ["[space] to pickup"]);
        }
        display.drawMenu(60, y, Object.keys(this.inventory.materials).map(function (m) { return m + ": " + _this.inventory.materials[m]; }));
    };
    Robot.prototype.update = function () {
        if (this.planet.getFeatureAt(this.position) instanceof RobotFactory) {
            var factorio = this.planet.getFeatureAt(this.position);
            if (!factorio.robotType) {
                factorio.robotType = this;
                this.planet.removeFeature(this);
                this.fuel = 0;
            }
        }
        this.framesSinceLastMove++;
        if (this.framesSinceLastMove >= this.framesPerMove) {
            this.framesSinceLastMove = 0;
            this.move();
        }
    };
    Robot.prototype.move = function () {
        if (this.fuel <= 0) {
            return;
        }
        //random moves it is midnight i cant think
        var direction = new Point({ x: 0, y: 0 });
        var rand = Math.random();
        if (rand < 0.25) {
            direction.x = -1;
        }
        else if (rand < 0.5) {
            direction.x = 1;
        }
        else if (rand < 0.75) {
            direction.y = -1;
        }
        else {
            direction.y = 1;
        }
        //clamp the direction so the robot doesnt go off the planet
        //if the robot would go off the planet, dont move it
        if (!this.planet.inBounds(this.position.add(direction))) {
            this.move(); //try again
            return;
        }
        this.fuel--;
        this.position = this.position.add(direction);
        this.tryPickup();
    };
    Robot.prototype.tryPickup = function () {
        //check if there is a material at the robot's position
        //if there is, add it to the inventory
        var mat = this.planet.getFeatureAt(this.position);
        if (mat && mat instanceof MatDepot) {
            if (!this.inventory.materials[mat.materials.name]) {
                this.inventory.materials[mat.materials.name] = 0;
            }
            this.inventory.materials[mat.materials.name]++;
            this.planet.removeFeature(mat);
        }
    };
    Robot.prototype.interpolateSpiral = function (center, radius, step) {
        //slow down when we get further out
        var angle = step * Math.PI * 2 / 360;
        var x = center.x + radius * Math.cos(angle);
        var y = center.y + radius * Math.sin(angle);
        return new Point({ x: x, y: y });
    };
    Robot.prototype.distToCenter = function () {
        var x = this.planet.radius - this.position.x;
        var y = this.planet.radius - this.position.y;
        return Math.sqrt(x * x + y * y);
    };
    Robot.prototype.dirToCenter = function () {
        var dest = this.planet.position.subtract(this.position);
        return dest.normalize();
    };
    Robot.description = "Wanders and Collects.";
    return Robot;
}(Feature));
var SuperRobot = /** @class */ (function (_super) {
    __extends(SuperRobot, _super);
    function SuperRobot(position, planet) {
        var _this = _super.call(this, position, planet) || this;
        _this.type = "superrobot";
        _this.name = "SuperRobot";
        _this.icon = "S";
        _this.color = "#f0f";
        _this.framesPerMove = 1;
        _this.fuel = 60 * 60 * 5;
        return _this;
    }
    SuperRobot.description = "Wanders and Collects. Faster.";
    return SuperRobot;
}(Robot));
var SmartRobot = /** @class */ (function (_super) {
    __extends(SmartRobot, _super);
    function SmartRobot(position, planet) {
        var _this = _super.call(this, position, planet) || this;
        _this.type = "smartrobot";
        _this.name = "SmartRobot";
        _this.icon = "s";
        _this.color = "#0f0";
        _this.framesPerMove = 20;
        _this.fuel = 60 * 60 * 5;
        return _this;
    }
    SmartRobot.prototype.move = function () {
        var _this = this;
        var _a;
        if (this.fuel <= 0) {
            return;
        }
        //get closest material
        var closests = (_a = this.planet.features.filter(function (f) { return f instanceof MatDepot; })) === null || _a === void 0 ? void 0 : _a.sort(function (a, b) { return distance(a.position, _this.position) - distance(b.position, _this.position); });
        //move towards it
        if (closests) {
            var closest = closests[0];
            if (!closest)
                return;
            var dir = closest.position.subtract(this.position).normalize();
            //lock to orthagonal movement
            if (Math.abs(dir.x) > Math.abs(dir.y)) {
                dir.y = 0;
            }
            else {
                dir.x = 0;
            }
            //normalize
            dir = dir.normalize();
            if (!this.planet.inBounds(this.position.add(dir))) {
                //step towards center
                dir = dir.add(this.planet.position.subtract(this.position).normalize());
                dir = new Point(dir.x < -0.4 ? -1 : dir.x > 0.4 ? 1 : 0, dir.y < -0.4 ? -1 : dir.y > 0.4 ? 1 : 0);
            }
            this.fuel--;
            this.position = this.position.add(dir);
            this.tryPickup();
        }
        else {
            this.fuel = 0;
        }
    };
    SmartRobot.description = "No more wandering.";
    return SmartRobot;
}(Robot));
var RobotFactory = /** @class */ (function (_super) {
    __extends(RobotFactory, _super);
    function RobotFactory(position, planet) {
        var _this = _super.call(this, position, planet) || this;
        _this.icon = "F";
        _this.color = "#fff";
        _this.framesSinceLastMove = 0;
        _this.framesPerMove = 60 * 3;
        _this.type = "robotfactory";
        _this.name = "RobotFactory";
        _this.fuel = 5;
        return _this;
    }
    RobotFactory.prototype.draw = function (display, topleft) {
        display.rdraw(this.position.x - topleft.x, this.position.y - topleft.y, this.icon, this.color);
    };
    RobotFactory.prototype.drawFeature = function (display, topleft) {
        var _a;
        var y = 0;
        display.drawMenu(60, 0, ["RoboFactory", "Fuel: " + this.fuel, "Spawning:" + ((_a = this.robotType) !== null && _a !== void 0 ? _a : { type: "None" }).type]);
        y += 2;
    };
    RobotFactory.prototype.update = function () {
        if (this.fuel > 0) {
            if (this.framesSinceLastMove > this.framesPerMove) {
                this.spawn();
                this.framesSinceLastMove = 0;
            }
            this.framesSinceLastMove++;
        }
    };
    RobotFactory.prototype.spawn = function () {
        var _this = this;
        //get nearby planets
        var planets = game.world.planets.sort(function (a, b) { return distance(a.position, _this.planet.position) - distance(b.position, _this.planet.position); });
        //put a robot on the first one with least robots
        if (!this.robotType)
            return;
        var count = 0;
        while (count < 3) {
            for (var _i = 0, planets_1 = planets; _i < planets_1.length; _i++) {
                var planet = planets_1[_i];
                if (planet.features.filter(function (val) { return val instanceof Robot; }).length <= count) {
                    var a = new FeatureTypes[this.robotType.name](planet.position.clone(), planet);
                    planet.features.push(a);
                    this.fuel -= 1;
                    return;
                }
            }
        }
    };
    RobotFactory.description = "factorio";
    return RobotFactory;
}(Feature));
var Drill = /** @class */ (function (_super) {
    __extends(Drill, _super);
    function Drill(position, planet) {
        var _this = _super.call(this, position, planet) || this;
        _this.framesPerMove = 5 * 60;
        _this.type = "drill";
        _this.name = "Drill";
        _this.inventory = new Inventory();
        _this.fuel = 60 * 60 / 20;
        _this.icon = "M";
        _this.color = "#f00";
        _this.framesSinceLastMove = 0;
        var check = _this.planet.getFeatureAt(_this.position);
        if (check && check instanceof MatDepot) {
            _this.matType = check.materials;
            planet.removeFeature(check);
        }
        else {
            _this.matType = { name: "No Material", color: "#000", icon: "?" };
        }
        _this.inventory.materials[_this.matType.name] = 0;
        planet.features.push(_this);
        return _this;
    }
    Drill.prototype.draw = function (display, topleft) {
        display.rdraw(this.position.x - topleft.x, this.position.y - topleft.y, this.icon, this.color);
    };
    Drill.prototype.drawFeature = function (display, topleft) {
        var _this = this;
        var y = 0;
        display.drawMenu(60, 0, [this.matType.name + " Drill", "Fuel: " + this.fuel]);
        y += 2;
        display.drawMenu(60, y++, ["[space] to pickup"]);
        display.drawMenu(60, y, Object.keys(this.inventory.materials).map(function (m) { return m + ": " + _this.inventory.materials[m]; }));
    };
    Drill.prototype.update = function () {
        if (this.matType.name === "No Material") {
            return;
        }
        if (this.fuel <= 0) {
            return;
        }
        this.framesSinceLastMove++;
        if (this.framesSinceLastMove >= this.framesPerMove) {
            this.framesSinceLastMove = 0;
            //collect from deposit
            this.inventory.materials[this.matType.name] += 1;
            this.fuel--;
        }
    };
    Drill.prototype.move = function () {
    };
    Drill.checkPlacement = function (position, planet) {
        var mat = planet.getFeatureAt(position);
        if (mat && mat instanceof MatDepot) {
            return true;
        }
        return false;
    };
    Drill.description = "Drills a deposit.";
    return Drill;
}(Feature));
var RecipeList = {
    robot: new Recipe({
        ingredients: [
            { type: "Copper", count: 4 },
            { type: "Iron", count: 2 },
            { type: "Gold", count: 1 }
        ],
        product: { type: "Robot", count: 1 }
    }),
    drill: new Recipe({
        ingredients: [
            { type: "Copper", count: 2 },
            { type: "Iron", count: 2 },
            { type: "Gold", count: 1 },
            { type: "Diamond", count: 1 }
        ],
        product: { type: "Drill", count: 1 }
    }),
    superRobot: new Recipe({
        ingredients: [
            { type: "Robot", count: 1 },
            { type: "Drill", count: 1 },
            { type: "Uranium", count: 4 },
        ],
        product: { type: "SuperRobot", count: 1 }
    }),
    integratedChip: new Recipe({
        ingredients: [
            { type: "Copper", count: 2 },
            { type: "Iron", count: 2 },
            { type: "Gold", count: 2 }
        ],
        product: { type: "IntegratedChip", count: 1 }
    }),
    smartRobot: new Recipe({
        ingredients: [
            { type: "Robot", count: 1 },
            { type: "IntegratedChip", count: 1 },
            { type: "Gold", count: 2 },
        ],
        product: { type: "SmartRobot", count: 1 }
    }),
    robotFactory: new Recipe({
        ingredients: [
            { type: "Robot", count: 1 },
            { type: "SuperRobot", count: 1 },
            { type: "SmartRobot", count: 1 },
            { type: "IntegratedChip", count: 3 }
        ],
        product: { type: "RobotFactory", count: 1 }
    })
};
var FeatureTypes = {
    MatDepot: MatDepot,
    Robot: Robot,
    SuperRobot: SuperRobot,
    Drill: Drill,
    SmartRobot: SmartRobot,
    RobotFactory: RobotFactory
};
var Map = /** @class */ (function () {
    function Map(player, world) {
        this.scalingFactor = 2;
        this.player = player;
        this.world = world;
    }
    Map.prototype.draw = function (display, topleft) {
        //fancy time.
        //draw a box in the center of the screen
        var offset = 4;
        // topleft = topleft.subtract(topleft.scale(this.scalingFactor));
        var center = this.player.position;
        for (var x = offset; x < display.width - offset; x++) {
            for (var y = offset; y < display.height - offset; y++) {
                //if we are on the edge, draw a border
                if (x === offset || x === display.width - offset - 1 || y === offset || y === display.height - offset - 1) {
                    display.draw(x, y, "#", "#fff");
                }
                else {
                    if (x === display.width / 2 && y === display.height / 2) {
                        display.draw(x, y, "@", "#fff");
                    }
                    //get the color of a planet within range of the pixel being drawn based on scale
                    var searchPoint = center.add(new Point(x - display.width / 2, y - display.height / 2).scale(this.scalingFactor));
                    var planet = this.world.getPlanetAt((searchPoint));
                    if (planet) {
                        var sizeChar = "o0";
                        var size = Math.floor(planet.radius / 10);
                        if (size > sizeChar.length) {
                            size = sizeChar.length - 1;
                        }
                        display.draw(x, y, sizeChar[size], planet.color);
                    }
                    else {
                        display.draw(x, y, ".", "#000");
                    }
                }
            }
        }
        //draw the player
        display.draw(display.width / 2, display.height / 2, "@", "#fff");
    };
    return Map;
}());
var Audio = /** @class */ (function () {
    function Audio() {
        this.sdfx = {
            pickup: {
                freq: 440,
                type: "square"
            },
            error: {
                freq: 200,
                type: "square"
            },
            menu: {
                freq: 800,
                type: "square"
            }
        };
        this.audioContext = new AudioContext();
    }
    Audio.prototype.playSound = function (name) {
        var osc = this.audioContext.createOscillator();
        osc.frequency.value = this.sdfx[name].freq;
        osc.type = this.sdfx[name].type;
        osc.connect(this.audioContext.destination);
        osc.start();
        setTimeout(function () { return osc.stop(); }, 50);
    };
    return Audio;
}());
var game = new Game();
var audio = new Audio();
