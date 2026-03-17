let ALL_BRICKLINK_SOLID_COLORS = [
    { name: "154", id: "154", hex: "#853433" },
    { name: "21", id: "21", hex: "#cd2928" },
    { name: "220", id: "220", hex: "#ff7680" },
    { name: "124", id: "124", hex: "#b72c75" },
    { name: "221", id: "221", hex: "#d85fa5" },
    { name: "222", id: "222", hex: "#edaad6" },
    { name: "192", id: "192", hex: "#73483a" },
    { name: "308", id: "308", hex: "#523e37" },
    { name: "268", id: "268", hex: "#673e87" },
    { name: "A13", id: "A13", hex: "#8154ac" },
    { name: "324", id: "324", hex: "#ae78c2" },
    { name: "325", id: "325", hex: "#c0aedf" },
    { name: "38", id: "38", hex: "#ab5827" },
    { name: "312", id: "312", hex: "#b37c51" },
    { name: "138", id: "138", hex: "#998769" },
    { name: "5", id: "5", hex: "#dfc790" },
    { name: "226", id: "226", hex: "#fff076" },
    { name: "24", id: "24", hex: "#ffd300" },
    { name: "191", id: "191", hex: "#ffae11" },
    { name: "23", id: "23", hex: "#0065b2" },
    { name: "140", id: "140", hex: "#23405d" },
    { name: "A08", id: "A08", hex: "#ffd7c3" },
    { name: "283", id: "283", hex: "#ebc0a4" },
    { name: "A24", id: "A24", hex: "#f1b993" },
    { name: "A25", id: "A25", hex: "#ecac79" },
    { name: "18", id: "18", hex: "#de9064" },
    { name: "106", id: "106", hex: "#ff7e30" },
    { name: "321", id: "321", hex: "#0094d0" },
    { name: "322", id: "322", hex: "#00b5cc" },
    { name: "102", id: "102", hex: "#58a3da" },
    { name: "135", id: "135", hex: "#7b91a5" },
    { name: "212", id: "212", hex: "#93bce6" },
    { name: "107", id: "107", hex: "#009790" },
    { name: "323", id: "323", hex: "#c1efe3" },
    { name: "326", id: "326", hex: "#cbf193" },
    { name: "119", id: "119", hex: "#9cbb27" },
    { name: "37", id: "37", hex: "#00a64d" },
    { name: "28", id: "28", hex: "#00863a" },
    { name: "141", id: "141", hex: "#1a4d3b" },
    { name: "330", id: "330", hex: "#8d8f63" },
    { name: "151", id: "151", hex: "#749883" },
    { name: "1", id: "1", hex: "#f7f0e3" },
    { name: "194", id: "194", hex: "#a3a9aa" },
    { name: "199", id: "199", hex: "#6f7176" },
    { name: "A29", id: "A29", hex: "#4b4c50" },
    { name: "26", id: "26", hex: "#302e32" },
    { name: "297", id: "297", hex: "#b4823e" },
    { name: "179", id: "179", hex: "#7e7a85" },
    { name: "148", id: "148", hex: "#484649" },
];

const HEX_TO_COLOR_NAME = {};
ALL_BRICKLINK_SOLID_COLORS.forEach((color) => {
    HEX_TO_COLOR_NAME[color.hex] = color.name;
});

const COLOR_NAME_TO_ID = {};
ALL_BRICKLINK_SOLID_COLORS.forEach((color) => {
    COLOR_NAME_TO_ID[color.name] = color.id;
});

const BRICKLINK_STUD_COLORS = ALL_BRICKLINK_SOLID_COLORS.sort((a, b) => {
    return a.name > b.name ? 1 : -1;
});

const BRICKLINK_TILE_COLORS = ALL_BRICKLINK_SOLID_COLORS.sort((a, b) => {
    return a.name > b.name ? 1 : -1;
});

let ALL_VALID_BRICKLINK_COLORS = ALL_BRICKLINK_SOLID_COLORS.sort((a, b) => {
    return a.name > b.name ? 1 : -1;
});

const PIXEL_TYPE_OPTIONS = [
    {
        name: "1x1 Square Tile",
        number: "3070b",
    },
];

// use this for instructions - we prioritize readability over accuracy here
const PIXEL_TYPE_TO_FLATTENED = {
    98138: 98138,
    4073: 98138,
    3024: "3070b",
    "3070b": "3070b",
    3005: "3070b",
    variable_tile: "variable_tile",
    variable_plate: "variable_tile",
    variable_brick: "variable_tile",
};
