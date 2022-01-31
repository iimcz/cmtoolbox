// To parse this data:
//
//   import { Convert, PackageDescriptorGenerated } from "./file";
//
//   const packageDescriptorGenerated = Convert.toPackageDescriptorGenerated(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface PackageDescriptorGenerated {
    $schema:     string;
    inputs?:     Action[];
    metadata:    Metadata;
    package:     Package;
    parameters?: Parameters;
    sync?:       Sync;
    version:     string;
}

export interface Action {
    mapping: Mapping;
    name:    string;
    type:    Type;
}

export interface Mapping {
    eventName?:     string;
    source:         string;
    gestureName?:   string;
    condition?:     Condition;
    threshold?:     string;
    thresholdType?: ThresholdType;
}

export enum Condition {
    Above = "above",
    AboveOrEquals = "aboveOrEquals",
    Below = "below",
    BelowOrEquals = "belowOrEquals",
    Equals = "equals",
}

export enum ThresholdType {
    Float = "float",
    Integer = "integer",
}

export enum Type {
    Event = "event",
    Gesture = "gesture",
    GestureDrag = "gestureDrag",
    Value = "value",
    ValueTrigger = "valueTrigger",
}

export interface Metadata {
    author:     string;
    exposition: string;
    other?:     Other[];
}

export interface Other {
    key:   string;
    value: string;
}

export interface Package {
    checksum: string;
    url:      string;
}

export interface Parameters {
    displayType?: string;
    settings?:    Settings;
}

export interface Settings {
    backgroundColor?:      string;
    layout?:               Layout;
    layoutType?:           LayoutType;
    padding?:              Vector2;
    scrollDelay?:          number;
    slideAnimationLength?: number;
    cameraAnimation?:      CameraAnimation;
    fileName?:             string;
    flagInteraction?:      FlagInteraction;
    flags?:                ModelFlag[];
    skybox?:               string;
    skyboxTint?:           string;
    aspectRatio?:          AspectRatio;
    autoStart?:            boolean;
    loop?:                 boolean;
    videoEvents?:          VideoEvent[];
}

export enum AspectRatio {
    FitInside = "fitInside",
    FitOutside = "fitOutside",
    Stretch = "stretch",
}

export interface CameraAnimation {
    distance?:       number;
    height?:         number;
    lookAt?:         ModelCameraTarget;
    origin?:         ModelCameraTarget;
    revolutionTime?: number;
}

export interface ModelCameraTarget {
    objectName?: string;
    offset?:     Vector3;
}

export interface Vector3 {
    X?: number;
    Y?: number;
    Z?: number;
}

export enum FlagInteraction {
    Point = "point",
    Swipe = "swipe",
}

export interface ModelFlag {
    activatedAction?: string;
    backgroundColor?: string;
    canSelect?:       boolean;
    foregroundColor?: string;
    location?:        Vector3;
    selectedAction?:  string;
    stalkColor?:      string;
    text?:            string;
}

export interface Layout {
    height?:            number;
    horizontalSpacing?: number;
    images?:            GalleryImage[];
    verticalSpacing?:   number;
    width?:             number;
    spacing?:           number;
    visibleImages?:     number;
}

export interface GalleryImage {
    activatedAction?: string;
    fileName?:        string;
    selectedAction?:  string;
}

export enum LayoutType {
    Grid = "grid",
    List = "list",
}

export interface Vector2 {
    X?: number;
    Y?: number;
}

export interface VideoEvent {
    eventName?: string;
    timestamp?: number;
}

export interface Sync {
    canvasDimensions: CanvasDimensions;
    elements:         Element[];
    selfIndex:        number;
}

export interface CanvasDimensions {
    height?: number;
    width?:  number;
}

export interface Element {
    hostname:          string;
    role:              string;
    viewportTransform: string;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toPackageDescriptorGenerated(json: string): PackageDescriptorGenerated {
        return cast(JSON.parse(json), r("PackageDescriptorGenerated"));
    }

    public static packageDescriptorGeneratedToJson(value: PackageDescriptorGenerated): string {
        return JSON.stringify(uncast(value, r("PackageDescriptorGenerated")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any = ''): never {
    if (key) {
        throw Error(`Invalid value for key "${key}". Expected type ${JSON.stringify(typ)} but got ${JSON.stringify(val)}`);
    }
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`, );
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases, val);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue("Date", val);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, prop.key);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "PackageDescriptorGenerated": o([
        { json: "$schema", js: "$schema", typ: "" },
        { json: "inputs", js: "inputs", typ: u(undefined, a(r("Action"))) },
        { json: "metadata", js: "metadata", typ: r("Metadata") },
        { json: "package", js: "package", typ: r("Package") },
        { json: "parameters", js: "parameters", typ: u(undefined, r("Parameters")) },
        { json: "sync", js: "sync", typ: u(undefined, r("Sync")) },
        { json: "version", js: "version", typ: "" },
    ], false),
    "Action": o([
        { json: "mapping", js: "mapping", typ: r("Mapping") },
        { json: "name", js: "name", typ: "" },
        { json: "type", js: "type", typ: r("Type") },
    ], false),
    "Mapping": o([
        { json: "eventName", js: "eventName", typ: u(undefined, "") },
        { json: "source", js: "source", typ: "" },
        { json: "gestureName", js: "gestureName", typ: u(undefined, "") },
        { json: "condition", js: "condition", typ: u(undefined, r("Condition")) },
        { json: "threshold", js: "threshold", typ: u(undefined, "") },
        { json: "thresholdType", js: "thresholdType", typ: u(undefined, r("ThresholdType")) },
    ], false),
    "Metadata": o([
        { json: "author", js: "author", typ: "" },
        { json: "exposition", js: "exposition", typ: "" },
        { json: "other", js: "other", typ: u(undefined, a(r("Other"))) },
    ], false),
    "Other": o([
        { json: "key", js: "key", typ: "" },
        { json: "value", js: "value", typ: "" },
    ], false),
    "Package": o([
        { json: "checksum", js: "checksum", typ: "" },
        { json: "url", js: "url", typ: "" },
    ], false),
    "Parameters": o([
        { json: "displayType", js: "displayType", typ: u(undefined, "") },
        { json: "settings", js: "settings", typ: u(undefined, r("Settings")) },
    ], "any"),
    "Settings": o([
        { json: "backgroundColor", js: "backgroundColor", typ: u(undefined, "") },
        { json: "layout", js: "layout", typ: u(undefined, r("Layout")) },
        { json: "layoutType", js: "layoutType", typ: u(undefined, r("LayoutType")) },
        { json: "padding", js: "padding", typ: u(undefined, r("Vector2")) },
        { json: "scrollDelay", js: "scrollDelay", typ: u(undefined, 3.14) },
        { json: "slideAnimationLength", js: "slideAnimationLength", typ: u(undefined, 3.14) },
        { json: "cameraAnimation", js: "cameraAnimation", typ: u(undefined, r("CameraAnimation")) },
        { json: "fileName", js: "fileName", typ: u(undefined, "") },
        { json: "flagInteraction", js: "flagInteraction", typ: u(undefined, r("FlagInteraction")) },
        { json: "flags", js: "flags", typ: u(undefined, a(r("ModelFlag"))) },
        { json: "skybox", js: "skybox", typ: u(undefined, "") },
        { json: "skyboxTint", js: "skyboxTint", typ: u(undefined, "") },
        { json: "aspectRatio", js: "aspectRatio", typ: u(undefined, r("AspectRatio")) },
        { json: "autoStart", js: "autoStart", typ: u(undefined, true) },
        { json: "loop", js: "loop", typ: u(undefined, true) },
        { json: "videoEvents", js: "videoEvents", typ: u(undefined, a(r("VideoEvent"))) },
    ], false),
    "CameraAnimation": o([
        { json: "distance", js: "distance", typ: u(undefined, 3.14) },
        { json: "height", js: "height", typ: u(undefined, 3.14) },
        { json: "lookAt", js: "lookAt", typ: u(undefined, r("ModelCameraTarget")) },
        { json: "origin", js: "origin", typ: u(undefined, r("ModelCameraTarget")) },
        { json: "revolutionTime", js: "revolutionTime", typ: u(undefined, 3.14) },
    ], false),
    "ModelCameraTarget": o([
        { json: "objectName", js: "objectName", typ: u(undefined, "") },
        { json: "offset", js: "offset", typ: u(undefined, r("Vector3")) },
    ], false),
    "Vector3": o([
        { json: "X", js: "X", typ: u(undefined, 3.14) },
        { json: "Y", js: "Y", typ: u(undefined, 3.14) },
        { json: "Z", js: "Z", typ: u(undefined, 3.14) },
    ], false),
    "ModelFlag": o([
        { json: "activatedAction", js: "activatedAction", typ: u(undefined, "") },
        { json: "backgroundColor", js: "backgroundColor", typ: u(undefined, "") },
        { json: "canSelect", js: "canSelect", typ: u(undefined, true) },
        { json: "foregroundColor", js: "foregroundColor", typ: u(undefined, "") },
        { json: "location", js: "location", typ: u(undefined, r("Vector3")) },
        { json: "selectedAction", js: "selectedAction", typ: u(undefined, "") },
        { json: "stalkColor", js: "stalkColor", typ: u(undefined, "") },
        { json: "text", js: "text", typ: u(undefined, "") },
    ], false),
    "Layout": o([
        { json: "height", js: "height", typ: u(undefined, 3.14) },
        { json: "horizontalSpacing", js: "horizontalSpacing", typ: u(undefined, 3.14) },
        { json: "images", js: "images", typ: u(undefined, a(r("GalleryImage"))) },
        { json: "verticalSpacing", js: "verticalSpacing", typ: u(undefined, 3.14) },
        { json: "width", js: "width", typ: u(undefined, 3.14) },
        { json: "spacing", js: "spacing", typ: u(undefined, 3.14) },
        { json: "visibleImages", js: "visibleImages", typ: u(undefined, 3.14) },
    ], false),
    "GalleryImage": o([
        { json: "activatedAction", js: "activatedAction", typ: u(undefined, "") },
        { json: "fileName", js: "fileName", typ: u(undefined, "") },
        { json: "selectedAction", js: "selectedAction", typ: u(undefined, "") },
    ], false),
    "Vector2": o([
        { json: "X", js: "X", typ: u(undefined, 3.14) },
        { json: "Y", js: "Y", typ: u(undefined, 3.14) },
    ], false),
    "VideoEvent": o([
        { json: "eventName", js: "eventName", typ: u(undefined, "") },
        { json: "timestamp", js: "timestamp", typ: u(undefined, 3.14) },
    ], false),
    "Sync": o([
        { json: "canvasDimensions", js: "canvasDimensions", typ: r("CanvasDimensions") },
        { json: "elements", js: "elements", typ: a(r("Element")) },
        { json: "selfIndex", js: "selfIndex", typ: 0 },
    ], false),
    "CanvasDimensions": o([
        { json: "height", js: "height", typ: u(undefined, 0) },
        { json: "width", js: "width", typ: u(undefined, 0) },
    ], false),
    "Element": o([
        { json: "hostname", js: "hostname", typ: "" },
        { json: "role", js: "role", typ: "" },
        { json: "viewportTransform", js: "viewportTransform", typ: "" },
    ], false),
    "Condition": [
        "above",
        "aboveOrEquals",
        "below",
        "belowOrEquals",
        "equals",
    ],
    "ThresholdType": [
        "float",
        "integer",
    ],
    "Type": [
        "event",
        "gesture",
        "gestureDrag",
        "value",
        "valueTrigger",
    ],
    "AspectRatio": [
        "fitInside",
        "fitOutside",
        "stretch",
    ],
    "FlagInteraction": [
        "point",
        "swipe",
    ],
    "LayoutType": [
        "grid",
        "list",
    ],
};
