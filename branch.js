/*
 * branch-drawer
 *
 * Copyright (c) 2022 Yuichiro MORIGUCHI
 *
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 **/
(function(root) {
    var returnMachine,
        undef = void 0,
        BOUND = -1,
        UP = { x:0, y:-1 },
        RIGHT = { x:1, y:0 },
        DOWN = { x:0, y:1 },
        LEFT = { x:-1, y:0 },
        fontpx = 12;

    function log(message) {
        //console.log(message);
    }

    function createGraph() {
        var container = {},
            startX,
            maxX = -10,
            maxY = -1,
            me;

        me = {
            init: function(x) {
                startX = x;
            },

            addNode: function(id, trunkId, x, y) {
                container[id] = {
                    x: x - startX + 2,
                    y: y,
                    trunkId: trunkId
                };
                maxY = maxY < y ? y : maxY;
            },

            setEndX: function(id, x) {
                container[id].endX = x - startX + 2;
                maxX = maxX < x ? x : maxX;
            },

            setBranchStartX: function(id, x) {
                container[id].branchStartX = x - startX + 2;
            },

            setBranchEndX: function(id, x) {
                container[id].branchEndX = x - startX + 2;
            },

            setLabel: function(id, x, label) {
                container[id].labelX = x - startX + 2;
                container[id].label = label;
            },

            getX: function(id) {
                return container[id].x * fontpx;
            },

            getY: function(id) {
                return container[id].y * fontpx;
            },

            getMaxX: function(id) {
                return maxX * fontpx;
            },

            getMaxY: function(id) {
                return maxY * fontpx;
            },

            getTrunkId: function(id) {
                return container[id].trunkId;
            },

            getEndX: function(id, x) {
                return container[id].endX * fontpx;
            },

            getBranchStartX: function(id) {
                return container[id].branchStartX * fontpx;
            },

            getBranchEndX: function(id) {
                return container[id].branchEndX * fontpx;
            },

            getLabel: function(id) {
                return container[id].label;
            },

            getLabelX: function(id) {
                return container[id].labelX * fontpx;
            }
        };
        return me;
    }

    function createSvgNode(ns, type) {
        var me,
            attrs = {},
            children = [];

        me = {
            setAttribute: function(attr, value) {
                attrs[attr] = value;
            },

            appendChild: function(child) {
                children.push(child);
            },

            toString: function() {
                var result = "",
                    i;

                function putAttr(key, value) {
                    result += " ";
                    result += key;
                    result += "=\"";
                    result += value.toString();
                    result += "\"";
                }

                result += "<";
                result += type;
                for(i in attrs) {
                    if(attrs.hasOwnProperty(i)) {
                        putAttr(i, attrs[i]);
                    }
                }
                if(ns && type === "svg") {
                    putAttr("xmlns", ns);
                }
                result += ">\n";

                if(me.textContent) {
                    result += me.textContent;
                }
                for(i = 0; i < children.length; i++) {
                    result += children[i].toString();
                    result += "\n";
                }

                result += "</";
                result += type;
                result += ">";
                return result;
            }
        };
        return me;
    }

    function createSvg() {
        var me;

        me = {
            createNode: function(type) {
                return createSvgNode("http://www.w3.org/2000/svg", type);
            },

            createCanvas: function(x, y) {
                var node = me.createNode("svg");

                node.setAttribute("width", x);
                node.setAttribute("height", y);
                return node;
            },

            addLine: function(toAdd, x1, y1, x2, y2, stroke) {
                var node = me.createNode("line");

                node.setAttribute("x1", x1);
                node.setAttribute("y1", y1);
                node.setAttribute("x2", x2);
                node.setAttribute("y2", y2);
                node.setAttribute("stroke", stroke);
                toAdd.appendChild(node);
            },

            addText: function(toAdd, text, x, y, font, size) {
                var node = me.createNode("text");

                node.setAttribute("x", x);
                node.setAttribute("y", y);
                node.setAttribute("font-family", font);
                node.setAttribute("font-size", size);
                node.textContent = text;
                toAdd.appendChild(node);
            }
        };
        return me;
    }

    function quadro(inputString) {
        var TURN = [UP, RIGHT, DOWN, LEFT],
            input = inputString.split(/\r\n|\r|\n/),
            i,
            j,
            xNow = 1,
            yNow = 1,
            direction = 0,
            maxLength = 0,
            cellMatrix = [],
            me;

        function drawBound(y) {
            var j;

            cellMatrix[y] = [];
            for(j = 0; j < maxLength; j++) {
                cellMatrix[y][j] = { ch: BOUND };
            }
            cellMatrix[y][j + 1] = { ch: BOUND };
        }

        for(i = 0; i < input.length; i++) {
            maxLength = maxLength < input[i].length ? input[i].length : maxLength;
        }
        maxLength += 2;

        for(i = 0; i < input.length; i++) {
            cellMatrix[i + 1] = [];
            cellMatrix[i + 1][0] = { ch: BOUND };
            for(j = 0; j < maxLength - 2; j++) {
                cellMatrix[i + 1][j + 1] = {
                    ch: j < input[i].length ? input[i].charAt(j) : ' '
                };
            }
            cellMatrix[i + 1][j + 1] = { ch: BOUND };
        }
        drawBound(0);
        drawBound(i + 1);

        me = {
            id: 0,
            branchStart: [],

            getChar: function(xoffset, yoffset) {
                return me.get(xoffset, yoffset).ch;
            },

            isWhitespace: function(xoffset, yoffset) {
                var ch = me.getChar(xoffset, yoffset);

                return ch === BOUND || /[ ]/.test(ch);
            },

            get: function(xoffset, yoffset) {
                if(xoffset === undef || yoffset === undef) {
                    return cellMatrix[yNow][xNow];
                } else if(xNow + xoffset < 0 || xNow + xoffset >= maxLength || yNow + yoffset < 0 || yNow + yoffset >= cellMatrix.length) {
                    return { ch: BOUND };
                } else {
                    return cellMatrix[yNow + yoffset][xNow + xoffset];
                }
            },

            getForward: function(offset) {
                return me.get(TURN[direction].x * offset, TURN[direction].y * offset);
            },

            move: function(direction) {
                xNow += direction.x;
                yNow += direction.y;
                if(xNow < 0) {
                    xNow = 0;
                } else if(xNow >= maxLength) {
                    xNow = maxLength - 1;
                }
                if(yNow < 0) {
                    yNow = 0;
                } else if(yNow >= cellMatrix.length) {
                    yNow = cellMatrix.length - 1;
                }
                return me;
            },

            moveForward: function() {
                return me.move(TURN[direction]);
            },

            moveBackward: function() {
                return me.move(TURN[(direction + 2) % 4]);
            },

            moveCrLf: function() {
                xNow = 1;
                return me.move(DOWN);
            },

            moveUpperBound: function() {
                yNow = 1;
                return me;
            },

            moveInit: function() {
                xNow = yNow = 1;
                return me;
            },

            direction: function(dir) {
                var i = 0;

                for(i = 0; i < TURN.length; i++) {
                    if(TURN[i] === dir) {
                        direction = i;
                        return me;
                    }
                }
                throw new Error("invaild direction");
            },

            getDirection: function() {
                return TURN[direction];
            },

            isDirectionHorizontal: function() {
                return me.getDirection() === LEFT || me.getDirection() === RIGHT;
            },

            isDirectionVertical: function() {
                return me.getDirection() === UP || me.getDirection() === DOWN;
            },

            turnRight: function() {
                direction++;
                if(direction >= 4) {
                    direction = 0;
                }
                return me;
            },

            turnLeft: function() {
                direction--;
                if(direction < 0) {
                    direction = 3;
                }
                return me;
            },

            getPosition: function() {
                return {
                    x: xNow,
                    y: yNow,
                    direction: direction
                };
            },

            setPosition: function(position) {
                xNow = position.x;
                yNow = position.y;
                direction = position.direction;
                return me;
            }
        };
        return me;
    }

    function CallMachine(machine, next) {
        this.machine = machine;
        this.next = next;
    }

    function ReturnMachine() {}
    var returnMachine = new ReturnMachine();

    function engine(quadro, initMachine) {
        var state,
            stateStack = [],
            machineResult,
            popState,
            i;

        if(initMachine.init === null) {
            throw new Error("Null pointer Exception");
        }
        state = {
            state: initMachine.init,
            stateName: initMachine.name
        };
        for(;;) {
            if(i > 100000) {
                throw new Error("Maybe Infinite Loop");
            } else if(typeof state.state !== "function") {
                throw new Error("Invaild state : " + JSON.stringify(state));
            }

            machineResult = state.state(quadro);
            if(machineResult === null) {
                throw new Error("Null pointer Exception");
            } else if(machineResult instanceof CallMachine) {
                stateStack.push({
                    state: machineResult.machine.init,
                    stateName: machineResult.machine.name,
                    position: quadro.getPosition()
                });
                state.state = machineResult.next;
                log("entering " + state.stateName);
            } else if(machineResult instanceof ReturnMachine) {
                log("leaving " + state.stateName);
                if(stateStack.length === 0) {
                    return;
                }
                popState = stateStack.pop();
                state.state = popState.state;
                state.stateName = popState.stateName;
                if(popState.position !== undef) {
                    quadro.setPosition(popState.position);
                }
            } else {
                state.state = machineResult;
            }
        }
    }

    function branch(input) {
        var graph = createGraph();

        var initState = (function() {
            var me;

            me = {
                name: "initState",

                init: function(quadro) {
                    if(quadro.getChar() === "-") {
                        graph.init(quadro.getPosition().x);
                        return trunkState.init;
                    } else if(quadro.getChar() === BOUND) {
                        quadro.moveUpperBound().move(RIGHT);
                        if(quadro.getChar() === BOUND) {
                            throw new Error("No branch graph");
                        }
                        return me.init;
                    } else {
                        quadro.move(DOWN);
                        return me.init;
                    }
                }
            };
            return me;
        })();

        var trunkState = (function() {
            var me;

            me = {
                name: "trunkState",

                init: function(quadro) {
                    var position = quadro.getPosition();

                    quadro.label = "";
                    quadro.labelX = null;
                    quadro.id++;
                    graph.addNode(quadro.id, quadro.trunkId, position.x, position.y);
                    graph.setBranchStartX(quadro.id, quadro.branchStart.pop());
                    return me.trunk;
                },

                trunk: function(quadro) {
                    if(!quadro.get().visited && quadro.getChar(1, -1) === "/") {
                        if(quadro.isWhitespace(1, 0)) {
                            graph.setEndX(quadro.id, quadro.getPosition().x);
                            quadro.move(UP).move(RIGHT);
                            return upMergeState.init;
                        } else {
                            quadro.branchStart.push(quadro.getPosition().x);
                            quadro.get().visited = true;
                            return new CallMachine(upBranchState, me.step);
                        }
                    } else if(!quadro.get().visited && quadro.getChar(1, 1) === "\\") {
                        if(quadro.isWhitespace(1, 0)) {
                            graph.setEndX(quadro.id, quadro.getPosition().x);
                            quadro.move(DOWN).move(RIGHT);
                            return downMergeState.init;
                        } else {
                            quadro.branchStart.push(quadro.getPosition().x);
                            quadro.get().visited = true;
                            return new CallMachine(downBranchState, me.step);
                        }
                    } else if(quadro.isWhitespace()) {
                        graph.setEndX(quadro.id, quadro.getPosition().x);
                        return returnMachine;
                    } else {
                        if(quadro.getChar() !== "-") {
                            if(!quadro.labelX) {
                                quadro.labelX = quadro.getPosition().x;
                            }
                            quadro.label += quadro.getChar();
                        } else {
                            graph.setLabel(quadro.id, quadro.labelX, quadro.label);
                        }
                        quadro.get().markId = quadro.id;
                        quadro.move(RIGHT);
                        return me.trunk;
                    }
                },

                step: function(quadro) {
                    quadro.get().markId = quadro.id;
                    quadro.move(RIGHT);
                    return me.trunk;
                }
            };
            return me;
        })();

        function createBranchState(direction, offset) {
            var me = {
                name: "branchState",

                init: function(quadro) {
                    quadro.trunkId = quadro.get().markId;
                    quadro.move(direction).move(RIGHT);
                    return me.main;
                },

                main: function(quadro) {
                    if(quadro.getChar() === "-") {
                        return trunkState.init;
                    } else if(/[\/\\]/.test(quadro.getChar())) {
                        quadro.move(direction).move(RIGHT);
                        return me.main;
                    } else {
                        throw new Error("Illegal branch");
                    }
                }
            };
            return me;
        }

        var upBranchState = createBranchState(UP, -1);
        var downBranchState = createBranchState(DOWN, 1);

        function createMergeState(direction) {
            var me = {
                name: "mergeState",

                init: function(quadro) {
                    var position;

                    if(quadro.getChar() === "-") {
                        position = quadro.getPosition();
                        graph.setBranchEndX(quadro.id, position.x);
                        if(quadro.trunkId !== quadro.get().markId) {
                            throw new Error("Unsupported merge");
                        }
                        return returnMachine;
                    } else if(/[\/\\]/.test(quadro.getChar())) {
                        quadro.move(direction).move(RIGHT);
                        return me.init;
                    } else {
                        throw new Error("Illegal branch");
                    }
                }
            };
            return me;
        }

        var upMergeState = createMergeState(UP);
        var downMergeState = createMergeState(DOWN);

        var quadroObject = quadro(input);
        engine(quadroObject, initState);

        var i;
        var svg = createSvg();
        var svgRoot = svg.createCanvas(graph.getMaxX() + 20, graph.getMaxY() + 20);
        for(i = 1; i <= quadroObject.id; i++) {
            svg.addLine(svgRoot, graph.getX(i), graph.getY(i), graph.getEndX(i), graph.getY(i), "black");
            if(typeof graph.getTrunkId(i) === "number") {
                svg.addLine(svgRoot, graph.getBranchStartX(i), graph.getY(graph.getTrunkId(i)), graph.getX(i), graph.getY(i), "black");
                if(!isNaN(graph.getBranchEndX(i))) {
                    svg.addLine(svgRoot, graph.getEndX(i), graph.getY(i), graph.getBranchEndX(i), graph.getY(graph.getTrunkId(i)), "black");
                }
            }
            if(graph.getLabel) {
                svg.addText(svgRoot, graph.getLabel(i), graph.getLabelX(i), graph.getY(i) - 2, "sans-serif", 12);
            }
        }

        return svgRoot.toString();
    }

    if(typeof module !== "undefined" && module.exports) {
        module.exports = branch;
    } else {
        var opt = {
            scriptType: "text/x-branch-drawer"
        };

        function replaceChildNode(node, text) {
            var result,
                divNode;

            result = branch(text);
            divNode = document.createElement("div");
            divNode.innerHTML = result;
            node.parentNode.replaceChild(divNode, node);
        }

        document.addEventListener("DOMContentLoaded", function(e) {
            var i,
                scriptNodes;

            scriptNodes = document.getElementsByTagName("script");
            for(i = 0; i < scriptNodes.length;) {
                if(scriptNodes[i].type === opt.scriptType) {
                    replaceChildNode(scriptNodes[i], scriptNodes[i].text);
                } else {
                    i++;
                }
            }
        });
    }
})(this);

