const availableTileHexes = BRICKLINK_TILE_COLORS.map((color) => color.hex);
const tileHexToCount = {};
availableTileHexes.forEach((hex) => {
    tileHexToCount[hex] = 99999;
});

STUD_MAPS = {
    // rgb: {
    //     name: "RGB",
    //     officialName: "RGB Example",
    //     sortedStuds: ["#ff6666", "#66ff66", "#6666ff"],
    //     studMap: {
    //         "#ff6666": 1000,
    //         "#66ff66": 1000,
    //         "#6666ff": 1000
    //     }
    // },
    all_tile_colors: {
        name: "All Tile Colors",
        officialName: "All Available Tile Colors",
        sortedStuds: availableTileHexes,
        studMap: tileHexToCount,
    },
};

const availableStudHexes = BRICKLINK_STUD_COLORS.map((color) => color.hex);
const studHexToCount = {};
availableStudHexes.forEach((hex) => {
    studHexToCount[hex] = 99999;
});

const availableSolidHexes = ALL_BRICKLINK_SOLID_COLORS.map(
    (color) => color.hex,
);
const solidHexToCount = {};
availableSolidHexes.forEach((hex) => {
    solidHexToCount[hex] = 99999;
});
