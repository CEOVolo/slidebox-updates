"use strict";
// =================================================================================
// SlideDeck 2.0 - Figma Plugin Code
// VERSION: 5.2 (Deep Nesting & Groups Support)
// =================================================================================
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
// Map to store handlers for async requests to the UI
var requestHandlers = new Map();
var API_URL = 'http://localhost:3000/api'; // Ensure this is correct
// --- GLOBAL COUNTERS FOR DIAGNOSTICS ---
var nodeCounter = {
    total: 0,
    byType: {},
    byDepth: {},
    maxDepth: 0
};
// --- INITIALIZATION ---
figma.showUI(__html__, { width: 340, height: 480, themeColors: true });
console.log('=== SlideDeck 2.0 Plugin Initialized ===');
console.log('VERSION: 5.2 (Deep Nesting & Groups Support)');
console.log('Улучшения: поддержка глубокой вложенности, правильные GROUP, статистика узлов');
// --- MESSAGE HANDLING ---
figma.ui.onmessage = function (msg) { return __awaiter(void 0, void 0, void 0, function () {
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log("[PLUGIN] Received message: ".concat(msg.type), msg.payload);
                _a = msg.type;
                switch (_a) {
                    case 'FETCH_PRESENTATION': return [3 /*break*/, 1];
                    case 'COPY_SLIDES': return [3 /*break*/, 3];
                    case 'OPEN_WEBAPP': return [3 /*break*/, 5];
                }
                return [3 /*break*/, 6];
            case 1: return [4 /*yield*/, handleFetchPresentation()];
            case 2:
                _b.sent();
                return [3 /*break*/, 7];
            case 3: return [4 /*yield*/, handleCopySlides(msg.payload)];
            case 4:
                _b.sent();
                return [3 /*break*/, 7];
            case 5:
                figma.openExternal("".concat(API_URL.replace('/api', '')));
                return [3 /*break*/, 7];
            case 6:
                console.warn("[PLUGIN] Unknown message type: ".concat(msg.type));
                _b.label = 7;
            case 7: return [2 /*return*/];
        }
    });
}); };
// --- CORE LOGIC ---
function handleFetchPresentation() {
    return __awaiter(this, void 0, void 0, function () {
        var response, errorText, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, fetch("".concat(API_URL, "/presentations/plugin/latest"))];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.text()];
                case 2:
                    errorText = _a.sent();
                    throw new Error("Server error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                case 3: return [4 /*yield*/, response.json()];
                case 4:
                    data = _a.sent();
                    console.log('[PLUGIN] Fetched presentation data:', data);
                    if (data.success && data.presentation) {
                        figma.ui.postMessage({ type: 'PRESENTATION_LOADED', payload: data.presentation });
                    }
                    else {
                        figma.ui.postMessage({ type: 'PRESENTATION_LOADED', payload: null });
                    }
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error('[PLUGIN] Error fetching presentation:', error_1);
                    figma.ui.postMessage({ type: 'FETCH_ERROR', payload: { error: error_1.message } });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function handleCopySlides(slides) {
    return __awaiter(this, void 0, void 0, function () {
        var newPage, createdNodes, successCount, errorCount, _a, _b, _c, index, slideInfo, node, e_1, e_2_1;
        var e_2, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (!slides || slides.length === 0) {
                        figma.notify('Нет слайдов для копирования.', { error: true });
                        return [2 /*return*/];
                    }
                    console.log("[COPY] Starting copy of ".concat(slides.length, " slides."));
                    newPage = figma.createPage();
                    newPage.name = "[SlideDeck] \u041A\u043E\u043F\u0438\u044F \u043F\u0440\u0435\u0437\u0435\u043D\u0442\u0430\u0446\u0438\u0438";
                    figma.currentPage = newPage;
                    createdNodes = [];
                    successCount = 0;
                    errorCount = 0;
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 8, 9, 10]);
                    _a = __values(slides.entries()), _b = _a.next();
                    _e.label = 2;
                case 2:
                    if (!!_b.done) return [3 /*break*/, 7];
                    _c = __read(_b.value, 2), index = _c[0], slideInfo = _c[1];
                    figma.ui.postMessage({
                        type: 'COPY_PROGRESS',
                        payload: { copied: index + 1, total: slides.length }
                    });
                    _e.label = 3;
                case 3:
                    _e.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, fetchAndRecreateNode(slideInfo, newPage)];
                case 4:
                    node = _e.sent();
                    if (node) {
                        // Позиционируем сразу, чтобы слайды не накладывались
                        node.x = index * (node.width + 100);
                        node.y = 0;
                        createdNodes.push(node);
                        successCount++;
                    }
                    else {
                        errorCount++;
                    }
                    return [3 /*break*/, 6];
                case 5:
                    e_1 = _e.sent();
                    console.error("[COPY] Failed to process slide ".concat(slideInfo.id), e_1);
                    figma.notify("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0438 \u0441\u043B\u0430\u0439\u0434\u0430 ".concat(index + 1, ": ").concat(slideInfo.title), { error: true });
                    errorCount++;
                    return [3 /*break*/, 6];
                case 6:
                    _b = _a.next();
                    return [3 /*break*/, 2];
                case 7: return [3 /*break*/, 10];
                case 8:
                    e_2_1 = _e.sent();
                    e_2 = { error: e_2_1 };
                    return [3 /*break*/, 10];
                case 9:
                    try {
                        if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                    }
                    finally { if (e_2) throw e_2.error; }
                    return [7 /*endfinally*/];
                case 10:
                    if (createdNodes.length > 0) {
                        // arrangeNodes уже не нужна, так как мы позиционировали при создании
                        figma.viewport.scrollAndZoomIntoView(createdNodes);
                    }
                    figma.ui.postMessage({ type: 'COPY_COMPLETE' });
                    // Выводим статистику
                    console.log('\n=== СТАТИСТИКА КОПИРОВАНИЯ ===');
                    console.log("\u0412\u0441\u0435\u0433\u043E \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043E \u0443\u0437\u043B\u043E\u0432: ".concat(nodeCounter.total));
                    console.log("\u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u0430\u044F \u0433\u043B\u0443\u0431\u0438\u043D\u0430: ".concat(nodeCounter.maxDepth));
                    console.log('Узлы по типам:', nodeCounter.byType);
                    console.log('Узлы по глубине:', nodeCounter.byDepth);
                    // Сбрасываем счётчики для следующего запуска
                    nodeCounter = { total: 0, byType: {}, byDepth: {}, maxDepth: 0 };
                    if (errorCount > 0) {
                        figma.notify("\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E \u0441 \u043E\u0448\u0438\u0431\u043A\u0430\u043C\u0438. \u0423\u0441\u043F\u0435\u0448\u043D\u043E: ".concat(successCount, ", \u041E\u0448\u0438\u0431\u043E\u043A: ").concat(errorCount), { error: true });
                    }
                    else {
                        figma.notify("\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E. \u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E \u0441\u043B\u0430\u0439\u0434\u043E\u0432: ".concat(successCount));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function fetchAndRecreateNode(slideInfo, parent) {
    return __awaiter(this, void 0, void 0, function () {
        var response, errorText, data, nodeData, recreatedNode, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("[NODE] Fetching data for slide: ".concat(slideInfo.title));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    return [4 /*yield*/, fetch("".concat(API_URL, "/figma/export-nodes"), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ slides: [{ figmaFileId: slideInfo.figmaFileId, figmaNodeId: slideInfo.figmaNodeId }] })
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.text()];
                case 3:
                    errorText = _a.sent();
                    throw new Error("Server returned ".concat(response.status, ": ").concat(errorText));
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    data = _a.sent();
                    nodeData = data.nodes[0];
                    if (!nodeData || !nodeData.node) {
                        throw new Error('Invalid node data received from server.');
                    }
                    return [4 /*yield*/, recreateNode(nodeData.node, parent, true)];
                case 6:
                    recreatedNode = _a.sent();
                    if (recreatedNode) {
                        parent.appendChild(recreatedNode);
                        return [2 /*return*/, recreatedNode];
                    }
                    return [2 /*return*/, null];
                case 7:
                    error_2 = _a.sent();
                    console.error("[NODE] Failed to fetch or recreate node for slide ".concat(slideInfo.title, ":"), error_2);
                    return [2 /*return*/, null];
                case 8: return [2 /*return*/];
            }
        });
    });
}
// --- NODE RECREATION ---
function recreateNode(nodeData_1, parent_1) {
    return __awaiter(this, arguments, void 0, function (nodeData, parent, isRoot, depth) {
        var indent, node, width, height, transform, frame, _a, e_3, _b, hasVectorPaths, hasVectorNetwork, convertConstraint, style, fontLoaded, primaryFontName, e_4, fallbackFontName, e2_1, safeFontName, defaultFont, _loop_1, _c, _d, childData, e_5_1, groupChildren, _e, _f, childData, childNode, e_6_1, booleanChildren, _g, _h, childData, childNode, e_7_1;
        var e_5, _j, e_6, _k, e_7, _l;
        var _m, _o, _p, _q, _r, _s;
        if (isRoot === void 0) { isRoot = false; }
        if (depth === void 0) { depth = 0; }
        return __generator(this, function (_t) {
            switch (_t.label) {
                case 0:
                    if (!nodeData || !nodeData.type) {
                        console.error('[RECREATE] Invalid nodeData received.', nodeData);
                        return [2 /*return*/, null];
                    }
                    indent = '  '.repeat(depth);
                    console.log("".concat(indent, "[RECREATE-").concat(depth, "] Processing: ").concat(nodeData.name, " (").concat(nodeData.type, ")"));
                    // Обновляем счётчики
                    nodeCounter.total++;
                    nodeCounter.byType[nodeData.type] = (nodeCounter.byType[nodeData.type] || 0) + 1;
                    nodeCounter.byDepth[depth] = (nodeCounter.byDepth[depth] || 0) + 1;
                    if (depth > nodeCounter.maxDepth)
                        nodeCounter.maxDepth = depth;
                    node = null;
                    // 1. Create the node itself
                    try {
                        switch (nodeData.type) {
                            case 'FRAME':
                                node = figma.createFrame();
                                break;
                            case 'GROUP':
                                // GROUP нужно создавать через figma.group позже, после создания детей
                                node = null; // Будет создан после обработки детей
                                console.log("".concat(indent, "[RECREATE] GROUP detected: ").concat(nodeData.name, ", will create after children"));
                                break;
                            case 'RECTANGLE':
                                node = figma.createRectangle();
                                break;
                            case 'TEXT':
                                node = figma.createText();
                                break;
                            case 'VECTOR':
                                node = figma.createVector();
                                break;
                            case 'ELLIPSE':
                                node = figma.createEllipse();
                                break;
                            case 'INSTANCE':
                                // INSTANCE не может быть создан напрямую, создаем FRAME со всеми свойствами
                                node = figma.createFrame();
                                console.log("[RECREATE] Converting INSTANCE to FRAME for node: ".concat(nodeData.name));
                                // Помечаем, что это был INSTANCE для специальной обработки
                                node._wasInstance = true;
                                break;
                            case 'LINE':
                                // LINE тоже создаем как VECTOR
                                node = figma.createVector();
                                console.log("[RECREATE] Converting LINE to VECTOR for node: ".concat(nodeData.name));
                                // Для LINE нужно установить vectorPaths из данных узла
                                if (nodeData.vectorPaths) {
                                    node.vectorPaths = nodeData.vectorPaths;
                                }
                                else if (nodeData.absoluteBoundingBox) {
                                    width = nodeData.absoluteBoundingBox.width || 100;
                                    height = nodeData.absoluteBoundingBox.height || 1;
                                    node.vectorPaths = [{
                                            windingRule: 'NONZERO',
                                            data: "M 0 0 L ".concat(width, " ").concat(height)
                                        }];
                                }
                                break;
                            case 'BOOLEAN_OPERATION':
                                // Временно создаём контейнер для детей
                                node = null; // Будет создан позже после обработки детей
                                console.log("[RECREATE] BOOLEAN_OPERATION detected: ".concat(nodeData.name, ", operation: ").concat(nodeData.booleanOperation));
                                break;
                            case 'STAR':
                                node = figma.createStar();
                                console.log("[RECREATE] Creating STAR node: ".concat(nodeData.name));
                                break;
                            case 'POLYGON':
                            case 'REGULAR_POLYGON':
                                node = figma.createPolygon();
                                console.log("[RECREATE] Creating POLYGON node: ".concat(nodeData.name));
                                break;
                            default:
                                console.warn("[RECREATE] Unsupported node type \"".concat(nodeData.type, "\". Creating a placeholder frame."));
                                node = figma.createFrame();
                                break;
                        }
                    }
                    catch (e) {
                        console.error("[RECREATE] Error creating node of type ".concat(nodeData.type), e);
                        return [2 /*return*/, null];
                    }
                    if (!node) return [3 /*break*/, 27];
                    node.name = nodeData.name;
                    if ('visible' in nodeData)
                        node.visible = nodeData.visible;
                    if ('opacity' in nodeData)
                        node.opacity = nodeData.opacity;
                    if (!isRoot) {
                        if (nodeData.relativeTransform) {
                            transform = nodeData.relativeTransform;
                            node.relativeTransform = transform;
                        }
                        else {
                            node.x = nodeData.x || 0;
                            node.y = nodeData.y || 0;
                        }
                    }
                    if (nodeData.absoluteBoundingBox) {
                        node.resize(nodeData.absoluteBoundingBox.width || 100, nodeData.absoluteBoundingBox.height || 100);
                    }
                    else if (nodeData.width && nodeData.height) {
                        node.resize(nodeData.width, nodeData.height);
                    }
                    if ('layoutMode' in node && nodeData.layoutMode) {
                        frame = node;
                        frame.layoutMode = nodeData.layoutMode;
                        if (nodeData.paddingLeft)
                            frame.paddingLeft = nodeData.paddingLeft;
                        if (nodeData.paddingRight)
                            frame.paddingRight = nodeData.paddingRight;
                        if (nodeData.paddingTop)
                            frame.paddingTop = nodeData.paddingTop;
                        if (nodeData.paddingBottom)
                            frame.paddingBottom = nodeData.paddingBottom;
                        if (nodeData.itemSpacing)
                            frame.itemSpacing = nodeData.itemSpacing;
                    }
                    if (!('fills' in node && Array.isArray(nodeData.fills))) return [3 /*break*/, 4];
                    console.log("[FILLS] Processing ".concat(nodeData.fills.length, " fills for node: ").concat(nodeData.name));
                    nodeData.fills.forEach(function (fill, index) {
                        if (fill.type === 'IMAGE') {
                            console.log("[FILLS] Fill ".concat(index, " is IMAGE type:"), {
                                hasImageRef: !!fill.imageRef,
                                hasImageUrl: !!fill.imageUrl,
                                hasImageData: !!fill.imageData,
                                visible: fill.visible !== false
                            });
                        }
                    });
                    _t.label = 1;
                case 1:
                    _t.trys.push([1, 3, , 4]);
                    _a = node;
                    return [4 /*yield*/, processPaints(nodeData.fills)];
                case 2:
                    _a.fills = _t.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_3 = _t.sent();
                    console.error("[FILLS] Error processing fills for node ".concat(nodeData.name, ":"), e_3);
                    // Попробуем установить пустой массив fills вместо ошибки
                    node.fills = [];
                    return [3 /*break*/, 4];
                case 4:
                    if (!('strokes' in node && Array.isArray(nodeData.strokes))) return [3 /*break*/, 6];
                    _b = node;
                    return [4 /*yield*/, processPaints(nodeData.strokes)];
                case 5:
                    _b.strokes = _t.sent();
                    _t.label = 6;
                case 6:
                    if ('strokeWeight' in node && typeof nodeData.strokeWeight === 'number') {
                        node.strokeWeight = nodeData.strokeWeight;
                    }
                    if ('strokeAlign' in node && nodeData.strokeAlign) {
                        node.strokeAlign = nodeData.strokeAlign;
                    }
                    if ('strokeCap' in node && nodeData.strokeCap) {
                        node.strokeCap = nodeData.strokeCap;
                    }
                    if ('strokeJoin' in node && nodeData.strokeJoin) {
                        node.strokeJoin = nodeData.strokeJoin;
                    }
                    if ('dashPattern' in node && Array.isArray(nodeData.dashPattern)) {
                        node.dashPattern = nodeData.dashPattern;
                    }
                    hasVectorPaths = nodeData.vectorPaths && nodeData.vectorPaths.length > 0;
                    hasVectorNetwork = nodeData.vectorNetwork && nodeData.vectorNetwork.vertices && nodeData.vectorNetwork.vertices.length > 0;
                    console.log("[VECTOR] Node \"".concat(nodeData.name, "\" (").concat(nodeData.type, ") vector data check:"), {
                        hasVectorPaths: hasVectorPaths,
                        hasVectorNetwork: hasVectorNetwork,
                        vectorPathsLength: ((_m = nodeData.vectorPaths) === null || _m === void 0 ? void 0 : _m.length) || 0,
                        vectorNetworkVertices: ((_p = (_o = nodeData.vectorNetwork) === null || _o === void 0 ? void 0 : _o.vertices) === null || _p === void 0 ? void 0 : _p.length) || 0
                    });
                    if ('vectorPaths' in node && hasVectorPaths) {
                        try {
                            console.log("[VECTOR] Applying vectorPaths to ".concat(nodeData.type, " node \"").concat(nodeData.name, "\""));
                            node.vectorPaths = nodeData.vectorPaths;
                            console.log("[VECTOR] \u2713 Successfully applied vectorPaths to ".concat(nodeData.type, " node \"").concat(nodeData.name, "\""));
                        }
                        catch (e) {
                            console.warn("[VECTOR] \u2717 Failed to apply vectorPaths to \"".concat(nodeData.name, "\":"), e);
                            // Try vectorNetwork as fallback
                            if ('vectorNetwork' in node && hasVectorNetwork) {
                                try {
                                    console.log("[VECTOR] Trying vectorNetwork as fallback for \"".concat(nodeData.name, "\""));
                                    node.vectorNetwork = nodeData.vectorNetwork;
                                    console.log("[VECTOR] \u2713 Applied vectorNetwork as fallback");
                                }
                                catch (e2) {
                                    console.error("[VECTOR] \u2717 Failed to apply vectorNetwork to \"".concat(nodeData.name, "\":"), e2);
                                }
                            }
                        }
                    }
                    else if ('vectorNetwork' in node && hasVectorNetwork) {
                        try {
                            console.log("[VECTOR] Applying vectorNetwork to ".concat(nodeData.type, " node \"").concat(nodeData.name, "\""));
                            node.vectorNetwork = nodeData.vectorNetwork;
                            console.log("[VECTOR] \u2713 Successfully applied vectorNetwork to ".concat(nodeData.type, " node \"").concat(nodeData.name, "\""));
                        }
                        catch (e) {
                            console.error("[VECTOR] \u2717 Failed to apply vectorNetwork to \"".concat(nodeData.name, "\":"), e);
                        }
                    }
                    else if (nodeData.type === 'VECTOR' || nodeData.type === 'LINE' || nodeData.type === 'STAR' || nodeData.type === 'POLYGON') {
                        console.log("[VECTOR] Node \"".concat(nodeData.name, "\" (").concat(nodeData.type, ") has no vector data!"));
                    }
                    // Дополнительные свойства для более точного копирования
                    if ('effects' in node && Array.isArray(nodeData.effects)) {
                        node.effects = nodeData.effects;
                    }
                    if ('blendMode' in node && nodeData.blendMode) {
                        node.blendMode = nodeData.blendMode;
                    }
                    if ('cornerRadius' in node && typeof nodeData.cornerRadius === 'number') {
                        node.cornerRadius = nodeData.cornerRadius;
                    }
                    if ('clipsContent' in node && typeof nodeData.clipsContent === 'boolean') {
                        node.clipsContent = nodeData.clipsContent;
                    }
                    if ('constraints' in node && nodeData.constraints) {
                        convertConstraint = function (value) {
                            switch (value) {
                                case 'TOP':
                                case 'LEFT':
                                    return 'MIN';
                                case 'BOTTOM':
                                case 'RIGHT':
                                    return 'MAX';
                                case 'CENTER':
                                    return 'CENTER';
                                case 'STRETCH':
                                    return 'STRETCH';
                                case 'SCALE':
                                    return 'SCALE';
                                default:
                                    return 'MIN'; // По умолчанию
                            }
                        };
                        node.constraints = {
                            horizontal: nodeData.constraints.horizontal ? convertConstraint(nodeData.constraints.horizontal) : 'MIN',
                            vertical: nodeData.constraints.vertical ? convertConstraint(nodeData.constraints.vertical) : 'MIN'
                        };
                    }
                    if ('layoutAlign' in node && nodeData.layoutAlign) {
                        node.layoutAlign = nodeData.layoutAlign;
                    }
                    if ('layoutGrow' in node && typeof nodeData.layoutGrow === 'number') {
                        node.layoutGrow = nodeData.layoutGrow;
                    }
                    // Обработка масок
                    if ('isMask' in node && nodeData.isMask !== undefined) {
                        node.isMask = nodeData.isMask;
                        console.log("[MASK] Applied isMask=".concat(nodeData.isMask, " to node: ").concat(nodeData.name));
                    }
                    if (!(node.type === 'TEXT' && nodeData.characters)) return [3 /*break*/, 19];
                    style = nodeData.style;
                    fontLoaded = null;
                    if (!((style === null || style === void 0 ? void 0 : style.fontFamily) && (style === null || style === void 0 ? void 0 : style.fontStyle))) return [3 /*break*/, 16];
                    primaryFontName = { family: style.fontFamily, style: style.fontStyle };
                    _t.label = 7;
                case 7:
                    _t.trys.push([7, 9, , 15]);
                    return [4 /*yield*/, figma.loadFontAsync(primaryFontName)];
                case 8:
                    _t.sent();
                    fontLoaded = primaryFontName;
                    return [3 /*break*/, 15];
                case 9:
                    e_4 = _t.sent();
                    console.warn("[TEXT] Failed to load primary font. Attempting fallback: ".concat(primaryFontName.family, " Regular"));
                    _t.label = 10;
                case 10:
                    _t.trys.push([10, 12, , 14]);
                    fallbackFontName = { family: primaryFontName.family, style: 'Regular' };
                    return [4 /*yield*/, figma.loadFontAsync(fallbackFontName)];
                case 11:
                    _t.sent();
                    fontLoaded = fallbackFontName;
                    return [3 /*break*/, 14];
                case 12:
                    e2_1 = _t.sent();
                    safeFontName = { family: 'Roboto', style: 'Regular' };
                    console.error("[TEXT] Fallback font also failed. Loading safe font: ".concat(safeFontName.family, " ").concat(safeFontName.style), e2_1);
                    return [4 /*yield*/, figma.loadFontAsync(safeFontName)];
                case 13:
                    _t.sent();
                    fontLoaded = safeFontName;
                    return [3 /*break*/, 14];
                case 14: return [3 /*break*/, 15];
                case 15: return [3 /*break*/, 18];
                case 16:
                    defaultFont = { family: 'Roboto', style: 'Regular' };
                    return [4 /*yield*/, figma.loadFontAsync(defaultFont)];
                case 17:
                    _t.sent();
                    fontLoaded = defaultFont;
                    _t.label = 18;
                case 18:
                    if (fontLoaded) {
                        node.fontName = fontLoaded;
                    }
                    // Apply other text properties
                    if (style === null || style === void 0 ? void 0 : style.fontSize) {
                        node.fontSize = style.fontSize;
                    }
                    if (style === null || style === void 0 ? void 0 : style.textAlignHorizontal) {
                        node.textAlignHorizontal = style.textAlignHorizontal;
                    }
                    if (style === null || style === void 0 ? void 0 : style.textAlignVertical) {
                        node.textAlignVertical = style.textAlignVertical;
                    }
                    // letterSpacing can be either a number or an object { value: number, unit: 'PIXELS' | 'PERCENT' }
                    if ((style === null || style === void 0 ? void 0 : style.letterSpacing) !== undefined) {
                        if (typeof style.letterSpacing === 'number') {
                            node.letterSpacing = { value: style.letterSpacing, unit: 'PIXELS' };
                        }
                        else if (typeof style.letterSpacing === 'object' && style.letterSpacing.value !== undefined) {
                            node.letterSpacing = style.letterSpacing;
                        }
                    }
                    if (style === null || style === void 0 ? void 0 : style.lineHeight) {
                        node.lineHeight = style.lineHeight;
                    }
                    // Must be set AFTER font is loaded and set
                    node.characters = nodeData.characters;
                    _t.label = 19;
                case 19:
                    // Дополнительные свойства для STAR и POLYGON
                    if (nodeData.type === 'STAR' && node.type === 'STAR') {
                        if (nodeData.pointCount !== undefined) {
                            node.pointCount = nodeData.pointCount;
                        }
                        if (nodeData.innerRadius !== undefined) {
                            node.innerRadius = nodeData.innerRadius;
                        }
                    }
                    if ((nodeData.type === 'POLYGON' || nodeData.type === 'REGULAR_POLYGON') && node.type === 'POLYGON') {
                        if (nodeData.pointCount !== undefined) {
                            node.pointCount = nodeData.pointCount;
                        }
                    }
                    // Специальная обработка для INSTANCE (компонентов)
                    if (node._wasInstance && nodeData.type === 'INSTANCE') {
                        // Копируем все свойства компонента
                        console.log("[INSTANCE] Processing component properties for: ".concat(nodeData.name));
                        // Применяем обрезку если она была
                        if ('clipsContent' in node && nodeData.clipsContent !== undefined) {
                            node.clipsContent = nodeData.clipsContent;
                            console.log("[INSTANCE] Applied clipsContent=".concat(nodeData.clipsContent));
                        }
                        // Сохраняем информацию о компоненте для отладки
                        if (nodeData.componentId) {
                            console.log("[INSTANCE] Original componentId: ".concat(nodeData.componentId));
                        }
                    }
                    if (!('children' in nodeData && 'appendChild' in node)) return [3 /*break*/, 27];
                    console.log("".concat(indent, "[CHILDREN] Processing ").concat(nodeData.children.length, " children for node: ").concat(nodeData.name, " at depth ").concat(depth));
                    // Выводим информацию о структуре слайда для отладки
                    if (nodeData.name === 'Splitter' || nodeData.name === 'Welcome to Andersen') {
                        console.log("[DEBUG] Structure of ".concat(nodeData.name, ":"), {
                            type: nodeData.type,
                            fillsCount: ((_q = nodeData.fills) === null || _q === void 0 ? void 0 : _q.length) || 0,
                            childrenCount: ((_r = nodeData.children) === null || _r === void 0 ? void 0 : _r.length) || 0,
                            children: (_s = nodeData.children) === null || _s === void 0 ? void 0 : _s.map(function (c) {
                                var _a, _b;
                                return ({
                                    name: c.name,
                                    type: c.type,
                                    hasFills: !!c.fills && c.fills.length > 0,
                                    fillsCount: ((_a = c.fills) === null || _a === void 0 ? void 0 : _a.length) || 0,
                                    hasImageFills: ((_b = c.fills) === null || _b === void 0 ? void 0 : _b.some(function (f) { return f.type === 'IMAGE'; })) || false
                                });
                            })
                        });
                    }
                    _loop_1 = function (childData) {
                        var imageFills, childNode;
                        return __generator(this, function (_u) {
                            switch (_u.label) {
                                case 0:
                                    console.log("[CHILDREN] Child: ".concat(childData.name, " (").concat(childData.type, ")"));
                                    // Специальная проверка для детей с масками
                                    if (childData.isMask) {
                                        console.log("[CHILDREN] Child ".concat(childData.name, " is a MASK"));
                                    }
                                    if (childData.type === 'FRAME' || childData.type === 'RECTANGLE' || childData.type === 'ELLIPSE') {
                                        // Проверяем, есть ли у дочернего элемента IMAGE fills
                                        if (childData.fills && Array.isArray(childData.fills)) {
                                            imageFills = childData.fills.filter(function (f) { return f.type === 'IMAGE'; });
                                            if (imageFills.length > 0) {
                                                console.log("[CHILDREN] Child ".concat(childData.name, " has ").concat(imageFills.length, " image fills"));
                                                // Проверяем, есть ли проблемы с изображениями
                                                imageFills.forEach(function (fill, idx) {
                                                    if (!fill.imageUrl && !fill.imageData) {
                                                        console.warn("[CHILDREN] Image fill ".concat(idx, " in ").concat(childData.name, " has no URL or data!"));
                                                    }
                                                });
                                            }
                                        }
                                    }
                                    return [4 /*yield*/, recreateNode(childData, node, false, depth + 1)];
                                case 1:
                                    childNode = _u.sent();
                                    if (childNode) {
                                        node.appendChild(childNode);
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _t.label = 20;
                case 20:
                    _t.trys.push([20, 25, 26, 27]);
                    _c = __values(nodeData.children), _d = _c.next();
                    _t.label = 21;
                case 21:
                    if (!!_d.done) return [3 /*break*/, 24];
                    childData = _d.value;
                    return [5 /*yield**/, _loop_1(childData)];
                case 22:
                    _t.sent();
                    _t.label = 23;
                case 23:
                    _d = _c.next();
                    return [3 /*break*/, 21];
                case 24: return [3 /*break*/, 27];
                case 25:
                    e_5_1 = _t.sent();
                    e_5 = { error: e_5_1 };
                    return [3 /*break*/, 27];
                case 26:
                    try {
                        if (_d && !_d.done && (_j = _c.return)) _j.call(_c);
                    }
                    finally { if (e_5) throw e_5.error; }
                    return [7 /*endfinally*/];
                case 27:
                    if (!(nodeData.type === 'GROUP' && !node)) return [3 /*break*/, 36];
                    groupChildren = [];
                    if (!nodeData.children) return [3 /*break*/, 35];
                    _t.label = 28;
                case 28:
                    _t.trys.push([28, 33, 34, 35]);
                    _e = __values(nodeData.children), _f = _e.next();
                    _t.label = 29;
                case 29:
                    if (!!_f.done) return [3 /*break*/, 32];
                    childData = _f.value;
                    return [4 /*yield*/, recreateNode(childData, parent, false, depth + 1)];
                case 30:
                    childNode = _t.sent();
                    if (childNode) {
                        groupChildren.push(childNode);
                    }
                    _t.label = 31;
                case 31:
                    _f = _e.next();
                    return [3 /*break*/, 29];
                case 32: return [3 /*break*/, 35];
                case 33:
                    e_6_1 = _t.sent();
                    e_6 = { error: e_6_1 };
                    return [3 /*break*/, 35];
                case 34:
                    try {
                        if (_f && !_f.done && (_k = _e.return)) _k.call(_e);
                    }
                    finally { if (e_6) throw e_6.error; }
                    return [7 /*endfinally*/];
                case 35:
                    // Создаём группу из детей
                    if (groupChildren.length > 0) {
                        try {
                            console.log("".concat(indent, "[GROUP] Attempting to create GROUP \"").concat(nodeData.name, "\" with ").concat(groupChildren.length, " children"));
                            node = figma.group(groupChildren, parent);
                            console.log("".concat(indent, "[GROUP] \u2713 Successfully created GROUP \"").concat(nodeData.name, "\" with ").concat(groupChildren.length, " children"));
                        }
                        catch (e) {
                            console.error("".concat(indent, "[GROUP] \u2717 Failed to create group \"").concat(nodeData.name, "\":"), e);
                            console.error("".concat(indent, "[GROUP] Error details:"), {
                                childrenCount: groupChildren.length,
                                parentType: parent.type,
                                childTypes: groupChildren.map(function (c) { return c.type; })
                            });
                            // Fallback: создаём frame
                            console.log("".concat(indent, "[GROUP] Using FRAME fallback for group \"").concat(nodeData.name, "\""));
                            node = figma.createFrame();
                            node.name = nodeData.name;
                            groupChildren.forEach(function (child) {
                                try {
                                    node.appendChild(child);
                                }
                                catch (appendError) {
                                    console.error("".concat(indent, "[GROUP] Failed to append child to frame:"), appendError);
                                }
                            });
                        }
                    }
                    else {
                        // Пустая группа - создаём frame
                        console.log("".concat(indent, "[GROUP] Empty group \"").concat(nodeData.name, "\" - creating frame"));
                        node = figma.createFrame();
                        node.name = nodeData.name;
                    }
                    // Применяем свойства группы
                    if (node) {
                        node.name = nodeData.name;
                        if ('visible' in nodeData)
                            node.visible = nodeData.visible;
                        if ('opacity' in nodeData)
                            node.opacity = nodeData.opacity;
                        // ВАЖНО: Применяем позиционирование!
                        if ('x' in nodeData && 'y' in nodeData) {
                            console.log("".concat(indent, "[GROUP] Setting position: x=").concat(nodeData.x, ", y=").concat(nodeData.y));
                            node.x = nodeData.x;
                            node.y = nodeData.y;
                        }
                        // Применяем поворот если есть
                        if ('rotation' in nodeData && nodeData.rotation) {
                            console.log("".concat(indent, "[GROUP] Setting rotation: ").concat(nodeData.rotation));
                            node.rotation = nodeData.rotation;
                        }
                    }
                    // Не обрабатываем детей повторно
                    nodeData.children = null;
                    _t.label = 36;
                case 36:
                    if (!(nodeData.type === 'BOOLEAN_OPERATION' && !node)) return [3 /*break*/, 45];
                    booleanChildren = [];
                    if (!nodeData.children) return [3 /*break*/, 44];
                    _t.label = 37;
                case 37:
                    _t.trys.push([37, 42, 43, 44]);
                    _g = __values(nodeData.children), _h = _g.next();
                    _t.label = 38;
                case 38:
                    if (!!_h.done) return [3 /*break*/, 41];
                    childData = _h.value;
                    return [4 /*yield*/, recreateNode(childData, parent, false, depth + 1)];
                case 39:
                    childNode = _t.sent();
                    if (childNode) {
                        booleanChildren.push(childNode);
                    }
                    _t.label = 40;
                case 40:
                    _h = _g.next();
                    return [3 /*break*/, 38];
                case 41: return [3 /*break*/, 44];
                case 42:
                    e_7_1 = _t.sent();
                    e_7 = { error: e_7_1 };
                    return [3 /*break*/, 44];
                case 43:
                    try {
                        if (_h && !_h.done && (_l = _g.return)) _l.call(_g);
                    }
                    finally { if (e_7) throw e_7.error; }
                    return [7 /*endfinally*/];
                case 44:
                    // Теперь применяем boolean операцию
                    if (booleanChildren.length >= 2 && nodeData.booleanOperation) {
                        try {
                            console.log("[RECREATE] Applying boolean operation: ".concat(nodeData.booleanOperation, " with ").concat(booleanChildren.length, " children"));
                            switch (nodeData.booleanOperation) {
                                case 'UNION':
                                    node = figma.union(booleanChildren, parent);
                                    break;
                                case 'INTERSECT':
                                    node = figma.intersect(booleanChildren, parent);
                                    break;
                                case 'SUBTRACT':
                                    node = figma.subtract(booleanChildren, parent);
                                    break;
                                case 'EXCLUDE':
                                    node = figma.exclude(booleanChildren, parent);
                                    break;
                                default:
                                    console.warn("[RECREATE] Unknown boolean operation: ".concat(nodeData.booleanOperation));
                                    // Fallback: создаём группу
                                    node = figma.group(booleanChildren, parent);
                                    break;
                            }
                            if (node) {
                                console.log("[RECREATE] Boolean operation successful!");
                            }
                            else {
                                throw new Error('Boolean operation returned null');
                            }
                        }
                        catch (e) {
                            console.error("[RECREATE] Failed to create boolean operation:", e);
                            // Fallback: создаём группу из детей
                            try {
                                node = figma.group(booleanChildren, parent);
                                console.log("[RECREATE] Created group as fallback for boolean operation");
                            }
                            catch (e2) {
                                console.error("[RECREATE] Failed to create group fallback:", e2);
                                // Последний fallback: frame с детьми
                                node = figma.createFrame();
                                booleanChildren.forEach(function (child) { return node.appendChild(child); });
                            }
                        }
                    }
                    else if (booleanChildren.length > 0) {
                        // Недостаточно детей для boolean операции, создаём группу
                        node = figma.group(booleanChildren, parent);
                    }
                    else {
                        // Нет детей, создаём пустой frame
                        node = figma.createFrame();
                    }
                    // Применяем свойства BOOLEAN_OPERATION
                    if (node) {
                        node.name = nodeData.name;
                        if ('visible' in nodeData)
                            node.visible = nodeData.visible;
                        if ('opacity' in nodeData)
                            node.opacity = nodeData.opacity;
                        // ВАЖНО: Применяем позиционирование!
                        if ('x' in nodeData && 'y' in nodeData) {
                            console.log("".concat(indent, "[BOOLEAN_OP] Setting position: x=").concat(nodeData.x, ", y=").concat(nodeData.y));
                            node.x = nodeData.x;
                            node.y = nodeData.y;
                        }
                        // Применяем поворот если есть
                        if ('rotation' in nodeData && nodeData.rotation) {
                            console.log("".concat(indent, "[BOOLEAN_OP] Setting rotation: ").concat(nodeData.rotation));
                            node.rotation = nodeData.rotation;
                        }
                    }
                    // Не обрабатываем детей повторно
                    nodeData.children = null;
                    _t.label = 45;
                case 45: return [2 /*return*/, node];
            }
        });
    });
}
function processPaints(paints) {
    return __awaiter(this, void 0, void 0, function () {
        var processed, paints_1, paints_1_1, p, image, base64Data, bytes, e_8, scaleMode, newPaint, _a, r, g, b, a, gradientPaint, e_9, e_10_1;
        var e_10, _b;
        var _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    processed = [];
                    if (!paints)
                        return [2 /*return*/, processed];
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, 13, 14, 15]);
                    paints_1 = __values(paints), paints_1_1 = paints_1.next();
                    _g.label = 2;
                case 2:
                    if (!!paints_1_1.done) return [3 /*break*/, 12];
                    p = paints_1_1.value;
                    if (p.visible === false)
                        return [3 /*break*/, 11];
                    _g.label = 3;
                case 3:
                    _g.trys.push([3, 10, , 11]);
                    if (!(p.type === 'IMAGE')) return [3 /*break*/, 8];
                    image = null;
                    console.log("[PAINTS] Processing image fill:", {
                        hasImageData: !!p.imageData,
                        isBig: !!p.big,
                        hasImageUrl: !!p.imageUrl,
                        imageRef: p.imageRef || 'none',
                        scaleMode: p.scaleMode || 'default'
                    });
                    // 1. Сначала пытаемся из base64 (для небольших картинок)
                    if (p.imageData) {
                        try {
                            base64Data = p.imageData;
                            if (p.imageData.includes(',')) {
                                base64Data = p.imageData.split(',')[1];
                            }
                            bytes = figma.base64Decode(base64Data);
                            image = figma.createImage(bytes);
                            console.log('[PAINTS] Успешно создано изображение из base64.');
                        }
                        catch (e) {
                            console.warn('[PAINTS] Ошибка создания изображения из base64:', e);
                            console.warn('[PAINTS] Base64 length:', ((_c = p.imageData) === null || _c === void 0 ? void 0 : _c.length) || 0);
                        }
                    }
                    if (!(!image && p.imageUrl)) return [3 /*break*/, 7];
                    _g.label = 4;
                case 4:
                    _g.trys.push([4, 6, , 7]);
                    console.log("[PAINTS] \u041F\u044B\u0442\u0430\u0435\u043C\u0441\u044F \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u043F\u043E URL: ".concat(p.imageUrl));
                    return [4 /*yield*/, figma.createImageAsync(p.imageUrl)];
                case 5:
                    image = _g.sent();
                    console.log('[PAINTS] Успешно создано изображение из URL.');
                    return [3 /*break*/, 7];
                case 6:
                    e_8 = _g.sent();
                    console.error('[PAINTS] Критическая ошибка: не удалось создать изображение и из URL.', e_8);
                    return [3 /*break*/, 7];
                case 7:
                    if (image) {
                        scaleMode = p.scaleMode || 'FILL';
                        if (scaleMode === 'STRETCH') {
                            scaleMode = 'FILL';
                        }
                        newPaint = {
                            type: 'IMAGE',
                            imageHash: image.hash,
                            scaleMode: scaleMode,
                            blendMode: p.blendMode,
                            opacity: p.opacity,
                            imageTransform: p.imageTransform,
                            scalingFactor: p.scalingFactor,
                            rotation: p.rotation,
                        };
                        processed.push(newPaint);
                    }
                    else {
                        console.error('[PAINTS] Не удалось создать изображение ни одним из способов. Слой останется без картинки.');
                    }
                    return [3 /*break*/, 9];
                case 8:
                    if (p.type === 'SOLID' && p.color) {
                        _a = p.color, r = _a.r, g = _a.g, b = _a.b, a = _a.a;
                        processed.push({
                            type: 'SOLID',
                            color: { r: r, g: g, b: b },
                            opacity: (_e = (_d = p.opacity) !== null && _d !== void 0 ? _d : a) !== null && _e !== void 0 ? _e : 1,
                            blendMode: p.blendMode,
                        });
                    }
                    else if (p.type && p.type.startsWith('GRADIENT')) {
                        gradientPaint = {
                            type: p.type,
                            gradientTransform: p.gradientTransform || [[1, 0, 0], [0, 1, 0]], // Default identity matrix
                            gradientStops: p.gradientStops || [],
                            opacity: (_f = p.opacity) !== null && _f !== void 0 ? _f : 1,
                        };
                        if (p.blendMode)
                            gradientPaint.blendMode = p.blendMode;
                        processed.push(gradientPaint);
                    }
                    _g.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    e_9 = _g.sent();
                    console.error("[PAINTS] Failed to process a paint fill.", { paint: p, error: e_9 });
                    return [3 /*break*/, 11];
                case 11:
                    paints_1_1 = paints_1.next();
                    return [3 /*break*/, 2];
                case 12: return [3 /*break*/, 15];
                case 13:
                    e_10_1 = _g.sent();
                    e_10 = { error: e_10_1 };
                    return [3 /*break*/, 15];
                case 14:
                    try {
                        if (paints_1_1 && !paints_1_1.done && (_b = paints_1.return)) _b.call(paints_1);
                    }
                    finally { if (e_10) throw e_10.error; }
                    return [7 /*endfinally*/];
                case 15: return [2 /*return*/, processed];
            }
        });
    });
}
// --- FALLBACK: PLACEHOLDER IMAGE CREATION ---
function createPlaceholderImage(nodeData, parent) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, width, height, rect, image, e_11, imageBytes, text;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log("[FALLBACK] Creating placeholder for node: ".concat(nodeData.nodeId));
                    _a = nodeData.node || { width: 1024, height: 768 }, width = _a.width, height = _a.height;
                    rect = figma.createRectangle();
                    rect.name = "[Placeholder] ".concat(((_b = nodeData.node) === null || _b === void 0 ? void 0 : _b.name) || nodeData.nodeId);
                    rect.resize(width, height);
                    parent.appendChild(rect);
                    image = null;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    if (!nodeData.imageUrl) return [3 /*break*/, 3];
                    return [4 /*yield*/, figma.createImageAsync(nodeData.imageUrl)];
                case 2:
                    image = _c.sent();
                    _c.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    e_11 = _c.sent();
                    console.error("[FALLBACK] Failed to create image from URL.", e_11);
                    image = null;
                    return [3 /*break*/, 5];
                case 5:
                    if (!image && nodeData.imageData) {
                        try {
                            imageBytes = figma.base64Decode(nodeData.imageData);
                            image = figma.createImage(imageBytes);
                        }
                        catch (e) {
                            console.error("[FALLBACK] Failed to create image from Base64 data.", e);
                        }
                    }
                    if (image) {
                        console.log("[FALLBACK] Image created successfully. Applying as fill.");
                        rect.fills = [{ type: 'IMAGE', scaleMode: 'FIT', imageHash: image.hash }];
                    }
                    else {
                        console.error("[FALLBACK] All image creation methods failed.");
                        rect.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
                        text = figma.createText();
                        text.characters = 'Image Failed to Load';
                        parent.appendChild(text);
                        text.x = rect.x + 50;
                        text.y = rect.y + 50;
                    }
                    return [2 /*return*/, rect];
            }
        });
    });
}
// --- UTILITY FUNCTIONS ---
function arrangeNodes(nodes) {
    var e_12, _a;
    var x = 0;
    try {
        for (var nodes_1 = __values(nodes), nodes_1_1 = nodes_1.next(); !nodes_1_1.done; nodes_1_1 = nodes_1.next()) {
            var node = nodes_1_1.value;
            node.x = x;
            x += node.width + 100;
        }
    }
    catch (e_12_1) { e_12 = { error: e_12_1 }; }
    finally {
        try {
            if (nodes_1_1 && !nodes_1_1.done && (_a = nodes_1.return)) _a.call(nodes_1);
        }
        finally { if (e_12) throw e_12.error; }
    }
}
